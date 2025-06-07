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
      content,
      mediaType = 'text',
      department,
      accessLevel = 'company',
      source = 'manual_input',
      userId
    } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'コンテンツが必要です' 
      });
    }

    console.log('📝 Adding internal knowledge:', { mediaType, department, accessLevel });

    // Internal Knowledge追加
    const documentId = await PersistentRAGService.addInternalKnowledge(content, {
      source,
      type: `internal_${mediaType}` as any,
      userId,
      department,
      accessLevel,
      mediaType: mediaType as 'text' | 'image' | 'video',
    });

    console.log(`✅ Internal knowledge added: ${documentId}`);

    res.status(200).json({
      success: true,
      id: documentId,
      message: 'Internal Knowledgeが正常に追加されました'
    });

  } catch (error) {
    console.error('Internal knowledge add error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Knowledgeの追加に失敗しました'
    });
  }
} 