import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    const stats = RAGService.getDocumentStats(userId as string);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('RAG stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get RAG statistics',
    });
  }
} 