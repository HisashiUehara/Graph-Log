import axios from 'axios';

/**
 * チャットAPIを呼び出す
 */
export async function callChatAPI(prompt: string, systemPrompt: string, temperature: number = 0.7) {
  try {
    const response = await axios.post('/api/chat', {
      prompt,
      systemPrompt,
      temperature
    });
    return response.data;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw new Error('チャットAPIの呼び出しに失敗しました');
  }
}

/**
 * レポート生成APIを呼び出す
 */
export async function generateReport(template: string, data: any = {}) {
  try {
    const response = await axios.post('/api/generate-report', {
      template,
      data
    });
    return response.data;
  } catch (error) {
    console.error('Report Generation API Error:', error);
    throw new Error('レポート生成APIの呼び出しに失敗しました');
  }
}

/**
 * GraphAIワークフローを実行する
 * @param workflow ワークフロー名（例: "report", "knowledge", "logAnalysis"）
 * @param inputs ワークフローへの入力値
 */
export async function executeGraphAIWorkflow(workflow: string, inputs: Record<string, any> = {}) {
  try {
    console.log(`Executing GraphAI workflow: ${workflow}`);
    const response = await axios.post('/api/graphai-workflow', {
      workflow,
      inputs
    });
    return response.data;
  } catch (error) {
    console.error('GraphAI Workflow API Error:', error);
    throw new Error(`GraphAIワークフローの実行に失敗しました: ${error.message}`);
  }
} 