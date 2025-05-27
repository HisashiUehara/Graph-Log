import { AgentFunctionContext } from 'graphai';
import OpenAI from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIInput {
  system?: string;
  prompt: string;
}

/**
 * OpenAIエージェント - GPTモデルを使用してテキスト生成を行う
 */
export async function openAIAgent(context: AgentFunctionContext): Promise<any> {
  try {
    // GraphAI 2.0.3のnamedInputs形式で入力を取得
    const system = context.namedInputs?.system || 'You are a helpful assistant.';
    const prompt = context.namedInputs?.prompt || '';
    
    // パラメータの取得
    const model = context.params?.model || 'gpt-4-turbo-preview';
    const temperature = context.params?.temperature || 0.7;
    const maxTokens = context.params?.max_tokens || 1000;
    
    console.log(`OpenAI agent processing with model: ${model}`);
    console.log(`Prompt length: ${prompt.length} characters`);
    
    if (!prompt) {
      throw new Error('プロンプトが提供されていません');
    }
    
    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
    });
    
    const response = {
      text: completion.choices[0]?.message?.content || '',
      model,
      usage: completion.usage,
      timestamp: new Date().toISOString()
    };
    
    return response;
  } catch (error) {
    console.error('OpenAI agent error:', error);
    throw new Error(`OpenAI agent failed: ${error.message}`);
  }
} 