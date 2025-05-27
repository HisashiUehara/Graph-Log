import OpenAI from 'openai';
import { UIConfig, UIComponent, UIType } from '../types/uiTypes';

// OpenAI APIクライアントを初期化
// 複数の一般的な環境変数名を試す
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
               process.env.OPENAI_API_KEY || 
               process.env.NEXT_OPENAI_API_KEY || 
               '';

console.log('API Key available:', apiKey ? '✓ Yes' : '✗ No');

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // ブラウザでの使用を許可（本番環境では非推奨）
});

// システムプロンプト - LLMにUIコンポーネントの生成方法を説明
const SYSTEM_PROMPT = `あなたはフィールドエンジニア向けのUIコンポーネントを生成するアシスタントです。
ユーザーの要求に基づいて、Material-UIコンポーネントを使った適切なUIを設計してください。

以下のコンポーネントタイプが利用可能です：
- TextField
- Button
- Typography
- Select (with MenuItem children)
- Checkbox
- Divider

レスポンスはJSON形式で、以下の構造に従ってください：
{
  "type": "UIタイプ (report/logViewer/dataAnalysis/form/dashboard)",
  "components": [
    {
      "type": "コンポーネントタイプ",
      "props": { プロパティ },
      "children": [ 子コンポーネント（必要な場合） ]
    }
  ]
}

UIのタイプは以下のいずれかを選択：
- report: レポート作成用UI
- logViewer: ログ閲覧・検索用UI
- dataAnalysis: データ分析用UI
- form: データ入力フォーム
- dashboard: ダッシュボード

適切なフィールドラベル、プレースホルダー、説明文を日本語で含めてください。`;

/**
 * OpenAI APIを使用してUIコンポーネントを生成するサービス
 */
export class OpenAIService {
  /**
   * ユーザーのプロンプトに基づいてUIコンポーネントを生成
   * @param prompt ユーザーのプロンプト
   * @returns 生成されたUIコンフィグ
   */
  static async generateUIComponents(prompt: string): Promise<UIConfig> {
    try {
      // APIキーが設定されているか確認
      if (!apiKey) {
        console.warn('OpenAI APIキーが設定されていません。フォールバックUIを返します。');
        throw new Error('OpenAI APIキーが設定されていません');
      }

      // OpenAI APIにリクエスト
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // 最新のモデルを使用
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' } // JSON形式のレスポンスを要求
      });

      // レスポンスからコンテンツを取得
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('APIから有効なレスポンスが返されませんでした');
      }

      // JSONをパース
      const parsedResponse = JSON.parse(content);
      
      // UIConfig形式に変換して返す
      return {
        type: parsedResponse.type || UIType.DASHBOARD,
        components: parsedResponse.components || []
      };
    } catch (error) {
      console.error('OpenAI APIエラー:', error);
      
      // エラー時はデフォルトのUIを返す
      return {
        type: UIType.DASHBOARD,
        components: [
          {
            type: 'Typography',
            props: {
              variant: 'h6',
              text: 'エラーが発生しました',
              gutterBottom: true
            }
          },
          {
            type: 'Typography',
            props: {
              variant: 'body1',
              text: 'UIの生成中にエラーが発生しました。もう一度お試しください。',
              color: 'error'
            }
          }
        ]
      };
    }
  }
} 