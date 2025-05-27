import { NextApiRequest, NextApiResponse } from 'next';
import { GraphAIManager } from '../../lib/utils/GraphAIManager';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, logData, userId } = req.body;

    if (!logData) {
      return res.status(400).json({ error: 'Log data is required' });
    }

    // ログデータをRAGに保存
    if (userId) {
      await RAGService.addDocument(logData, {
        source: 'user_input',
        type: 'log',
        userId,
      });
    }

    // シンプルなログ分析ワークフロー（ログ処理に特化）
    const simpleWorkflow = {
      version: 0.5,
      nodes: {
        source: {
          value: {
            query: query || 'ログデータを分析してください',
            logData,
            requestType: 'log_analysis'
          }
        },
        logSplitter: {
          agent: 'stringSplitterAgent',
          inputs: {
            text: ':source.logData'
          },
          params: {
            separator: '\n'
          },
          if: ':source.logData',
          isResult: true
        },
        errorFilter: {
          agent: 'propertyFilterAgent',
          inputs: {
            item: ':logSplitter.contents'
          },
          params: {
            filterFunction: 'item => item.toLowerCase().includes("error") || item.toLowerCase().includes("warning") || item.toLowerCase().includes("fail")'
          },
          if: ':logSplitter',
          isResult: true
        },
        logAnalysis: {
          agent: 'stringTemplateAgent',
          inputs: {
            totalLines: ':logSplitter.contents',
            errorLines: ':errorFilter',
            query: ':source.query'
          },
          params: {
            template: `# ログ分析結果

## 基本情報
- 総行数: \${totalLines.length}行
- エラー/警告行数: \${errorLines.length}行

## 検出されたエラー・警告
\${errorLines.slice(0, 5).map(line => '- ' + line).join('\\n')}

## ユーザーの質問
\${query}

## 基本的な推奨対処法
1. エラーログの詳細確認
2. システムリソースの確認
3. 設定ファイルの検証
4. 必要に応じてサービス再起動

## 分析完了時刻
\${new Date().toLocaleString('ja-JP')}`
          },
          if: ':source.logData',
          isResult: true
        }
      }
    };

    const graphAI = new GraphAIManager();
    const result = await graphAI.executeWorkflow(simpleWorkflow);

    if (!result.success) {
      throw new Error(result.error || 'Log analysis failed');
    }

    // 分析結果を取得（GraphAIResultの型に合わせて）
    const analysisResult = result.result.finalReport || 
                          result.result.answer || 
                          result.result.summary ||
                          'ログ分析が完了しました';

    // 分析結果をRAGに保存
    if (userId && analysisResult) {
      await RAGService.addDocument(analysisResult, {
        source: 'log_analysis',
        type: 'analysis',
        userId,
      });
    }

    res.status(200).json({
      success: true,
      analysis: analysisResult,
      logStats: {
        totalLines: 'ログ行数を計算中',
        errorLines: 'エラー行数を計算中',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Simple field engineer API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Log analysis failed',
    });
  }
} 