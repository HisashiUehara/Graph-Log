import type { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '../../lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('⚡ Quick Hybrid Test - Same Session');
    
    // 初期化
    await PersistentRAGService.initialize();
    
    // テストデータを追加
    const testData = [
      {
        content: 'Database connection error: timeout after 30 seconds',
        metadata: {
          source: 'test.log',
          type: 'log' as const,
          namespace: 'logs' as const,
          userId: 'test-user'
        }
      },
      {
        content: 'システム監視マニュアル: データベースエラーの対処方法',
        metadata: {
          source: 'manual.md',
          type: 'manual' as const,
          namespace: 'knowledge' as const
        }
      }
    ];

    // データ追加
    const addedIds = [];
    for (const item of testData) {
      const id = await PersistentRAGService.addDocument(item.content, item.metadata);
      addedIds.push(id);
    }

    // 即座に統計確認
    const stats = await PersistentRAGService.getStats();
    
    // 即座に検索テスト
    const searchResults = await PersistentRAGService.hybridSearch('データベースエラー', {
      threshold: 0.1,
      limit: 5
    });

    res.status(200).json({
      success: true,
      message: '同一セッション内テスト完了',
      added: {
        count: addedIds.length,
        ids: addedIds
      },
      stats,
      search: {
        query: 'データベースエラー',
        resultsCount: searchResults.integrated.length,
        logResults: searchResults.logs.length,
        knowledgeResults: searchResults.knowledge.length,
        summary: searchResults.summary,
        topResults: searchResults.integrated.slice(0, 3).map(doc => ({
          type: doc.metadata.type,
          namespace: doc.metadata.namespace,
          similarity: Math.round(doc.similarity * 100) / 100,
          contentPreview: doc.content.substring(0, 100) + '...'
        }))
      }
    });

  } catch (error) {
    console.error('Quick test error:', error);
    res.status(500).json({
      success: false,
      error: 'クイックテストに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 