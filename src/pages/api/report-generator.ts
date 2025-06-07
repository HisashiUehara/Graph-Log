import { NextApiRequest, NextApiResponse } from 'next';
import { GraphAIManager } from '../../lib/utils/GraphAIManager';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      analysisData, 
      reportType = 'standard',
      userId,
      customTemplate 
    } = req.body;

    if (!analysisData) {
      return res.status(400).json({ error: 'Analysis data is required' });
    }

    // ユーザーの過去データを取得してレポートに反映
    let historicalContext = '';
    if (userId) {
      const userLogs = RAGService.getUserDocuments(userId, 'log');
      const userAnalyses = RAGService.getUserDocuments(userId, 'analysis');
      
      historicalContext = `
【過去のログデータ】${userLogs.length}件
【過去の分析結果】${userAnalyses.length}件

最近の活動:
${userAnalyses.slice(-3).map((doc, index) => 
  `${index + 1}. ${doc.metadata.timestamp.split('T')[0]} - ${doc.content.substring(0, 100)}...`
).join('\n')}
`;
    }

    // レポート生成用のワークフローデータ
    const reportWorkflow = {
      version: 0.5,
      nodes: {
        source: {
          value: {
            analysisData,
            reportType,
            timestamp: new Date().toLocaleString('ja-JP'),
            reportDate: new Date().toLocaleDateString('ja-JP'),
            historicalContext,
          }
        },
        businessReport: {
          agent: 'openAIAgent',
          inputs: {
            messages: [
              {
                role: 'system',
                content: `あなたは技術マネージャーとして、ログ分析結果を経営陣や関係部署向けの社内報告書に変換してください。

【レポート要件】
- ビジネスインパクトの明確化
- 非技術者にも理解できる表現
- 意思決定に必要な情報を簡潔に
- リスクと投資対効果の明示
- 具体的なタイムラインとコスト
- 過去のデータとの比較・トレンド分析

【構成】
1. エグゼクティブサマリー（1分で読める概要）
2. 現状評価（RED/YELLOW/GREEN評価）
3. ビジネスインパクト分析
4. 推奨アクション（優先度・予算・期間）
5. リスクマトリクス
6. トレンド分析（過去データとの比較）
7. 次回確認予定`
              },
              {
                role: 'user',
                content: `以下の技術分析結果を、社内共有用のビジネスレポートに変換してください：

【分析データ】
${JSON.stringify(analysisData)}

【レポートタイプ】
${reportType}

【過去データの文脈】
${historicalContext}

専門用語は避け、ビジネス価値とリスクを明確に示した報告書を作成してください。過去のデータがある場合は、トレンド分析も含めてください。`
              }
            ]
          },
          params: {
            model: 'gpt-4',
            temperature: 0.3,
            max_tokens: 2500
          }
        },
        formatReport: {
          agent: 'stringTemplateAgent',
          inputs: {
            content: ':businessReport.choices[0].message.content',
            companyHeader: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 システム運用状況レポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
作成日時: \${reportDate}
レポートタイプ: \${reportType}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            footer: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは Graph-Log AI Assistant により自動生成されました
GraphAI 2.0.5 + OpenAI GPT-4 分析エンジン使用
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            reportDate: ':source.reportDate',
            reportType: ':source.reportType'
          },
          params: {
            template: `\${companyHeader}

\${content}

\${footer}`
          },
          isResult: true
        }
      }
    };

    // GraphAIでレポート生成
    const graphAI = new GraphAIManager();
    const result = await graphAI.executeWorkflow(reportWorkflow);

    if (!result.success) {
      throw new Error(result.error || 'Report generation failed');
    }

    // GraphAIの結果から適切にデータを取得
    const reportContent = (result.result as any).formatReport || 
                         (result.result as any).businessReport?.choices?.[0]?.message?.content ||
                         result.result.finalReport || 
                         result.result.answer || 
                         result.result.summary || 
                         'レポートの生成に失敗しました';

    // 生成されたレポートをRAGに保存
    if (userId && reportContent && reportContent !== 'レポートの生成に失敗しました') {
      await RAGService.addDocument(reportContent, {
        source: 'report_generator',
        type: 'report',
        userId,
      });
    }

    res.status(200).json({
      success: true,
      report: reportContent,
      metadata: result.result.metadata,
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Report generation failed',
    });
  }
} 