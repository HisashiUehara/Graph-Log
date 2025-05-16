import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
  linux: "Linuxコマンドについて、具体的な使用例と説明を提供してください。",
  ros: "ROSコマンドについて、具体的な使用例と説明を提供してください。",
  docker: "Dockerコマンドについて、具体的な使用例と説明を提供してください。",
  git: "Gitコマンドについて、具体的な使用例と説明を提供してください。"
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, category } = req.body;

    const systemPrompt = category ? systemPrompts[category as keyof typeof systemPrompts] : 
      "Linux、ROS、Docker、Gitのコマンドについて、具体的な使用例と説明を提供してください。";

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ],
    });

    // AIの応答をコマンドオブジェクトの配列に変換
    const response = completion.choices[0].message.content;
    const commands = response.split('\n\n').map(block => {
      const lines = block.split('\n');
      return {
        command: lines[0].replace(/^[#\-*]\s*/, ''),
        description: lines[1] || '',
        example: lines[2] || '',
        category: category || 'general'
      };
    });

    return res.status(200).json({ commands });
  } catch (error) {
    console.error('Error searching commands:', error);
    return res.status(500).json({ message: 'Error searching commands' });
  }
} 