import type { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '../../lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action = 'test', addSampleData = false } = req.body;

  try {
    console.log('🧪 Testing Hybrid RAG System...');
    
    // 初期化
    await PersistentRAGService.initialize();
    
    // サンプルデータ追加（必要に応じて）
    if (addSampleData) {
      await addHybridSampleData();
    }

    // 統計取得
    const stats = await PersistentRAGService.getStats();
    console.log('📊 Current stats:', stats);

    // テストクエリ実行
    const testQueries = [
      'エラーログを確認したい',
      'システムパフォーマンス情報',
      'セキュリティ関連の問題',
      'マニュアルやガイド',
      'プロジェクトの進捗'
    ];

    const testResults = [];

    for (const query of testQueries) {
      try {
        const result = await PersistentRAGService.hybridSearch(query, {
          limit: 5,
          threshold: 0.2
        });
        
        testResults.push({
          query,
          success: true,
          resultsCount: result.integrated.length,
          logCount: result.logs.length,
          knowledgeCount: result.knowledge.length,
          summary: result.summary.substring(0, 100) + '...',
          topResult: result.integrated[0] ? {
            type: result.integrated[0].metadata.type,
            namespace: result.integrated[0].metadata.namespace,
            similarity: Math.round(result.integrated[0].similarity * 100) / 100
          } : null
        });
      } catch (error) {
        testResults.push({
          query,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'ハイブリッドRAGテスト完了',
      stats,
      testResults,
      performance: {
        totalQueries: testQueries.length,
        successfulQueries: testResults.filter(r => r.success).length,
        averageResults: testResults
          .filter(r => r.success)
          .reduce((sum, r) => sum + (r.resultsCount || 0), 0) / testResults.filter(r => r.success).length || 0
      },
      recommendations: generateRecommendations(stats, testResults)
    });

  } catch (error) {
    console.error('Hybrid RAG test error:', error);
    res.status(500).json({
      success: false,
      error: 'ハイブリッドRAGテストに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * ハイブリッド用サンプルデータ追加
 */
async function addHybridSampleData(): Promise<void> {
  const sampleData = [
    // ログデータ
    {
      content: '2025-01-15 10:30:15 ERROR Database connection failed: Connection timeout after 30 seconds',
      metadata: {
        source: 'database.log',
        type: 'log' as const,
        namespace: 'logs' as const,
        userId: 'test-user'
      }
    },
    {
      content: '2025-01-15 11:45:22 WARNING High CPU usage detected: 85% for 5 minutes',
      metadata: {
        source: 'system.log',
        type: 'log' as const,
        namespace: 'logs' as const,
        userId: 'test-user'
      }
    },
    
    // ナレッジデータ
    {
      content: 'システム監視マニュアル: CPU使用率が80%を超えた場合の対処方法について説明します。',
      metadata: {
        source: 'monitoring-manual.md',
        type: 'manual' as const,
        namespace: 'knowledge' as const,
        department: 'IT'
      }
    },
    {
      content: 'データベースメンテナンスガイド: 定期的なバックアップと接続プールの設定について',
      metadata: {
        source: 'db-guide.md',
        type: 'manual' as const,
        namespace: 'knowledge' as const,
        department: 'IT'
      }
    },
    
    // セキュリティデータ
    {
      content: '2025-01-15 12:00:00 SECURITY Failed login attempt from IP 192.168.1.100',
      metadata: {
        source: 'security.log',
        type: 'log' as const,
        namespace: 'security' as const,
        userId: 'test-user'
      }
    },
    {
      content: 'セキュリティポリシー: 不正アクセス検知時の対応手順とエスカレーション方法',
      metadata: {
        source: 'security-policy.md',
        type: 'policy' as const,
        namespace: 'security' as const,
        department: 'Security'
      }
    },
    
    // プロジェクトデータ
    {
      content: 'プロジェクトX進捗報告: APIリニューアル作業が80%完了、来週リリース予定',
      metadata: {
        source: 'project-x-report.md',
        type: 'report' as const,
        namespace: 'projects' as const,
        department: 'Development'
      }
    },
    {
      content: '分析結果: 過去30日間のエラー傾向分析 - データベース関連エラーが60%増加',
      metadata: {
        source: 'error-analysis.md',
        type: 'analysis' as const,
        namespace: 'logs' as const,
        userId: 'test-user'
      }
    }
  ];

  for (const item of sampleData) {
    await PersistentRAGService.addDocument(item.content, item.metadata);
  }
  
  console.log(`✅ Added ${sampleData.length} hybrid sample documents`);
}

/**
 * 推奨事項生成
 */
function generateRecommendations(stats: any, testResults: any[]): string[] {
  const recommendations = [];
  
  if (stats.total === 0) {
    recommendations.push('データがありません。サンプルデータを追加してテストしてください。');
  }
  
  if (stats.total > 0 && stats.total < 10) {
    recommendations.push('データ量が少ないです。より多くのデータを追加すると検索精度が向上します。');
  }
  
  const failedQueries = testResults.filter(r => !r.success).length;
  if (failedQueries > 0) {
    recommendations.push(`${failedQueries}件のクエリが失敗しました。エラー内容を確認してください。`);
  }
  
  const lowResultQueries = testResults.filter(r => r.success && (r.resultsCount || 0) < 2).length;
  if (lowResultQueries > testResults.length / 2) {
    recommendations.push('検索結果が少ないクエリが多いです。閾値を下げるか、データを追加することを検討してください。');
  }
  
  if (!stats.byNamespace.logs && !stats.byNamespace.knowledge) {
    recommendations.push('ログとナレッジの両方のデータを追加することで、ハイブリッド検索の効果が向上します。');
  }
  
  return recommendations;
} 