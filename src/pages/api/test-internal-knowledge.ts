import { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '@/lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Internal Knowledge System...');

    // サンプルInternal Knowledgeデータを追加
    const sampleData = [
      {
        content: `フィールドエンジニア向けトラブルシューティングガイド

1. データベース接続エラーの対処法
- 接続文字列の確認
- ファイアウォール設定の確認
- サービス状態の確認

2. CPU使用率高騰時の対応
- プロセス監視の実行
- 不要なサービスの停止
- リソース使用量の分析

3. メモリリーク検出手順
- メモリ使用量の継続監視
- ガベージコレクション状況の確認
- アプリケーションログの分析`,
        metadata: {
          source: 'technical_manual',
          type: 'internal_text' as const,
          department: 'フィールドエンジニアリング',
          accessLevel: 'internal' as const,
          mediaType: 'text' as const
        }
      },
      {
        content: `システム監視ベストプラクティス

監視項目:
- CPU使用率 (閾値: 80%)
- メモリ使用率 (閾値: 85%)
- ディスク使用率 (閾値: 90%)
- ネットワーク帯域 (閾値: 70%)

アラート設定:
- 即座に対応が必要: Critical
- 1時間以内に対応: Warning
- 定期確認で十分: Info

エスカレーション手順:
1. 自動復旧の試行
2. 担当エンジニアへの通知
3. マネージャーへのエスカレーション`,
        metadata: {
          source: 'monitoring_guide',
          type: 'internal_text' as const,
          department: 'システム運用',
          accessLevel: 'internal' as const,
          mediaType: 'text' as const
        }
      },
      {
        content: `セキュリティインシデント対応手順

Phase 1: 検知・初期対応
- インシデントの確認と分類
- 影響範囲の特定
- 初期封じ込め措置

Phase 2: 調査・分析
- ログ分析の実施
- 攻撃手法の特定
- 被害状況の詳細調査

Phase 3: 復旧・改善
- システムの復旧作業
- セキュリティ強化措置
- 再発防止策の実装

連絡先:
- セキュリティチーム: security@company.com
- インシデント対応: incident@company.com`,
        metadata: {
          source: 'security_manual',
          type: 'internal_text' as const,
          department: 'セキュリティ',
          accessLevel: 'confidential' as const,
          mediaType: 'text' as const
        }
      }
    ];

    // Internal Knowledgeにデータを追加
    const addedIds = [];
    for (const data of sampleData) {
      const id = await PersistentRAGService.addInternalKnowledge(
        data.content,
        data.metadata
      );
      addedIds.push(id);
    }

    console.log(`✅ Added ${addedIds.length} Internal Knowledge documents`);

    // 検索テストを実行
    const testQueries = [
      'データベースエラー',
      'CPU使用率',
      'セキュリティインシデント',
      'システム監視'
    ];

    const searchResults = {};
    for (const query of testQueries) {
      const results = await PersistentRAGService.searchInternalKnowledge(query, {
        threshold: 0.3,
        limit: 5
      });
      searchResults[query] = {
        count: results.length,
        topResult: results[0] ? {
          similarity: results[0].similarity,
          department: results[0].metadata.department,
          accessLevel: results[0].metadata.accessLevel
        } : null
      };
    }

    // システム統計を取得
    const stats = await PersistentRAGService.getStats();

    res.status(200).json({
      success: true,
      message: 'Internal Knowledge system test completed',
      results: {
        addedDocuments: addedIds.length,
        addedIds,
        searchTests: searchResults,
        systemStats: stats
      }
    });

  } catch (error) {
    console.error('Internal Knowledge test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Knowledge test failed'
    });
  }
} 