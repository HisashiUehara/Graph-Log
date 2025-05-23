import { BaseWorkflow } from '../workflow/BaseWorkflow';
import { AIAgent } from '../implementations/AIAgent';
import { UIGeneratorAgent } from '../implementations/UIGeneratorAgent';
import { AnalysisAgent } from '../implementations/AnalysisAgent';
import { ReportAgent } from '../implementations/ReportAgent';
import { AgentContext, AgentResponse } from '../types';

// カスタムのワークフローステップ型を定義
interface CustomWorkflowStep {
  agent: any;
  input: (context: AgentContext) => any;
  nextStep?: string | ((context: AgentContext, response: AgentResponse) => string);
  condition?: (response: AgentResponse) => boolean;
}

export class AIWorkflow extends BaseWorkflow {
  constructor() {
    const aiAgent = new AIAgent();
    const uiGenerator = new UIGeneratorAgent();
    const analysisAgent = new AnalysisAgent();
    const reportAgent = new ReportAgent();

    // カスタムステップを定義
    const steps: CustomWorkflowStep[] = [
      {
        agent: aiAgent,
        input: (context) => {
          // ユーザーの意図情報を取得
          const intent = context.metadata?.intent || { action: 'chat', details: 'general' };
          
          // レポート生成の場合は専用のプロンプトを使用
          let systemPrompt = "あなたはフィールドエンジニア向けの支援AIです。ロボットのデータ分析やレポート作成の支援を行います。質問や要求に具体的かつ簡潔に応答してください。";
          
          if (intent.action === 'report') {
            systemPrompt = "あなたはフィールドエンジニア向けのレポート作成支援AIです。ユーザーの要求に応じて適切なレポートテンプレートを提案し、必要な情報を収集して高品質なレポートを生成します。";
          } else if (intent.action === 'analysis') {
            systemPrompt = "あなたはフィールドエンジニア向けのデータ分析支援AIです。ログデータや画像・動画を分析し、問題点を特定して解決策を提案します。";
          }
          
          return {
            prompt: context.metadata?.prompt || '',
            systemPrompt: systemPrompt,
            temperature: 0.7,
            fileUploaded: !!context.metadata?.file,
            intent: intent // 意図情報も渡す
          };
        },
        // 文字列ではなく関数で次のステップを決定
        nextStep: (context) => {
          // 意図に基づいて次のステップを決定
          const intent = context.metadata?.intent || { action: 'chat', details: 'general' };
          
          if (intent.action === 'report') {
            return 'Report'; // レポート生成の場合は分析をスキップ
          }
          
          return 'UIGenerator';
        },
        condition: (response) => response.success
      },
      {
        agent: uiGenerator,
        input: (context) => {
          return {
            request: context.metadata?.prompt || '',
            previousResponse: context.previousStepResult?.data?.response || '',
            fileInfo: context.metadata?.file ? {
              name: context.metadata.file.name,
              type: context.metadata.file.type,
              size: context.metadata.file.size
            } : null,
            intent: context.metadata?.intent // 意図情報も渡す
          };
        },
        nextStep: 'Analysis',
        condition: (response) => response.success
      },
      {
        agent: analysisAgent,
        input: (context) => ({
          request: context.metadata?.prompt || '',
          chatHistory: context.previousStepResult?.data?.chatHistory || { messages: [] },
          fileData: context.metadata?.file || null,
          intent: context.metadata?.intent // 意図情報も渡す
        }),
        nextStep: 'Report',
        condition: (response) => response.success
      },
      {
        agent: reportAgent,
        input: (context) => {
          const intent = context.metadata?.intent || { action: 'chat', details: 'general' };
          
          return {
            analysisResult: context.previousStepResult?.data?.analysisResult || {},
            request: context.metadata?.prompt || '',
            fileData: context.metadata?.file || null,
            intent: intent // 意図情報も渡す
          };
        }
      }
    ];

    // BaseWorkflowのコンストラクタを呼び出す前に、nextStepが関数の場合は実行してstringに変換
    const processedSteps = steps.map(step => {
      // nextStepが関数の場合は処理しない（実行時に対応）
      return step;
    });

    super(
      'ai-workflow',
      'AI-Powered Field Engineer Support Workflow',
      'Workflow that uses AI to understand requirements and coordinate other agents',
      processedSteps as any
    );

    // カスタムステップをオリジナルとして保存
    (this as any).originalSteps = steps;
  }

