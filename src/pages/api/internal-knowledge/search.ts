import { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '@/lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      query,
      department,
      accessLevel = ['public', 'company', 'department', 'project'],
      mediaTypes = ['text', 'image', 'video'],
      threshold = 0.3,
      limit = 10,
      userId
    } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: '検索クエリが必要です' 
      });
    }

    console.log(`🔍 Searching internal knowledge: "${query}"`);

    // Internal Knowledge検索（RAG searchとは分離）
    const results = await PersistentRAGService.searchInternalKnowledge(query, {
      userId,
      department,
      accessLevel,
      mediaTypes,
      threshold,
      limit
    });

    console.log(`✅ Internal knowledge search completed: ${results.length} results`);

    res.status(200).json({
      success: true,
      results: results.map(result => ({
        id: result.id,
        content: result.content,
        mediaType: result.metadata.mediaType,
        fileName: result.metadata.fileName,
        fileSize: result.metadata.fileSize,
        mediaUrl: result.metadata.mediaUrl,
        transcription: result.metadata.transcription,
        timestamp: result.metadata.timestamp,
        userId: result.metadata.userId,
        department: result.metadata.department,
        accessLevel: result.metadata.accessLevel,
        similarity: result.similarity
      })),
      query,
      searchStats: {
        total: results.length,
        threshold,
        mediaTypes: mediaTypes.filter(type => 
          results.some(r => r.metadata.mediaType === type)
        )
      }
    });

  } catch (error) {
    console.error('Internal knowledge search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Knowledge検索に失敗しました'
    });
  }
} 