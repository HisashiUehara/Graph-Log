import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, userId, systemPrompt } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await RAGService.generateRAGResponse(query, userId, systemPrompt);

    // ユーザーの質問もRAGに保存
    if (userId) {
      await RAGService.addDocument(query, {
        source: 'user_query',
        type: 'query',
        userId,
      });
    }

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('RAG response API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response',
    });
  }
} 