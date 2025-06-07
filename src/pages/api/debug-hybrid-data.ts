import type { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '../../lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debugging Hybrid RAG Data...');
    
    // 初期化
    await PersistentRAGService.initialize();
    
    // 統計取得
    const stats = await PersistentRAGService.getStats();
    
    // すべてのドキュメントを取得（プライベートメソッドを外部から確認）
    const allDocuments = (PersistentRAGService as any).documents || [];
    
    // データ詳細分析
    const documentDetails = allDocuments.slice(0, 10).map((doc: any, index: number) => ({
      index: index + 1,
      id: doc.id,
      contentPreview: doc.content.substring(0, 100) + '...',
      type: doc.metadata.type,
      namespace: doc.metadata.namespace,
      source: doc.metadata.source,
      hasEmbedding: !!doc.embedding,
      embeddingLength: doc.embedding?.length || 0,
      timestamp: doc.metadata.timestamp
    }));

    // 簡単な検索テスト
    let searchTest = null;
    if (allDocuments.length > 0) {
      try {
        searchTest = await PersistentRAGService.hybridSearch('エラー', {
          threshold: 0.0, // 最小閾値
          limit: 3
        });
      } catch (error) {
        searchTest = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    res.status(200).json({
      success: true,
      debug: {
        stats,
        totalDocuments: allDocuments.length,
        documentDetails,
        searchTest: searchTest ? {
          query: 'エラー',
          resultsCount: searchTest.integrated?.length || 0,
          hasError: !!searchTest.error,
          error: searchTest.error || null,
          firstResult: searchTest.integrated?.[0] ? {
            type: searchTest.integrated[0].metadata.type,
            similarity: searchTest.integrated[0].similarity,
            contentPreview: searchTest.integrated[0].content.substring(0, 50) + '...'
          } : null
        } : null,
        environment: {
          isServer: typeof window === 'undefined',
          nodeEnv: process.env.NODE_ENV,
          hasOpenAI: !!process.env.OPENAI_API_KEY
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'デバッグ処理中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 