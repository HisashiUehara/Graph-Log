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

    // レポート生成用のワークフローデータ
    const reportWorkflow = {
      version: 0.5,
      nodes: {
        source: {
          value: {
            analysisData,
            reportType,
            customTemplate: customTemplate || `# ${reportType === 'detailed' ? '詳細' : '標準'}レポート

## 分析概要
\${summary}

## 主要な発見事項
\${findings}

## 推奨事項
\${recommendations}

## 生成日時
\${timestamp}`,
          }
        },
        reportGenerator: {
          agent: 'stringTemplateAgent',
          inputs: {
            template: ':source.customTemplate',
            summary: analysisData.summary || '分析データから概要を抽出',
            findings: Array.isArray(analysisData.findings) 
              ? analysisData.findings.join('\n- ') 
              : analysisData.findings || '特記事項なし',
            recommendations: Array.isArray(analysisData.recommendations)
              ? analysisData.recommendations.join('\n- ')
              : analysisData.recommendations || '推奨事項なし',
            timestamp: new Date().toLocaleString('ja-JP'),
          }
        },
        result: {
          agent: 'copyAgent',
          inputs: {
            content: ':reportGenerator.content',
            metadata: {
              type: 'report',
              reportType,
              generatedAt: new Date().toISOString(),
              userId,
            }
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
    const reportContent = result.result.finalReport || 
                         result.result.answer || 
                         result.result.summary || 
                         'レポートの生成に失敗しました';

    // 生成されたレポートをRAGに保存
    if (userId && reportContent) {
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