import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId = 'user_session_001' } = req.body;

    // サンプルログデータ
    const sampleLogs = [
      `2025-06-03 09:15:00 [ERROR] Database connection failed: Connection timeout
2025-06-03 09:15:01 [WARNING] Retrying database connection (attempt 1/3)
2025-06-03 09:15:02 [ERROR] Authentication failed for user admin
2025-06-03 09:15:03 [INFO] System startup completed`,

      `2025-06-03 09:19:01 [CRITICAL] Memory usage exceeded 95%
2025-06-03 09:19:02 [ERROR] OutOfMemoryError in application module
2025-06-03 09:19:03 [WARNING] Performance degradation detected
2025-06-03 09:19:04 [INFO] Emergency cleanup initiated`,

      `2025-06-03 08:30:00 [ERROR] Network connectivity lost
2025-06-03 08:30:01 [WARNING] Switching to backup network
2025-06-03 08:30:02 [INFO] Backup network established
2025-06-03 08:30:03 [ERROR] DNS resolution failed for example.com`,

      `今日のシステム監視ログ
- CPU使用率: 85%
- メモリ使用率: 92%
- ディスク使用率: 67%
- ネットワーク遅延: 15ms`,

      `エラーレポート - 2025年6月3日
データベース接続エラーが3回発生しました。
主な原因: タイムアウト設定が短すぎる可能性があります。`
    ];

    // サンプル分析データ
    const sampleAnalyses = [
      `【ログ分析結果】
総ログ行数: 16行
エラー・警告行数: 10行

主要な問題:
1. データベース接続エラー (3件)
2. メモリ不足エラー (2件)  
3. ネットワーク接続問題 (2件)

推奨対処法:
1. データベース接続タイムアウト設定の見直し
2. メモリ使用量の最適化
3. ネットワーク冗長化の検討`,

      `【システム監視分析】
現在のシステム状態は警戒レベルです。

問題箇所:
- メモリ使用率が危険水域 (92%)
- CPU使用率が高負荷状態 (85%)

緊急対応が必要:
1. 不要なプロセスの停止
2. メモリ最適化の実行
3. 負荷分散の調整`,

      `【エラー傾向分析】
過去24時間のエラー発生状況:
- 09:15頃: データベース関連エラー集中
- 09:19頃: メモリ関連エラー発生
- 08:30頃: ネットワーク関連エラー

パターン: 朝の業務開始時間帯にエラーが集中している傾向があります。`
    ];

    // サンプルレポート
    const sampleReports = [
      `【日次システムレポート - 2025/06/03】

## エグゼクティブサマリー
1. データベース接続不安定 (重要度: 高)
2. メモリ使用量過多 (重要度: 高)  
3. ネットワーク断続的問題 (重要度: 中)

## 詳細分析
- 総エラー件数: 7件
- 警告件数: 4件
- 影響を受けたサービス: 3つ

## 推奨アクション
1. データベース設定の最適化 (即座)
2. メモリ容量の増設検討 (今週中)
3. ネットワーク監視強化 (来週まで)`,

      `【障害対応レポート】
発生時刻: 2025-06-03 09:19:01
影響範囲: メインアプリケーション
復旧時刻: 2025-06-03 09:25:00

根本原因: メモリリークによるシステム過負荷
対応内容: アプリケーション再起動、メモリ最適化
再発防止策: 定期的なメモリ監視とクリーンアップ処理の実装`
    ];

    console.log('🔧 Adding sample data to RAG database...');

    // サンプルデータをRAGに追加
    let addedCount = 0;

    // ログデータを追加
    for (const log of sampleLogs) {
      await RAGService.addDocument(log, {
        source: 'sample_data',
        type: 'log',
        userId,
      });
      addedCount++;
    }

    // 分析データを追加
    for (const analysis of sampleAnalyses) {
      await RAGService.addDocument(analysis, {
        source: 'sample_analysis',
        type: 'analysis',
        userId,
      });
      addedCount++;
    }

    // レポートデータを追加
    for (const report of sampleReports) {
      await RAGService.addDocument(report, {
        source: 'sample_report',
        type: 'report',
        userId,
      });
      addedCount++;
    }

    console.log(`✅ Added ${addedCount} sample documents to RAG database`);

    res.status(200).json({
      success: true,
      message: `${addedCount}件のサンプルデータを追加しました`,
      addedDocuments: {
        logs: sampleLogs.length,
        analyses: sampleAnalyses.length,
        reports: sampleReports.length,
        total: addedCount
      },
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sample data addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add sample data',
    });
  }
} 