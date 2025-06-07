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
      
      // ユーザーの質問/クエリも保存
      if (query) {
        await RAGService.addDocument(query, {
          source: 'user_query',
          type: 'query',
          userId,
        });
      }
    }

    // シンプルなログ分析ワークフロー（OpenAI GPTによる真の分析）
    const simpleWorkflow = {
      version: 0.5,
      nodes: {
        source: {
          value: {
            query: query || 'ログデータを詳細に分析して、問題点と推奨対処法を教えてください',
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
            filterFunction: 'item => item.toLowerCase().includes("error") || item.toLowerCase().includes("warning") || item.toLowerCase().includes("fail") || item.toLowerCase().includes("critical")'
          },
          if: ':logSplitter',
          isResult: true
        },
        aiAnalysis: {
          agent: 'openAIAgent',
          inputs: {
            messages: [
              {
                role: 'system',
                content: `あなたはデータサイエンティストとフィールドエンジニアの専門知識を持つAIアシスタントです。ログデータを科学的・統計的に分析し、以下の観点で詳細な分析を行ってください：

【分析フレームワーク】
1. **データ概要**：ログの規模、期間、データ品質
2. **統計分析**：エラー発生頻度、傾向分析、パターン検出
3. **異常検知**：閾値を超える値、通常パターンからの逸脱
4. **根本原因分析**：5Why分析、因果関係の特定
5. **リスク評価**：影響度×発生確率のマトリクス
6. **予測モデリング**：障害予測、劣化トレンド
7. **実行可能な提案**：優先度付きアクションプラン

回答は以下の構造で提供してください：
- エグゼクティブサマリー（重要度順Top3）
- 詳細分析結果
- 統計的データ
- リスクマトリクス
- アクションプラン（時系列）`
              },
              {
                role: 'user',
                content: `【ログデータ分析依頼】

ログデータ:
:source.logData

検出されたエラー・警告行:
:errorFilter

分析要求: :source.query

データサイエンティストとして、上記ログデータの包括的な分析を実施してください。数値的な根拠を示し、具体的で実行可能な技術的提案を提供してください。`
              }
            ]
          },
          params: {
            model: 'gpt-4',
            temperature: 0.2,
            max_tokens: 2000
          },
          if: ':source.logData',
          isResult: true
        },
        summary: {
          agent: 'stringTemplateAgent',
          inputs: {
            aiAnalysis: ':aiAnalysis.choices[0].message.content',
            totalLines: ':logSplitter.contents.length',
            errorCount: ':errorFilter.length',
            timestamp: new Date().toLocaleString('ja-JP')
          },
          params: {
            template: `# ログ分析結果

## AI分析
\${aiAnalysis}

## 統計情報
- 総ログ行数: \${totalLines}行
- エラー/警告行数: \${errorCount}行
- 分析完了時刻: \${timestamp}

---
*GraphAI 2.0.5 + OpenAI GPT-4による分析*`
          },
          isResult: true
        }
      }
    };

    const graphAI = new GraphAIManager();
    const result = await graphAI.executeWorkflow(simpleWorkflow);

    if (!result.success) {
      throw new Error(result.error || 'Log analysis failed');
    }

    // AI分析結果を取得（修正されたワークフローの構造に対応）
    const resultData = result.result as any;
    const analysisResult = resultData.summary || 
                          resultData.aiAnalysis?.choices?.[0]?.message?.content ||
                          resultData.finalReport || 
                          resultData.answer || 
                          'AI分析を実行中です...';

    console.log('GraphAI execution result:', JSON.stringify(result.result, null, 2));
    console.log('Analysis result:', analysisResult);

    // 分析結果をRAGに保存（詳細情報付き）
    if (userId && analysisResult && analysisResult !== 'AI分析を実行中です...') {
      await RAGService.addDocument(analysisResult, {
        source: 'log_analysis',
        type: 'analysis',
        userId,
      });
      
      // 統計情報も別途保存
      const statsData = `ログ分析統計 - 総行数: ${resultData.logSplitter?.contents?.length || 0}行, エラー・警告: ${resultData.errorFilter?.length || 0}行, 分析日時: ${new Date().toLocaleString('ja-JP')}`;
      await RAGService.addDocument(statsData, {
        source: 'analysis_stats',
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