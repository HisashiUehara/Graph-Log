import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    // OpenAIを使用してログを解析
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "自動運転車両のログデータを解析し、ユーザーの質問に答えてください。回答は簡潔で具体的な内容にしてください。"
        },
        {
          role: "user",
          content: query
        }
      ],
    });

    // サンプルのチャートデータを生成
    // 実際のアプリケーションでは、ここで実際のログデータを解析して可視化データを生成します
    const chartData = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (9 - i) * 1000).toISOString(),
      value: Math.random() * 100
    }));

    return res.status(200).json({
      analysis: completion.choices[0].message.content,
      chartData
    });
  } catch (error) {
    console.error('Error analyzing logs:', error);
    return res.status(500).json({ message: 'Error analyzing logs' });
  }
} 