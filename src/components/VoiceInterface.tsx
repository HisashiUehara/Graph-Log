import React, { useState, useRef, useEffect } from 'react';
import { SpeechService } from '../lib/services/speechService';

interface VoiceInterfaceProps {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscription,
  onError,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // 音声レベルの監視
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  // 録音開始
  const startRecording = async () => {
    try {
      const mediaRecorder = await SpeechService.startRecording();
      
      // 音声レベル監視の設定
      const stream = mediaRecorder.stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioFile = SpeechService.recordingToFile(audioChunksRef.current);
          const transcription = await SpeechService.speechToText(audioFile);
          onTranscription?.(transcription);
        } catch (error) {
          onError?.(`音声の文字起こしに失敗しました: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // タイマー開始
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // 音声レベル監視開始
      monitorAudioLevel();

    } catch (error) {
      onError?.(`録音の開始に失敗しました: ${error.message}`);
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);

      // タイマー停止
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // アニメーション停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // AudioContext停止
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`voice-interface ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* 録音ボタン */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            relative w-20 h-20 rounded-full border-4 transition-all duration-200
            ${isRecording 
              ? 'bg-red-500 border-red-600 animate-pulse' 
              : 'bg-primary-500 border-primary-600 hover:bg-primary-600'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            flex items-center justify-center text-white
          `}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <div className="w-6 h-6 bg-white rounded-sm" />
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
          
          {/* 音声レベルインジケーター */}
          {isRecording && (
            <div 
              className="absolute inset-0 rounded-full border-4 border-red-300"
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                opacity: 0.6,
              }}
            />
          )}
        </button>

        {/* ステータス表示 */}
        <div className="text-center">
          {isProcessing && (
            <p className="text-sm text-gray-600">音声を処理中...</p>
          )}
          {isRecording && (
            <div className="space-y-1">
              <p className="text-sm text-red-600 font-medium">録音中</p>
              <p className="text-xs text-gray-500">{formatTime(recordingTime)}</p>
            </div>
          )}
          {!isRecording && !isProcessing && (
            <p className="text-sm text-gray-600">マイクボタンを押して録音開始</p>
          )}
        </div>

        {/* 音声レベルバー */}
        {isRecording && (
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface; 