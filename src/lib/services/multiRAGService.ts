import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MultiRAGDocument {
  id: string;
  content: string;
  metadata: {
    timestamp: string;
    source: string;
    type: 'log' | 'query' | 'report' | 'analysis' | 'knowledge' | 'policy' | 'manual';
    userId?: string;
    namespace: 'logs' | 'knowledge' | 'projects' | 'security';
    department?: string;
    accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  embedding?: number[];
}

export class MultiRAGService {
  private static documents: MultiRAGDocument[] = [];

  /**
   * ネームスペース別にドキュメントを追加
   */
  static async addDocument(
    content: string, 
    metadata: Omit<MultiRAGDocument['metadata'], 'timestamp'>
  ): Promise<string> {
    try {
      const id = `${metadata.namespace}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const embedding = await this.generateEmbedding(content);
      
      const document: MultiRAGDocument = {
        id,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        embedding,
      };

      this.documents.push(document);
      
      console.log(`Document added to ${metadata.namespace}: ${id}`);
      return id;
    } catch (error) {
      console.error('Document addition error:', error);
      throw new Error('ドキュメントの追加に失敗しました');
    }
  }

  /**
   * テキストの埋め込みベクトルを生成
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
   * ネームスペース指定検索
   */
  static async searchByNamespace(
    query: string,
    namespaces: string[],
    limit: number = 5,
    threshold: number = 0.7,
    accessLevel?: string,
    userId?: string
  ): Promise<MultiRAGDocument[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      // ネームスペースとアクセス制御でフィルタリング
      let filteredDocuments = this.documents.filter(doc => {
        const namespaceMatch = namespaces.includes(doc.metadata.namespace);
        const accessMatch = !accessLevel || this.checkAccess(doc.metadata.accessLevel, accessLevel);
        const userMatch = !userId || !doc.metadata.userId || doc.metadata.userId === userId;
        
        return namespaceMatch && accessMatch && userMatch;
      });

      // 類似度計算と返却
      const documentsWithSimilarity = filteredDocuments
        .filter(doc => doc.embedding)
        .map(doc => ({
          ...doc,
          similarity: this.cosineSimilarity(queryEmbedding, doc.embedding!),
        }))
        .filter(doc => doc.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return documentsWithSimilarity;
    } catch (error) {
      console.error('Namespace search error:', error);
      throw new Error('ネームスペース検索に失敗しました');
    }
  }

  /**
   * 統合検索（複数ネームスペースを横断）
   */
  static async integratedSearch(
    query: string,
    config: {
      logWeight?: number;
      knowledgeWeight?: number;
      limit?: number;
      threshold?: number;
      userId?: string;
    } = {}
  ): Promise<{
    logs: (MultiRAGDocument & { similarity: number })[];
    knowledge: (MultiRAGDocument & { similarity: number })[];
    combined: (MultiRAGDocument & { similarity: number; weightedScore: number })[];
  }> {
    const {
      logWeight = 0.7,
      knowledgeWeight = 0.3,
      limit = 10,
      threshold = 0.5,
      userId
    } = config;

    // 各ネームスペースから検索
    const logResults = await this.searchByNamespace(
      query, 
      ['logs'], 
      Math.ceil(limit * logWeight),
      threshold,
      'internal',
      userId
    ) as (MultiRAGDocument & { similarity: number })[];

    const knowledgeResults = await this.searchByNamespace(
      query,
      ['knowledge', 'projects'],
      Math.ceil(limit * knowledgeWeight),
      threshold,
      'internal'
    ) as (MultiRAGDocument & { similarity: number })[];

    // 重み付きスコアで統合
    const combinedResults = [
      ...logResults.map(doc => ({ ...doc, weightedScore: doc.similarity * logWeight })),
      ...knowledgeResults.map(doc => ({ ...doc, weightedScore: doc.similarity * knowledgeWeight }))
    ]
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, limit);

    return {
      logs: logResults,
      knowledge: knowledgeResults,
      combined: combinedResults
    };
  }

  /**
   * 社内ナレッジ専用検索
   */
  static async searchCompanyKnowledge(
    query: string,
    department?: string,
    limit: number = 5
  ): Promise<MultiRAGDocument[]> {
    const results = await this.searchByNamespace(
      query,
      ['knowledge', 'projects', 'security'],
      limit,
      0.6,
      'internal'
    );

    // 部署フィルタリング
    if (department) {
      return results.filter(doc => 
        !doc.metadata.department || doc.metadata.department === department
      );
    }

    return results;
  }

  /**
   * アクセス権限チェック
   */
  private static checkAccess(docLevel?: string, userLevel?: string): boolean {
    const levels = ['public', 'internal', 'confidential', 'restricted'];
    const docIndex = levels.indexOf(docLevel || 'public');
    const userIndex = levels.indexOf(userLevel || 'public');
    return userIndex >= docIndex;
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
   * ネームスペース統計
   */
  static getNamespaceStats(): Record<string, {
    total: number;
    byType: Record<string, number>;
    byAccessLevel: Record<string, number>;
  }> {
    const stats: any = {};
    
    for (const doc of this.documents) {
      const ns = doc.metadata.namespace;
      if (!stats[ns]) {
        stats[ns] = {
          total: 0,
          byType: {},
          byAccessLevel: {}
        };
      }
      
      stats[ns].total++;
      stats[ns].byType[doc.metadata.type] = (stats[ns].byType[doc.metadata.type] || 0) + 1;
      stats[ns].byAccessLevel[doc.metadata.accessLevel || 'public'] = 
        (stats[ns].byAccessLevel[doc.metadata.accessLevel || 'public'] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * データ移行ヘルパー（既存RAGから移行）
   */
  static async migrateFromExistingRAG(
    existingDocuments: any[],
    targetNamespace: 'logs' | 'knowledge' | 'projects' | 'security'
  ): Promise<number> {
    let migratedCount = 0;
    
    for (const doc of existingDocuments) {
      try {
        await this.addDocument(doc.content, {
          source: doc.metadata.source,
          type: doc.metadata.type,
          userId: doc.metadata.userId,
          namespace: targetNamespace,
          accessLevel: 'internal'
        });
        migratedCount++;
      } catch (error) {
        console.error('Migration error for document:', doc.id, error);
      }
    }
    
    return migratedCount;
  }
} 