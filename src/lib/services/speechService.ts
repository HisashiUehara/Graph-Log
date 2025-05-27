import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class SpeechService {
  /**
   * 音声をテキストに変換（Speech-to-Text）
   */
  static async speechToText(audioFile: File): Promise<string> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'ja', // 日本語
      });
      
      return transcription.text;
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      throw new Error('音声の文字起こしに失敗しました');
    }
  }

  /**
   * テキストを音声に変換（Text-to-Speech）
   */
  static async textToSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'): Promise<ArrayBuffer> {
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });

      return await mp3.arrayBuffer();
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw new Error('音声の生成に失敗しました');
    }
  }

  /**
   * 音声ファイルを再生
   */
  static playAudio(audioBuffer: ArrayBuffer): void {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.play().catch(error => {
      console.error('Audio playback error:', error);
    });

    // メモリリークを防ぐため、再生後にURLを解放
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
    });
  }

  /**
   * 音声録音機能（ブラウザのMediaRecorder API使用）
   */
  static async startRecording(): Promise<MediaRecorder> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      return mediaRecorder;
    } catch (error) {
      console.error('Recording start error:', error);
      throw new Error('音声録音の開始に失敗しました');
    }
  }

  /**
   * 録音データをFileオブジェクトに変換
   */
  static recordingToFile(chunks: Blob[], filename: string = 'recording.webm'): File {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    return new File([blob], filename, { type: 'audio/webm' });
  }
} 