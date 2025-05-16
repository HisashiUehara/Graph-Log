import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// サンプルのナレッジベースデータ
const knowledgeBase = [
  {
    title: '自動運転システムの基本アーキテクチャ',
    content: '自動運転システムは、知覚、認識、判断、制御の4つの主要コンポーネントで構成されています。各コンポーネントは独立したROSノードとして実装され、トピックを介して通信を行います。',
    source: '自動運転システム設計ガイドライン v2.0',
    tags: ['architecture', 'ros', 'system-design']
  },
  {
    title: 'センサーキャリブレーション手順',
    content: 'LiDARとカメラのキャリブレーションは、専用のキャリブレーションボードを使用して行います。キャリブレーションデータは yaml ファイルとして保存され、起動時に読み込まれます。',
    source: 'センサーキャリブレーションマニュアル v1.2',
    tags: ['calibration', 'lidar', 'camera', 'sensors']
  },
  {
    title: '緊急時の対応手順',
    content: '緊急停止が発生した場合、まず車両の状態を確認し、ログを保存します。その後、発生時の状況を詳細に記録し、開発チームに報告します。',
    source: '緊急対応マニュアル v3.0',
    tags: ['emergency', 'safety', 'procedures']
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    // OpenAIのEmbedding APIを使用してクエリをベクトル化
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    // 実際のアプリケーションでは、ここでベクトルデータベース（例：Pinecone）を使用して
    // 類似度検索を行います。このサンプルでは簡易的な実装を行います。
    const results = knowledgeBase.map(item => ({
      ...item,
      relevance: Math.random() // 実際のアプリケーションでは、ベクトル間のコサイン類似度を計算します
    }))
    .sort((a, b) => b.relevance - a.relevance);

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return res.status(500).json({ message: 'Error searching knowledge base' });
  }
} 