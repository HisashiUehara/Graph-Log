import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechService } from '../../lib/services/speechService';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // ファイルを読み込んでFileオブジェクトに変換
    const fileBuffer = fs.readFileSync(audioFile.filepath);
    const file = new File([fileBuffer], audioFile.originalFilename || 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm',
    });

    const transcription = await SpeechService.speechToText(file);

    res.status(200).json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error('Speech-to-text API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Speech-to-text conversion failed',
    });
  }
} 