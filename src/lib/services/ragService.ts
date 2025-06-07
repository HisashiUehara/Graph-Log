import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    timestamp: string;
    source: string;
    type: 'log' | 'query' | 'report' | 'analysis';
    userId?: string;
  };
  embedding?: number[];
}

export class RAGService {
  private static documents: RAGDocument[] = [];

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
   * ドキュメントを追加
   */
  static async addDocument(content: string, metadata: Omit<RAGDocument['metadata'], 'timestamp'>): Promise<string> {
    try {
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const embedding = await this.generateEmbedding(content);
      
      const document: RAGDocument = {
        id,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        embedding,
      };

      this.documents.push(document);
      
      // 実際のプロダクションでは、ここでデータベースに保存
      console.log(`Document added: ${id}`);
      
      return id;
    } catch (error) {
      console.error('Document addition error:', error);
      throw new Error('ドキュメントの追加に失敗しました');
    }
  }

  /**
   * コサイン類似度を計算
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 類似ドキュメントを検索
   */
  static async searchSimilarDocuments(
    query: string, 
    limit: number = 5,
    threshold: number = 0.7,
    filters?: Partial<RAGDocument['metadata']>
  ): Promise<RAGDocument[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      let filteredDocuments = this.documents;
      
      // フィルターを適用
      if (filters) {
        filteredDocuments = this.documents.filter(doc => {
          return Object.entries(filters).every(([key, value]) => {
            return doc.metadata[key as keyof RAGDocument['metadata']] === value;
          });
        });
      }

      // 類似度を計算してソート
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
      console.error('Document search error:', error);
      throw new Error('ドキュメントの検索に失敗しました');
    }
  }

  /**
   * ユーザーの全入力データを取得
   */
  static getUserDocuments(userId: string, type?: RAGDocument['metadata']['type']): RAGDocument[] {
    return this.documents.filter(doc => {
      const matchesUser = doc.metadata.userId === userId;
      const matchesType = !type || doc.metadata.type === type;
      return matchesUser && matchesType;
    });
  }

  /**
   * RAGを使用した回答生成
   */
  static async generateRAGResponse(
    query: string,
    userId?: string,
    systemPrompt?: string
  ): Promise<string> {
    try {
      // 関連ドキュメントを検索
      const relevantDocs = await this.searchSimilarDocuments(query, 5, 0.5, 
        userId ? { userId } : undefined
      );

      // ユーザーの全入力データも参考にする
      const userDocs = userId ? this.getUserDocuments(userId) : [];

      // コンテキストを構築
      const context = relevantDocs
        .map(doc => `[${doc.metadata.type}] ${doc.content}`)
        .join('\n\n');

      const userDataSummary = userDocs
        .map(doc => `[${doc.metadata.type}] ${doc.content.substring(0, 200)}...`)
        .join('\n');

      const defaultSystemPrompt = `あなたは情報整理・要約の専門AIアシスタントです。

**主な役割:**
- ユーザーが過去に入力したログデータ、分析結果、レポートを総合的に整理
- 複雑な技術情報をわかりやすく要約・説明
- ユーザーの質問に対して、関連する情報を体系的にまとめて回答

**回答スタイル:**
- 簡潔で理解しやすい日本語
- 重要なポイントを箇条書きで整理
- 必要に応じて具体例を含める
- 技術的な内容は専門用語を適切に説明

**参考データ:**
関連情報:
${context}

ユーザーの過去の入力データ:
${userDataSummary}

上記の情報を参考に、ユーザーの質問に対してわかりやすく整理された回答を提供してください。`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt || defaultSystemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return response.choices[0].message.content || '申し訳ございませんが、回答を生成できませんでした。';
    } catch (error) {
      console.error('RAG response generation error:', error);
      throw new Error('RAG回答の生成に失敗しました');
    }
  }

  /**
   * ドキュメント統計を取得
   */
  static getDocumentStats(userId?: string): {
    total: number;
    byType: Record<string, number>;
    recent: RAGDocument[];
  } {
    const userDocs = userId 
      ? this.documents.filter(doc => doc.metadata.userId === userId)
      : this.documents;

    const byType = userDocs.reduce((acc, doc) => {
      acc[doc.metadata.type] = (acc[doc.metadata.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = userDocs
      .sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
      .slice(0, 10);

    return {
      total: userDocs.length,
      byType,
      recent,
    };
  }
} 