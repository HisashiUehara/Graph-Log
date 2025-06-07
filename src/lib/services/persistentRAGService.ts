import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PersistentRAGDocument {
  id: string;
  content: string;
  metadata: {
    timestamp: string;
    source: string;
    type: 'log' | 'query' | 'report' | 'analysis' | 'knowledge' | 'policy' | 'manual' | 'internal_text' | 'internal_image' | 'internal_video';
    userId?: string;
    namespace: 'logs' | 'knowledge' | 'projects' | 'security' | 'internal';
    department?: string;
    accessLevel?: 'public' | 'company' | 'department' | 'project';
    mediaType?: 'text' | 'image' | 'video';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    transcription?: string;
  };
  embedding?: number[];
}

export class PersistentRAGService {
  private static documents: PersistentRAGDocument[] = [];
  private static isInitialized = false;
  private static readonly STORAGE_KEY = 'graph-log-rag-data';
  private static readonly MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB
  
  // Server-side file storage path
  private static readonly FILE_STORAGE_PATH = path.join(process.cwd(), 'data', 'hybrid-rag-data.json');

  /**
   * 初期化
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 Initializing Persistent RAG Service...');
    
    try {
      // すべての永続化ストレージから読み込み
      await Promise.all([
        this.loadFromLocalStorage(),
        this.loadFromIndexedDB(),
        this.loadFromFileStorage() // Add file storage loading
      ]);
      
      this.isInitialized = true;
      console.log(`✅ Loaded ${this.documents.length} documents from persistent storage`);
    } catch (error) {
      console.error('Initialization error:', error);
      this.isInitialized = true; // Initialize anyway with empty data
    }
  }

  /**
   * LocalStorageへの保存
   */
  private static async saveToLocalStorage(): Promise<void> {
    try {
      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      const data = {
        documents: this.documents,
        timestamp: new Date().toISOString(),
      };
      
      const jsonData = JSON.stringify(data);
      if (jsonData.length > this.MAX_LOCALSTORAGE_SIZE) {
        console.warn('Data too large for localStorage, using IndexedDB only');
        return;
      }
      
      localStorage.setItem(this.STORAGE_KEY, jsonData);
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  /**
   * LocalStorageからのロード
   */
  private static async loadFromLocalStorage(): Promise<void> {
    try {
      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.documents && Array.isArray(data.documents)) {
          // 重複除去してマージ
          const existingIds = new Set(this.documents.map(d => d.id));
          const newDocs = data.documents.filter((doc: any) => !existingIds.has(doc.id));
          this.documents.push(...newDocs);
          console.log(`📥 Loaded ${newDocs.length} documents from localStorage`);
        }
      }
    } catch (error) {
      console.error('LocalStorage load error:', error);
    }
  }

  /**
   * File Storage (Server-side)への保存
   */
  private static async saveToFileStorage(): Promise<void> {
    try {
      // Server-side環境でのみ実行
      if (typeof window !== 'undefined') {
        return;
      }

      // Ensure data directory exists
      const dir = path.dirname(this.FILE_STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        documents: this.documents,
        timestamp: new Date().toISOString(),
      };
      
      fs.writeFileSync(this.FILE_STORAGE_PATH, JSON.stringify(data, null, 2));
      console.log('💾 Data saved to file storage');
    } catch (error) {
      console.error('File storage save error:', error);
    }
  }

  /**
   * File Storage (Server-side)からのロード
   */
  private static async loadFromFileStorage(): Promise<void> {
    try {
      // Server-side環境でのみ実行
      if (typeof window !== 'undefined') {
        return;
      }

      if (fs.existsSync(this.FILE_STORAGE_PATH)) {
        const data = JSON.parse(fs.readFileSync(this.FILE_STORAGE_PATH, 'utf8'));
        if (data.documents && Array.isArray(data.documents)) {
          // 重複除去してマージ
          const existingIds = new Set(this.documents.map(d => d.id));
          const newDocs = data.documents.filter((doc: any) => !existingIds.has(doc.id));
          this.documents.push(...newDocs);
          console.log(`📥 Loaded ${newDocs.length} documents from file storage`);
        }
      }
    } catch (error) {
      console.error('File storage load error:', error);
    }
  }

