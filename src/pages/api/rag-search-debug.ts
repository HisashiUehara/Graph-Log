import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';
import { GraphAIManager } from '../../lib/utils/GraphAIManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('=== RAG DEBUG START ===');
    console.log('Query:', query);
    console.log('UserId:', userId);

    // Step 1: データ取得
    const filters: any = {};
    if (userId) filters.userId = userId;

    const relatedDocuments = await RAGService.searchSimilarDocuments(
      query, 
      10, 
      0.3,
      filters
    );

    const userLogs = userId ? RAGService.getUserDocuments(userId, 'log') : [];
    const userAnalyses = userId ? RAGService.getUserDocuments(userId, 'analysis') : [];
    const userReports = userId ? RAGService.getUserDocuments(userId, 'report') : [];

    console.log('Data Retrieved:');
    console.log('- Related documents:', relatedDocuments.length);
    console.log('- User logs:', userLogs.length);
    console.log('- User analyses:', userAnalyses.length);
    console.log('- User reports:', userReports.length);

    // Step 2: ワークフロー作成
    const directDataExtractionWorkflow = {
      version: 0.5,
      nodes: {
        source: {
          value: {
            userQuery: query,
            allUserLogs: userLogs.map(doc => doc.content),
            allUserAnalyses: userAnalyses.map(doc => doc.content),
            allUserReports: userReports.map(doc => doc.content),
            relatedDocuments: relatedDocuments.map(doc => ({ type: doc.metadata.type, content: doc.content })),
            todayDate: new Date().toLocaleDateString('ja-JP'),
          }
        },
        
        // 簡素化されたワークフロー（デバッグ用）
        simpleResponse: {
          agent: 'stringTemplateAgent',
          inputs: {
            query: ':source.userQuery',
            logCount: ':source.allUserLogs.length',
            analysisCount: ':source.allUserAnalyses.length'
          },
          params: {
            template: `🔍 検索結果for: \${query}

📊 データ統計:
- ログ: \${logCount}件
- 分析: \${analysisCount}件

✅ デバッグテスト完了`
          },
          isResult: true
        }
      }
    };

    console.log('Workflow Created:', JSON.stringify(directDataExtractionWorkflow, null, 2));

    // Step 3: GraphAI実行
    const graphAI = new GraphAIManager();
    console.log('Executing GraphAI workflow...');
    
    const result = await graphAI.executeWorkflow(directDataExtractionWorkflow);

    console.log('GraphAI Result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('GraphAI Error:', result.error);
      console.error('GraphAI Details:', result.details);
      
      return res.status(500).json({
        success: false,
        error: 'GraphAI execution failed',
        details: {
          error: result.error,
          details: result.details,
          workflow: directDataExtractionWorkflow
        }
      });
    }

    const response = (result.result as any).simpleResponse || 'デバッグレスポンス生成失敗';

    console.log('Final Response:', response);
    console.log('=== RAG DEBUG END ===');

    return res.status(200).json({
      success: true,
      response,
      debug: {
        dataRetrieved: {
          relatedDocuments: relatedDocuments.length,
          userLogs: userLogs.length,
          userAnalyses: userAnalyses.length,
          userReports: userReports.length,
        },
        workflowExecuted: true,
        graphAIResult: result
      }
    });

  } catch (error) {
    console.error('RAG Debug API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      details: error
    });
  }
} 