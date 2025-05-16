import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import cv from '@techstark/opencv-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const processImage = async (filePath: string, option: string) => {
  const img = cv.imread(filePath);
  let processed;

  switch (option) {
    case 'object-detection':
      // OpenAIのVision APIを使用して物体検出
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "この画像内の自動運転に関連する物体を検出し、その位置を示してください。" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${fs.readFileSync(filePath).toString('base64')}`,
                },
              },
            ],
          },
        ],
      });
      processed = response.choices[0].message.content;
      break;

    case 'lane-detection':
      // 車線検出の処理
      const gray = new cv.Mat();
      cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY);
      const edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150, 3);
      processed = edges;
      break;

    case 'semantic-segmentation':
      // セマンティックセグメンテーションの処理
      const hsv = new cv.Mat();
      cv.cvtColor(img, hsv, cv.COLOR_BGR2HSV);
      processed = hsv;
      break;

    default:
      throw new Error('Invalid processing option');
  }

  return processed;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    const option = fields.option?.[0];

    if (!file || !option) {
      return res.status(400).json({ message: 'Missing file or option' });
    }

    const processedResult = await processImage(file.filepath, option);

    // 処理結果を一時ファイルとして保存
    const outputPath = path.join(process.cwd(), 'public', 'processed', `${Date.now()}.jpg`);
    cv.imwrite(outputPath, processedResult);

    return res.status(200).json({
      processedUrl: `/processed/${path.basename(outputPath)}`
    });
  } catch (error) {
    console.error('Error processing media:', error);
    return res.status(500).json({ message: 'Error processing media' });
  }
} 