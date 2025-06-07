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
    console.log('🔄 Starting migration to Hybrid RAG...');
    
    // PersistentRAGService初期化
    await PersistentRAGService.initialize();

    // 既存のRAGServiceからの移行は後回し、まずはサンプルデータで動作確認
    console.log('📊 Migration skipped - using sample data for initial testing');

    // 移行統計
    const stats = await PersistentRAGService.getStats();
    
    console.log(`✅ Migration setup completed`);

    res.status(200).json({
      success: true,
      message: `ハイブリッドRAGの初期化が完了しました`,
      migrated: 0,
      errors: 0,
      errorDetails: [],
      stats: stats,
      note: '既存RAGからの移行は今後実装予定。現在はサンプルデータでテスト可能です。'
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: '移行処理中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 