import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const templateInstructions = {
  incident: "自動運転車両の事故・インシデントレポートを作成してください。以下の項目について詳細に記述してください：インシデントの概要、発生時刻、場所、詳細な状況、対応措置、今後の対策。",
  maintenance: "自動運転車両の定期メンテナンスレポートを作成してください。以下の項目について詳細に記述してください：点検の概要、実施日時、点検項目、結果、特記事項、次回点検予定。",
  test: "自動運転車両のテスト走行レポートを作成してください。以下の項目について詳細に記述してください：テストの概要、実施日時、天候・路面状況、テスト項目、結果、課題・改善点。"
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { template, content } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: templateInstructions[template as keyof typeof templateInstructions]
        },
        {
          role: "user",
          content: content
        }
      ],
    });

    return res.status(200).json({
      report: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ message: 'Error generating report' });
  }
} 