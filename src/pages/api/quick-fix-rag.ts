import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId = 'default-user' } = req.body;

    console.log('🔧 Quick Fix: Adding sample data and testing RAG...');

    // すぐに使えるサンプルデータを追加
    const sampleLogs = [
      `2025-01-15 08:45:33 [CRITICAL] Memory usage critical: 94% of available RAM consumed
2025-01-15 08:45:34 [ERROR] OutOfMemoryError in module: user-session-manager
2025-01-15 08:45:35 [INFO] Emergency garbage collection triggered`,

      `2025-01-15 13:15:42 [CRITICAL] Primary database server unresponsive
2025-01-15 13:15:43 [ERROR] All database connections failed after 3 retry attempts
2025-01-15 13:15:44 [INFO] Initiating emergency database failover procedure`,

      `2025-01-15 11:15:44 [ERROR] Failed authentication attempt: username=admin, ip=45.33.32.156
2025-01-15 11:15:45 [WARNING] Suspicious login pattern detected from IP 45.33.32.156
2025-01-15 11:15:46 [ERROR] Brute force attack suspected: 15 failed attempts in 5 minutes`
    ];

    const sampleAnalyses = [
      `【緊急エラー分析】
最新のシステムログ分析結果:
- メモリ使用率が危険レベル (94%) に到達
- OutOfMemoryErrorが発生し、緊急対応が必要
- 対象モジュール: user-session-manager
- 自動復旧: 緊急ガベージコレクションで一時回復`,

      `【データベース障害分析】
プライマリDBサーバーが応答停止:
- 接続試行: 3回失敗
- 自動フェイルオーバー: 実行済み
- 現状: レプリカサーバーで運用中
- 影響: 一時的な性能低下あり`,

      `【セキュリティ脅威分析】
ブルートフォース攻撃を検出:
- 攻撃元IP: 45.33.32.156
- 失敗試行: 15回/5分間
- 対象アカウント: admin
- 対応: IP自動ブロック済み`
    ];

    // データを追加
    let addedCount = 0;
    for (const log of sampleLogs) {
      await RAGService.addDocument(log, {
        source: 'quick_fix_logs',
        type: 'log',
        userId,
      });
      addedCount++;
    }

    for (const analysis of sampleAnalyses) {
      await RAGService.addDocument(analysis, {
        source: 'quick_fix_analysis',
        type: 'analysis',
        userId,
      });
      addedCount++;
    }

    // 検索テスト（低い閾値で）
    const testQueries = [
      "最新のエラーログが見たい",
      "メモリエラーについて教えて",
      "データベース問題を調べて"
    ];

    const testResults = [];
    for (const query of testQueries) {
      try {
        const results = await RAGService.searchSimilarDocuments(
          query,
          5,
          0.2, // 低い閾値
          { userId }
        );
        testResults.push({
          query,
          found: results.length,
          results: results.map(r => ({
            type: r.metadata.type,
            similarity: r.similarity,
            preview: r.content.substring(0, 100) + '...'
          }))
        });
      } catch (error) {
        testResults.push({
          query,
          error: error.message
        });
      }
    }

    console.log(`✅ Quick Fix completed: Added ${addedCount} documents`);

    res.status(200).json({
      success: true,
      message: 'RAG database fixed and populated',
      added: {
        documents: addedCount,
        logs: sampleLogs.length,
        analyses: sampleAnalyses.length
      },
      testResults,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quick fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 