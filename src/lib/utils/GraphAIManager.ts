import { GraphAI } from 'graphai';
import * as agents from '@graphai/agents';

export class GraphAIManager {
  private graphai: GraphAI | null = null;

  constructor() {
    // 標準エージェントのみを使用
    console.log('Available agents:', Object.keys(agents));
  }

  async executeWorkflow(workflowData: any, inputData: any = {}) {
    try {
      // 標準エージェントを使用してGraphAIインスタンスを作成
      this.graphai = new GraphAI(workflowData, agents as any);

      // 入力データがある場合は、ソースノードを直接更新
      if (inputData && Object.keys(inputData).length > 0) {
        Object.entries(inputData).forEach(([key, value]) => {
          if (workflowData.nodes[key]) {
            workflowData.nodes[key].value = value;
          }
        });
      }

      // ワークフローを実行
      const result = await this.graphai.run();
      
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.error('GraphAI execution error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  getAvailableAgents() {
    return Object.keys(agents);
  }
} 