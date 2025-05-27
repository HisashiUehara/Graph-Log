import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechService } from '../../lib/services/speechService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioBuffer = await SpeechService.textToSpeech(text, voice);

    // ArrayBufferをBase64に変換してレスポンス
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.status(200).json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('Text-to-speech API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Text-to-speech conversion failed',
    });
  }
} 