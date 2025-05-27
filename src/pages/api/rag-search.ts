import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // ドキュメント追加
    try {
      const { content, metadata } = req.body;

      if (!content || !metadata) {
        return res.status(400).json({ error: 'Content and metadata are required' });
      }

      const documentId = await RAGService.addDocument(content, metadata);

      res.status(200).json({
        success: true,
        documentId,
        message: 'Document added successfully',
      });
    } catch (error) {
      console.error('RAG document addition error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add document',
      });
    }
  } else if (req.method === 'GET') {
    // ドキュメント検索
    try {
      const { 
        query, 
        limit = '5', 
        threshold = '0.7', 
        userId,
        type 
      } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      const filters: any = {};
      if (userId && typeof userId === 'string') filters.userId = userId;
      if (type && typeof type === 'string') filters.type = type;

      const documents = await RAGService.searchSimilarDocuments(
        query,
        parseInt(limit as string),
        parseFloat(threshold as string),
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        success: true,
        documents,
        count: documents.length,
      });
    } catch (error) {
      console.error('RAG search error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Search failed',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 