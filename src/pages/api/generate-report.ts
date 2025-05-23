import type { NextApiRequest, NextApiResponse } from 'next';

// レポートテンプレートIDに基づいてシステムプロンプトを生成
const getSystemPrompt = (templateId: string): string => {
  const basePrompt = `あなたはフィールドエンジニア向けの報告書作成支援AIです。
専門的かつ簡潔な文体でレポートを作成してください。
実際のデータや事実を基にしたレポートの作成を心がけてください。`;

  switch (templateId) {
    case 'incident':
      return `${basePrompt}
事故・インシデントレポートの作成を行います。
以下の項目を埋める形で、マークダウン形式のレポートを作成してください：
- インシデント概要: 何が起きたかを簡潔に説明
- 発生時刻: いつ問題が発生したか
- 場所: どこで発生したか
- 詳細: 何が起きたか、どのような影響があったかを詳細に説明
- 対応措置: どのような対応を行ったか
- 今後の対策: 再発防止のためにどのような対策を取るべきか`;

    case 'maintenance':
      return `${basePrompt}
定期メンテナンスレポートの作成を行います。
以下の項目を埋める形で、マークダウン形式のレポートを作成してください：
- 点検概要: どのような点検を行ったか
- 実施日時: いつ点検を行ったか
- 点検項目: 何を点検したか（リスト形式で）
- 結果: 点検結果（問題点があれば詳細に）
- 特記事項: 特に注意すべき点、改善すべき点
- 次回点検予定: 次回の点検予定日`;

    case 'test':
      return `${basePrompt}
テスト走行レポートの作成を行います。
以下の項目を埋める形で、マークダウン形式のレポートを作成してください：
- テスト概要: どのようなテストを実施したか
- 実施日時: いつテストを行ったか
- 天候・路面状況: テスト時の環境条件
- テスト項目: 何をテストしたか（リスト形式で）
- 結果: テスト結果と発見された問題点
- 課題・改善点: 今後改善すべき点`;

    default:
      return basePrompt;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { template, content, prompt } = req.body;

    if (!template || !content) {
      return res.status(400).json({ error: 'テンプレートとコンテンツは必須です' });
    }

    // APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key が設定されていません' });
    }

    const systemPrompt = getSystemPrompt(template);
    
    // OpenAI APIを呼び出し
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `以下のレポートの雛形を具体的な内容で埋めてください:\n\n${content}${prompt ? `\n\n追加指示: ${prompt}` : ''}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const generatedReport = data.choices[0].message.content;

    res.status(200).json({ report: generatedReport });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: `レポート生成に失敗しました: ${error.message}` });
  }
} 