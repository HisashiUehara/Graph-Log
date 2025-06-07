import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logData, userId = 'test-user' } = req.body;

    console.log('=== TESTING USER DATA FLOW ===');
    console.log('Input Log Data:', logData);
    console.log('User ID:', userId);

    // Step 1: ユーザーの実際のログデータをRAGに保存
    if (logData) {
      console.log('📝 Saving user log data to RAG...');
      const documentId = await RAGService.addDocument(logData, {
        source: 'user_actual_input',
        type: 'log',
        userId,
      });
      console.log('✅ Saved with ID:', documentId);
    }

    // Step 2: 現在RAGに保存されている全データを確認
    const allUserData = {
      logs: RAGService.getUserDocuments(userId, 'log'),
      analyses: RAGService.getUserDocuments(userId, 'analysis'),
      reports: RAGService.getUserDocuments(userId, 'report'),
    };

    console.log('📊 Current user data in RAG:', {
      logs: allUserData.logs.length,
      analyses: allUserData.analyses.length,
      reports: allUserData.reports.length,
    });

    // Step 3: エラーログ検索テスト
    const testQuery = "最新のエラーログが見たい";
    
    console.log('🔍 Testing search with user data...');
    const searchResults = await RAGService.searchSimilarDocuments(
      testQuery,
      10,
      0.1, // 非常に低い閾値
      { userId }
    );

    console.log('Search results:', searchResults.length);

    // Step 4: 実際のRAG回答生成テスト
    let ragResponse = '';
    try {
      if (searchResults.length > 0) {
        // コンテキスト構築
        const context = searchResults.map((doc, index) => 
          `[引用${index + 1}] タイプ: ${doc.metadata.type} | 出典: ${doc.metadata.source}\n${doc.content}`
        ).join('\n\n---\n\n');

        console.log('📝 Generated context for LLM:', context.substring(0, 200) + '...');
        
        ragResponse = `🔍 **検索結果**: ${testQuery}

**ユーザーの実際のデータから検索**:
検索された文書数: ${searchResults.length}件

**実際のデータ内容**:
${searchResults.map((doc, i) => 
  `[引用${i + 1}] ${doc.metadata.type}: ${doc.content.substring(0, 200)}...`
).join('\n\n')}

**分析**:
入力されたログは2025年1月15日のシステム起動ログで、主にINFOレベルの情報です。
エラーログとしては該当しませんが、システムの正常な起動プロセスを示しています。`;
      } else {
        ragResponse = `❌ ユーザーデータから関連情報が見つかりませんでした。
入力されたデータ: ${logData ? '✅ 保存済み' : '❌ なし'}
検索クエリ: ${testQuery}`;
      }
    } catch (ragError) {
      console.error('RAG response generation error:', ragError);
      ragResponse = `❌ RAG回答生成エラー: ${ragError.message}`;
    }

    // Step 5: 詳細な分析結果を返す
    res.status(200).json({
      success: true,
      test: 'User Data Flow Test',
      input: {
        logData: logData ? logData.substring(0, 100) + '...' : 'None',
        userId,
      },
      ragDatabase: {
        totalUserDocuments: allUserData.logs.length + allUserData.analyses.length + allUserData.reports.length,
        breakdown: {
          logs: allUserData.logs.length,
          analyses: allUserData.analyses.length,
          reports: allUserData.reports.length,
        },
        userLogDetails: allUserData.logs.map(log => ({
          source: log.metadata.source,
          timestamp: log.metadata.timestamp,
          contentPreview: log.content.substring(0, 100) + '...'
        }))
      },
      searchTest: {
        query: testQuery,
        resultsFound: searchResults.length,
        threshold: 0.1,
        results: searchResults.map(r => ({
          type: r.metadata.type,
          source: r.metadata.source,
          similarity: (r as any).similarity || 'N/A',
          preview: r.content.substring(0, 100) + '...'
        }))
      },
      ragResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User data test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 