  /**
   * IndexedDBへの保存（大容量対応）
   */
  private static async saveToIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open('GraphLogRAG', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        
        // 全データを保存
        this.documents.forEach(doc => {
          store.put(doc);
        });
        
        transaction.oncomplete = () => {
          console.log('💾 Data saved to IndexedDB');
          resolve();
        };
        
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('namespace', 'metadata.namespace');
          store.createIndex('userId', 'metadata.userId');
          store.createIndex('timestamp', 'metadata.timestamp');
        }
      };
    });
  }

  /**
   * IndexedDBからのロード
   */
  private static async loadFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ブラウザ環境でのみ実行
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open('GraphLogRAG', 1);
      
      request.onerror = () => {
        console.warn('IndexedDB not available, using memory only');
        resolve();
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('documents')) {
          resolve();
          return;
        }
        
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const docs = getAllRequest.result || [];
          // 重複除去してマージ
          const existingIds = new Set(this.documents.map(d => d.id));
          const newDocs = docs.filter((doc: any) => !existingIds.has(doc.id));
          this.documents.push(...newDocs);
          console.log(`📥 Loaded ${newDocs.length} documents from IndexedDB`);
          resolve();
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('namespace', 'metadata.namespace');
          store.createIndex('userId', 'metadata.userId');
          store.createIndex('timestamp', 'metadata.timestamp');
        }
      };
    });
  }

  /**
   * ドキュメント追加（永続化対応）
   */
  static async addDocument(
    content: string, 
    metadata: Omit<PersistentRAGDocument['metadata'], 'timestamp'>
  ): Promise<string> {
    // 初期化確認
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const id = `${metadata.namespace}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const embedding = await this.generateEmbedding(content);
      
      const document: PersistentRAGDocument = {
        id,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        embedding,
      };

      // メモリに追加
      this.documents.push(document);
      
      // 永続化（バックグラウンド）
      setTimeout(async () => {
        await Promise.all([
          this.saveToLocalStorage(),
          this.saveToIndexedDB(),
          this.saveToFileStorage() // Add file storage
        ]);
      }, 100);
      
      console.log(`Document added to ${metadata.namespace}: ${id}`);
      return id;
    } catch (error) {
      console.error('Document addition error:', error);
      throw new Error('ドキュメントの追加に失敗しました');
    }
  }

  /**
   * Embedding生成
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * Internal Knowledge専用ドキュメント追加
   */
  static async addInternalKnowledge(
    content: string,
    metadata: {
      source: string;
      type: 'internal_text' | 'internal_image' | 'internal_video';
      userId?: string;
      department?: string;
      accessLevel?: 'public' | 'company' | 'department' | 'project';
      mediaType?: 'text' | 'image' | 'video';
      mediaUrl?: string;
      fileName?: string;
      fileSize?: number;
      transcription?: string;
    }
  ): Promise<string> {
    return this.addDocument(content, {
      ...metadata,
      namespace: 'internal',
    });
  }

  /**
   * Internal Knowledge検索（RAG searchから分離）
   */
  static async searchInternalKnowledge(
    query: string,
    config: {
      userId?: string;
      department?: string;
      accessLevel?: string[];
      mediaTypes?: string[];
      threshold?: number;
      limit?: number;
    } = {}
  ): Promise<(PersistentRAGDocument & { similarity: number })[]> {
    const {
      userId,
      department,
      accessLevel = ['public', 'internal'],
      mediaTypes = ['text', 'image', 'video'],
      threshold = 0.3,
      limit = 10
    } = config;

    // 初期化確認
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Internal namespace のドキュメントのみをフィルタ
      const candidates = this.documents.filter(doc => {
        if (doc.metadata.namespace !== 'internal') return false;
        
        // アクセスレベルチェック
        if (doc.metadata.accessLevel && !accessLevel.includes(doc.metadata.accessLevel)) {
          return false;
        }
        
        // 部署チェック（指定されている場合）
        if (department && doc.metadata.department && doc.metadata.department !== department) {
          return false;
        }
        
        // メディアタイプチェック
        if (doc.metadata.mediaType && !mediaTypes.includes(doc.metadata.mediaType)) {
          return false;
        }
        
        return true;
      });

      // 類似度計算
      const results = candidates
        .map(doc => {
          const similarity = doc.embedding 
            ? this.cosineSimilarity(queryEmbedding, doc.embedding)
            : 0;
          return { ...doc, similarity };
        })
        .filter(result => result.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log(`🔍 Internal Knowledge search: ${results.length} results found`);
      return results;
    } catch (error) {
      console.error('Internal Knowledge search error:', error);
      throw new Error('Internal Knowledge検索に失敗しました');
    }
  }

  /**
   * ハイブリッド検索（ログ + ナレッジ + Internal Knowledge統合）
   */
  static async hybridSearch(
    query: string,
    config: {
      userId?: string;
      includeNamespaces?: string[];
      includeInternal?: boolean; // Internal Knowledge含むかどうか
      logWeight?: number;
      knowledgeWeight?: number;
      internalWeight?: number; // Internal Knowledge重み
      threshold?: number;
      limit?: number;
    } = {}
  ): Promise<{
    logs: (PersistentRAGDocument & { similarity: number })[];
    knowledge: (PersistentRAGDocument & { similarity: number })[];
    internal: (PersistentRAGDocument & { similarity: number })[];
    integrated: (PersistentRAGDocument & { similarity: number; relevanceScore: number })[];
    summary: string;
  }> {
    const {
      userId,
      includeNamespaces = ['logs', 'knowledge', 'security', 'projects'],
      includeInternal = true,
      logWeight = 1.0,
      knowledgeWeight = 1.2,
      internalWeight = 1.1,
      threshold = 0.3,
      limit = 5
    } = config;

    // 初期化確認
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Hybrid search: "${query}" (namespaces: ${includeNamespaces.join(', ')}${includeInternal ? ', internal' : ''})`);
      
      // 並列検索
      const [logs, knowledge, internal] = await Promise.all([
        this.searchNamespace(query, ['logs'], userId, threshold, limit),
        this.searchNamespace(query, ['knowledge', 'security', 'projects'], userId, threshold, limit),
        includeInternal 
          ? this.searchInternalKnowledge(query, { userId, threshold, limit })
          : Promise.resolve([])
      ]);

      // 統合結果の計算
      const integrated = [
        ...logs.map(doc => ({ ...doc, relevanceScore: doc.similarity * logWeight })),
        ...knowledge.map(doc => ({ ...doc, relevanceScore: doc.similarity * knowledgeWeight })),
        ...internal.map(doc => ({ ...doc, relevanceScore: doc.similarity * internalWeight })),
      ]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      // AI要約生成
      const summary = await this.generateSearchSummary(query, integrated);

      console.log(`✅ Hybrid search completed: ${integrated.length} integrated results`);
      
      return {
        logs,
        knowledge,
        internal,
        integrated,
        summary,
      };
    } catch (error) {
      console.error('Hybrid search error:', error);
      throw new Error('ハイブリッド検索に失敗しました');
    }
  }

  /**
   * ネームスペース検索
   */
  private static async searchNamespace(
    query: string,
    namespaces: string[],
    userId?: string,
    threshold: number = 0.3,
    limit: number = 5
  ): Promise<(PersistentRAGDocument & { similarity: number })[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    const filtered = this.documents.filter(doc => {
      const nsMatch = namespaces.includes(doc.metadata.namespace);
      const userMatch = !userId || !doc.metadata.userId || doc.metadata.userId === userId;
      return nsMatch && userMatch;
    });

    const withSimilarity = filtered
      .filter(doc => doc.embedding)
      .map(doc => ({
        ...doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding!)
      }))
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return withSimilarity;
  }

  /**
   * 検索結果要約生成
   */
  private static async generateSearchSummary(
    query: string,
    results: (PersistentRAGDocument & { similarity: number })[]
  ): Promise<string> {
    if (results.length === 0) {
      return `「${query}」に関連する情報は見つかりませんでした。`;
    }

    const context = results.slice(0, 3).map((doc, i) => 
      `[${i + 1}] ${doc.metadata.type}: ${doc.content.substring(0, 200)}...`
    ).join('\n\n');

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたは検索結果を要約する専門家です。簡潔で有用な要約を作成してください。'
          },
          {
            role: 'user',
            content: `質問: ${query}\n\n検索結果:\n${context}\n\n上記の結果を基に、質問に対する簡潔な要約を作成してください。`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      return completion.choices[0].message.content || '要約の生成に失敗しました。';
    } catch (error) {
      console.error('Summary generation error:', error);
      return `${results.length}件の関連情報が見つかりました。ログ分析結果と社内ナレッジを組み合わせた回答をご確認ください。`;
    }
  }

  /**
   * コサイン類似度計算
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * データベース統計
   */
  static async getStats(): Promise<{
    total: number;
    byNamespace: Record<string, number>;
    byType: Record<string, number>;
    storageInfo: {
      memoryCount: number;
      localStorageAvailable: boolean;
      indexedDBAvailable: boolean;
      environment: 'browser' | 'server';
    };
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const byNamespace: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.documents.forEach(doc => {
      byNamespace[doc.metadata.namespace] = (byNamespace[doc.metadata.namespace] || 0) + 1;
      byType[doc.metadata.type] = (byType[doc.metadata.type] || 0) + 1;
    });

    const isServer = typeof window === 'undefined';

    return {
      total: this.documents.length,
      byNamespace,
      byType,
      storageInfo: {
        memoryCount: this.documents.length,
        localStorageAvailable: !isServer && typeof localStorage !== 'undefined',
        indexedDBAvailable: !isServer && typeof indexedDB !== 'undefined',
        environment: isServer ? 'server' : 'browser'
      }
    };
  }

  /**
   * データクリーンアップ（古いデータの削除）
   */
  static async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const before = this.documents.length;
    this.documents = this.documents.filter(doc => 
      new Date(doc.metadata.timestamp) > cutoffDate
    );
    const removed = before - this.documents.length;

    if (removed > 0) {
      await Promise.all([
        this.saveToLocalStorage(),
        this.saveToIndexedDB()
      ]);
      console.log(`🧹 Cleaned up ${removed} old documents`);
    }

    return removed;
  }
} 