import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId = 'force-test-user' } = req.body;

    console.log('🔧 FORCE USER DATA TEST - Starting...');

    // Step 1: 強制的にテスト用エラーログを追加
    const testErrorLogs = [
      `2025-01-15 14:23:45 [ERROR] Database connection timeout: Failed to connect to primary database server (host: db-prod-01, timeout: 5000ms)`,
      `2025-01-15 14:23:46 [CRITICAL] Authentication service unavailable: Unable to validate user credentials, falling back to cached authentication`,
      `2025-01-15 14:23:47 [WARNING] High memory usage detected: Current usage 87% (7.2GB/8GB), approaching critical threshold`
    ];

    const testAnalysis = `【実際のエラーログ分析 - 2025年1月15日】
分析対象: ユーザー入力の最新エラーログ

検出された問題:
1. データベース接続タイムアウト (14:23:45)
   - ホスト: db-prod-01
   - タイムアウト時間: 5000ms
   - ステータス: 接続失敗

2. 認証サービス停止 (14:23:46) 
   - サービス: 認証システム
   - 影響: ユーザー認証機能停止
   - 対応: キャッシュ認証にフォールバック

3. メモリ使用量高負荷 (14:23:47)
   - 現在使用量: 87% (7.2GB/8GB)
   - 閾値: 危険レベル接近
   - 対応: 監視強化が必要`;

    // データ追加
    let addedIds = [];
    
    for (const log of testErrorLogs) {
      const id = await RAGService.addDocument(log, {
        source: 'user_real_input',
        type: 'log',
        userId,
      });
      addedIds.push(id);
    }

    const analysisId = await RAGService.addDocument(testAnalysis, {
      source: 'user_real_analysis',
      type: 'analysis',
      userId,
    });
    addedIds.push(analysisId);

    console.log(`✅ Added ${addedIds.length} user documents`);

    // Step 2: 即座に検索テスト（ユーザーデータのみ）
    const testQuery = "最新のエラーログが見たい";
    
    // ユーザーデータのみをフィルタリング
    const userOnlyResults = await RAGService.searchSimilarDocuments(
      testQuery,
      10,
      0.1, // 低い閾値
      { userId }
    );

    // さらにサンプルデータを除外
    const realUserData = userOnlyResults.filter(doc => 
      doc.metadata.source === 'user_real_input' || 
      doc.metadata.source === 'user_real_analysis' ||
      doc.metadata.source === 'user_actual_input'
    );

    console.log(`🔍 Search results: ${userOnlyResults.length} total, ${realUserData.length} user-only`);

    // Step 3: LLMで回答生成（ユーザーデータのみ使用）
    let llmResponse = '';
    
    if (realUserData.length > 0) {
      const contextWithCitations = realUserData.map((doc, index) => 
        `[引用${index + 1}] タイプ: ${doc.metadata.type} | 出典: ${doc.metadata.source}\n${doc.content}`
      ).join('\n\n---\n\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `あなたは高度なRAGシステムのAIアシスタントです。提供されたユーザーの実際のログデータのみを基に回答してください。

重要な指示:
1. **提供されたコンテキストのみを使用**
2. **引用番号を明記**: [引用1], [引用2] で出典を示す  
3. **具体的な情報を含める**: 日時、エラー内容、影響など
4. **実用的な分析**: 問題の重要度と対応策

コンテキスト情報:
${contextWithCitations}`
          },
          {
            role: 'user',
            content: `質問: ${testQuery}

上記のユーザーの実際のログデータを基に、最新のエラーログについて詳細に回答してください。`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      llmResponse = completion.choices[0].message.content || 'LLM回答生成に失敗しました。';
    } else {
      llmResponse = '❌ ユーザーの実際のデータが見つかりませんでした。';
    }

    // Step 4: 結果を返す
    res.status(200).json({
      success: true,
      test: 'Force User Data Test',
      added: {
        documentIds: addedIds,
        logs: testErrorLogs.length,
        analysis: 1
      },
      searchResults: {
        totalFound: userOnlyResults.length,
        userDataOnly: realUserData.length,
        documents: realUserData.map(doc => ({
          type: doc.metadata.type,
          source: doc.metadata.source,
          similarity: (doc as any).similarity || 'N/A',
          preview: doc.content.substring(0, 100) + '...'
        }))
      },
      llmResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Force user data test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 