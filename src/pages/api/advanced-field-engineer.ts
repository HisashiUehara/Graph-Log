import { NextApiRequest, NextApiResponse } from 'next';
import { GraphAIManager } from '../../lib/utils/GraphAIManager';
import { readFileSync } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logData, query, requestType } = req.body;

    if (!logData && !query) {
      return res.status(400).json({ error: 'ログデータまたは質問が必要です' });
    }

    const graphAIManager = new GraphAIManager();

    // ワークフローファイルを読み込み
    const workflowPath = path.join(process.cwd(), 'src', 'flows', 'advanced-field-engineer.json');
    const workflowData = JSON.parse(readFileSync(workflowPath, 'utf8'));

    // 入力データを準備
    const inputs = {
      logData: logData || '',
      query: query || ''
    };

    console.log('Processing advanced field engineer request with inputs:', inputs);
    const result = await graphAIManager.executeWorkflow(workflowData, inputs);

    res.status(200).json(result);
  } catch (error) {
    console.error('Advanced field engineer API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
} 