  // BaseWorkflowのexecuteをオーバーライドして、動的なnextStepをサポート
  async execute(context: AgentContext): Promise<AgentResponse> {
    console.log('AIWorkflow.execute - 開始');
    console.log('コンテキスト:', JSON.stringify({
      userId: context.userId,
      metadata: {
        prompt: context.metadata?.prompt,
        filePresent: !!context.metadata?.file,
        intent: context.metadata?.intent
      }
    }, null, 2));

    try {
      console.log('=== カスタムワークフロー実行開始 ===', this.name);
      const originalSteps = (this as any).originalSteps || this.steps;
      let currentStep = originalSteps[0];
      let result: AgentResponse | null = null;
      let previousStepResult: AgentResponse | null = null;
      let stepIndex = 0;

      while (currentStep) {
        console.log(`=== ステップ ${stepIndex + 1} 実行: ${currentStep.agent.name} ===`);
        // 前のステップの結果を保存
        context.previousStepResult = previousStepResult;

        // 入力が関数の場合は実行、そうでなければそのまま使用
        const inputData = typeof currentStep.input === 'function' 
          ? currentStep.input(context) 
          : currentStep.input;

        console.log(`実行ステップ: ${currentStep.agent.name}, 入力:`, inputData);
        
        result = await currentStep.agent.execute(context, inputData);
        previousStepResult = result;
        (this as any)[`step${stepIndex}Result`] = result;
        
        console.log(`${currentStep.agent.name} の実行結果:`, result);
        
        if (!result.success) {
          console.log(`${currentStep.agent.name} が失敗したため、ワークフロー終了`);
          return this.processResult(context, result);
        }

        if (currentStep.condition) {
          const conditionResult = currentStep.condition(result);
          console.log(`条件判定: ${conditionResult ? '成功' : '失敗'}`);
          
          if (!conditionResult) {
            console.log('条件が満たされていないため、ワークフロー終了');
            break;
          }
        }

        // nextStepが関数かstringかに応じて処理
        if (currentStep.nextStep) {
          let nextStepName: string;
          
          if (typeof currentStep.nextStep === 'function') {
            nextStepName = currentStep.nextStep(context, result);
            console.log(`動的に決定された次のステップ: ${nextStepName}`);
          } else {
            nextStepName = currentStep.nextStep;
            console.log(`固定の次のステップ: ${nextStepName}`);
          }
          
          const nextStepIndex = originalSteps.findIndex(step => step.agent.name === nextStepName);
          if (nextStepIndex === -1) {
            console.log(`次のステップ ${nextStepName} が見つかりません`);
            return this.processResult(context, this.createErrorResponse(`Next step ${nextStepName} not found`));
          }
          
          console.log(`次のステップに進みます: ${nextStepName}`);
          currentStep = originalSteps[nextStepIndex];
          stepIndex++;
        } else {
          console.log('次のステップがないため、ワークフロー終了');
          break;
        }
      }

      console.log('=== ワークフロー実行終了 ===');
      return this.processResult(context, result || this.createErrorResponse('No steps executed'));
    } catch (error) {
      console.error('ワークフローエラー:', error);
      return this.processResult(context, this.createErrorResponse(`Workflow execution failed: ${error.message}`));
    }
  }

  // エラーレスポンスを生成
  protected createErrorResponse(error: string): AgentResponse {
    return {
      success: false,
      error
    };
  }

  // 最終結果を処理
  private processResult(context: AgentContext, result: AgentResponse): AgentResponse {
    // 各ステップの結果を保存
    const steps: any[] = [];
    
    // 分析結果を取得
    let analysisResult = null;
    let reportSuggestion = null;
    
    // 各ステップのログを出力し、分析結果を探す
    const originalSteps = (this as any).originalSteps || this.steps;
    originalSteps.forEach((step: any, index: number) => {
      const stepResult = (this as any)[`step${index}Result`];
      console.log(`ステップ ${index} (${step.agent.name}) 結果:`, 
                 stepResult ? JSON.stringify(stepResult.data, null, 2) : 'なし');
      
      // 分析結果を保存
      if (step.agent.name === 'Analysis' && stepResult?.success) {
        analysisResult = stepResult.data?.analysisResult;
        console.log('分析結果を検出:', analysisResult ? 'あり' : 'なし');
      }
      
      // レポート提案を保存
      if (step.agent.name === 'Report' && stepResult?.success) {
        reportSuggestion = stepResult.data?.reportSuggestion;
        console.log('レポート提案を検出:', reportSuggestion ? 'あり' : 'なし');
      }
      
      // ステップ情報を保存
      if (stepResult) {
        steps.push({
          agent: step.agent.name,
          success: stepResult.success,
          data: stepResult.data
        });
      }
    });
    
    // 意図に基づいて応答を調整
    let customResponse = result.data?.response;
    const intent = context.metadata?.intent;
    
    if (intent?.action === 'report') {
      customResponse = reportSuggestion?.message || 
                      'レポート作成画面を表示しました。テンプレートを選択してください。';
    }
    
    // 元のレスポンスに分析結果とステップ情報を追加
    const enhancedResult = {
      ...result,
      data: {
        ...(result.data || {}),
        steps,
        analysisResult, // 分析結果を直接返す
        reportSuggestion, // レポート提案を返す
        response: customResponse // カスタマイズされた応答
      }
    };
    
    console.log('AIWorkflow.execute - 完了:', 
              JSON.stringify({
                success: enhancedResult.success,
                analysisResult: enhancedResult.data?.analysisResult ? 'あり' : 'なし',
                reportSuggestion: enhancedResult.data?.reportSuggestion ? 'あり' : 'なし',
                stepsCount: steps.length,
                customResponse: customResponse !== result.data?.response
              }, null, 2));
              
    return enhancedResult;
  }
} 