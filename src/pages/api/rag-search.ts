import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // ドキュメント追加または知的検索
    try {
      const { content, metadata, query, userId, useIntelligentSearch } = req.body;

      // 知的検索モード（真のRAG機能）
      if (useIntelligentSearch && query) {
        const searchResult = await performTrueRAGSearch(query, userId);
        return res.status(200).json(searchResult);
      }

      // 通常のドキュメント追加
      if (!content || !metadata) {
        return res.status(400).json({ error: 'Content and metadata are required' });
      }

      const documentId = await RAGService.addDocument(content, metadata);

      res.status(200).json({
        success: true,
        documentId,
        message: 'Document added successfully',
      });
    } catch (error) {
      console.error('RAG document addition error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add document',
      });
    }
  } else if (req.method === 'GET') {
    // ドキュメント検索
    try {
      const { 
        query, 
        limit = '5', 
        threshold = '0.7', 
        userId,
        type,
        intelligent = 'false'
      } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      // 知的検索モード（真のRAG機能）
      if (intelligent === 'true') {
        const searchResult = await performTrueRAGSearch(query, userId as string);
        return res.status(200).json(searchResult);
      }

      const filters: any = {};
      if (userId && typeof userId === 'string') filters.userId = userId;
      if (type && typeof type === 'string') filters.type = type;

      const documents = await RAGService.searchSimilarDocuments(
        query,
        parseInt(limit as string),
        parseFloat(threshold as string),
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        documents,
        count: documents.length,
      });
    } catch (error) {
      console.error('RAG search error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Search failed',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// 真のRAG検索機能：セマンティック検索 + LLM生成
async function performTrueRAGSearch(query: string, userId?: string) {
  try {
    console.log('🧠 Performing TRUE RAG search for:', query);
    console.log('🔍 Step 1: Semantic document retrieval...');

    // Step 1: セマンティック検索で関連文書を取得
    const filters: any = {};
    if (userId) filters.userId = userId;

    const relatedDocuments = await RAGService.searchSimilarDocuments(
      query, 
      10, 
      0.2, // より低い類似度閾値（0.5 → 0.2）
      filters
    );

    // ユーザーの全データも取得（コンテキスト用）
    const userLogs = userId ? RAGService.getUserDocuments(userId, 'log') : [];
    const userAnalyses = userId ? RAGService.getUserDocuments(userId, 'analysis') : [];
    const userReports = userId ? RAGService.getUserDocuments(userId, 'report') : [];

    const totalUserData = userLogs.length + userAnalyses.length + userReports.length;

    console.log('📊 Retrieved context:');
    console.log(`- Semantically similar documents: ${relatedDocuments.length}`);
    console.log(`- Total user data available: ${totalUserData}`);

    // ユーザーの実際のデータを優先してフィルタリング
    const userActualData = relatedDocuments.filter(doc => 
      doc.metadata.source !== 'system_monitoring' && 
      doc.metadata.source !== 'automated_analysis' &&
      doc.metadata.source !== 'sample_data' &&
      doc.metadata.source !== 'sample_analysis' &&
      doc.metadata.source !== 'sample_report'
    );

    const hasUserActualData = userActualData.length > 0;

    console.log('🎯 User actual data check:');
    console.log(`- User actual documents: ${userActualData.length}`);
    console.log(`- Sample documents: ${relatedDocuments.length - userActualData.length}`);

    // サンプルデータ追加は最後の手段として、ユーザーデータが全くない場合のみ
    if (totalUserData === 0 && userId) {
      console.log('🔧 No user data at all, adding minimal sample data...');
      await addSampleDataAutomatically(userId);
      
      // 再検索（ただしユーザーデータを優先）
      const newRelatedDocuments = await RAGService.searchSimilarDocuments(query, 10, 0.2, filters);
      return await generateRAGResponse(query, newRelatedDocuments, userId, true);
    }

    // ユーザーの実際のデータがある場合は、それを優先
    const documentsToUse = hasUserActualData ? userActualData : relatedDocuments;
    
    return await generateRAGResponse(query, documentsToUse, userId, false);

  } catch (error) {
    console.error('True RAG search error:', error);
    throw new Error(`RAG検索でエラーが発生しました: ${error.message}`);
  }
}

// LLMによる動的RAG回答生成（Citation付き）
async function generateRAGResponse(query: string, documents: any[], userId?: string, isNewData: boolean = false) {
  try {
    console.log('🤖 Step 2: LLM-powered response generation...');

    if (documents.length === 0) {
      return {
        success: true,
        response: `🔍 **質問**: ${query}\n\n❌ **関連情報が見つかりませんでした**\n\nより具体的な質問をするか、まずはSimple AnalysisやAdvanced Analysisでデータを分析してください。`,
        extractionType: 'no_relevant_data',
        citations: [],
        totalUserData: userId ? {
          logs: RAGService.getUserDocuments(userId, 'log').length,
          analyses: RAGService.getUserDocuments(userId, 'analysis').length,
          reports: RAGService.getUserDocuments(userId, 'report').length,
        } : { logs: 0, analyses: 0, reports: 0 },
        timestamp: new Date().toISOString()
      };
    }

    // Citation情報を準備
    const citations = documents.map((doc, index) => ({
      id: index + 1,
      type: doc.metadata.type,
      source: doc.metadata.source,
      timestamp: doc.metadata.timestamp,
      similarity: doc.similarity || 0,
      preview: doc.content.substring(0, 100) + '...'
    }));

    // コンテキスト構築（Citation IDを含む）
    const contextWithCitations = documents.map((doc, index) => 
      `[引用${index + 1}] タイプ: ${doc.metadata.type} | 出典: ${doc.metadata.source}\n${doc.content}`
    ).join('\n\n---\n\n');

    console.log('📝 Generating contextual response with GPT-4...');

    // OpenAI GPT-4による動的回答生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `あなたは高度なRAGシステムのAIアシスタントです。ユーザーの質問に対して、提供されたコンテキスト情報を基に正確で有用な回答を生成してください。

重要な指示:
1. **必ず提供されたコンテキストのみを基に回答**してください
2. **引用を明確に示す**: 情報を使用する際は [引用1], [引用2] などで出典を明示
3. **ユーザーの質問に直接答える**: 質問の意図を理解し、適切な情報を選択
4. **具体的で実用的な回答**: 抽象的でなく、実際に役立つ具体的な情報を提供
5. **日本語で自然な文章**: 技術的な内容もわかりやすく説明

回答形式:
- 質問への直接的な答え
- 関連する具体的な情報（日時、エラー内容、状況など）
- 必要に応じて推奨対処法や分析結果
- 使用した情報源の引用番号を明記

コンテキスト情報:
${contextWithCitations}`
        },
        {
          role: 'user',
          content: `質問: ${query}

上記のコンテキスト情報を基に、この質問に対する具体的で有用な回答を生成してください。必ず引用番号を使って情報源を明示してください。`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const llmResponse = completion.choices[0].message.content || 'LLMからの回答を取得できませんでした。';

    console.log('✅ LLM response generated successfully');

    // RAGに質問と回答を保存
    if (userId) {
      await RAGService.addDocument(`質問: ${query}\nRAG回答: ${llmResponse}`, {
        source: 'rag_interaction',
        type: 'analysis',
        userId,
      });
    }

    const finalResponse = isNewData ? 
      `📥 **サンプルデータを自動追加しました**\n\n${llmResponse}` : 
      llmResponse;

    return {
      success: true,
      response: finalResponse,
      extractionType: 'true_rag_with_llm',
      citations,
      retrievedDocuments: documents.length,
      totalUserData: userId ? {
        logs: RAGService.getUserDocuments(userId, 'log').length,
        analyses: RAGService.getUserDocuments(userId, 'analysis').length,
        reports: RAGService.getUserDocuments(userId, 'report').length,
      } : { logs: 0, analyses: 0, reports: 0 },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('LLM response generation error:', error);
    throw new Error(`回答生成でエラーが発生しました: ${error.message}`);
  }
}

// サンプルデータを自動追加する関数
async function addSampleDataAutomatically(userId: string) {
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

    `今日のシステム監視レポート - 2025年6月3日
システム全体の健康状態チェック結果:
- CPU使用率: 85% (警告レベル)
- メモリ使用率: 92% (危険レベル)
- ディスク使用率: 67% (正常)
- ネットワーク遅延: 15ms (正常)
- アクティブユーザー数: 1,247人
- 処理中のリクエスト: 23,891件`
  ];

  const sampleAnalyses = [
    `【ログ分析レポート - 2025年6月3日分析】
分析対象期間: 2025-06-03 08:00:00 - 10:00:00
総ログエントリ数: 1,247件

重要な発見:
1. データベース接続問題: 09:15頃に集中発生 (3回の失敗)
   - 主な原因: 接続タイムアウト設定が不適切
   - 影響: ユーザーログイン機能が2分間停止

2. メモリリーク検出: 09:19:01にクリティカルレベル到達
   - メモリ使用率: 95%を超過
   - 該当モジュール: アプリケーションコア
   - 緊急対応: 自動クリーンアップが実行済み

3. ネットワーク障害: 08:30頃に一時的な接続断
   - 継続時間: 約3分間
   - 自動復旧: バックアップネットワークに切り替え成功

推奨アクション:
- データベース接続プールの設定見直し (緊急)
- メモリ使用量の継続監視強化 (今日中)
- ネットワーク冗長化の検討 (来週まで)`,

    `【リアルタイムシステム監視アラート】
アラート生成時刻: 2025-06-03 09:19:01
重要度: HIGH

検出された問題:
メモリ使用量が危険水域に到達しました。

詳細情報:
- 現在のメモリ使用率: 92%
- 閾値: 90%
- CPU使用率: 85% (連動して上昇)
- 影響を受けるサービス: ウェブアプリケーション、API サーバー

即座に必要な対応:
1. 不要なプロセスの特定と停止
2. メモリ集約的なタスクの一時停止
3. システム管理者への通知完了

自動対応状況:
- 緊急クリーンアップ: 実行中
- 低優先度プロセス: 自動停止済み
- 負荷分散: バックアップサーバーへの切り替え準備中`
  ];

  // ログデータを追加
  for (const log of sampleLogs) {
    await RAGService.addDocument(log, {
      source: 'system_monitoring',
      type: 'log',
      userId,
    });
  }

  // 分析データを追加
  for (const analysis of sampleAnalyses) {
    await RAGService.addDocument(analysis, {
      source: 'automated_analysis',
      type: 'analysis',
      userId,
    });
  }

  console.log(`✅ Auto-added ${sampleLogs.length + sampleAnalyses.length} realistic sample documents`);
} 