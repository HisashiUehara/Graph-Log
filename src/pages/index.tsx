import { useState, useRef, useEffect } from 'react';
import { AIWorkflow } from '../lib/agents/workflows/AIWorkflow';
import { AgentContext } from '../lib/agents/types';
import { ChatHistory } from '../lib/agents/implementations/UIGeneratorAgent';
import ReportGenerator from '../components/ReportGenerator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'こんにちは！フィールドエンジニア向けツールへようこそ。\n\n以下のようなことができます：\n- ログデータのアップロードと解析\n- 画像・動画データの分析\n- レポート自動生成'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [reportTemplate, setReportTemplate] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 自然言語入力を解析してアクションを決定する関数
  const analyzeUserIntent = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // レポート関連の要求を検出
    if (lowerText.includes('レポート') || lowerText.includes('報告書') || lowerText.includes('雛形')) {
      return {
        action: 'report',
        details: lowerText.includes('雛形') ? 'template' : 'general'
      };
    }
    
    // 分析関連の要求を検出
    if (lowerText.includes('分析') || lowerText.includes('解析') || lowerText.includes('ログ')) {
      return {
        action: 'analysis',
        details: lowerText.includes('ログ') ? 'log' : 'general'
      };
    }
    
    // その他のケース
    return {
      action: 'chat',
      details: 'general'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input + (selectedFile ? `\n(添付ファイル: ${selectedFile.name})` : '')
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setAnalysisResults(null);

    console.log('送信ファイル:', selectedFile ? selectedFile.name : 'なし');

    // ユーザーの意図を分析
    const intent = analyzeUserIntent(input);
    console.log('ユーザーの意図:', intent);

    // レポート作成関連の要求の場合
    if (intent.action === 'report') {
      setShowReportGenerator(true);
      
      // AIから応答メッセージを取得
      try {
        const workflow = new AIWorkflow();
        const context: AgentContext = {
          userId: 'test-user',
          sessionId: Date.now().toString(),
          timestamp: Date.now(),
          metadata: {
            prompt: input.trim(),
            file: selectedFile,
            intent: intent // 意図情報をメタデータに追加
          }
        };

        console.log('ワークフロー実行開始', context);
        const result = await workflow.execute(context);
        console.log('ワークフロー実行結果:', result);
        
        // AIからの応答を表示
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.success 
            ? result.data?.response || 'レポート作成画面を表示しました。テンプレートを選択してください。'
            : `エラーが発生しました: ${result.error}`
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `エラーが発生しました: ${error.message}`
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 通常の分析フロー
    try {
      const workflow = new AIWorkflow();
      const context: AgentContext = {
        userId: 'test-user',
        sessionId: Date.now().toString(),
        timestamp: Date.now(),
        metadata: {
          prompt: input.trim(),
          file: selectedFile,
          intent: intent // 意図情報をメタデータに追加
        }
      };

      console.log('ワークフロー実行開始', context);
      const result = await workflow.execute(context);
      console.log('ワークフロー実行結果:', result);
      
      // 分析結果があれば保存
      if (result.success && result.data) {
        console.log('分析結果データ:', JSON.stringify(result.data, null, 2));
        
        // 分析結果を直接取得
        if (result.data.analysisResult) {
          console.log('分析結果を設定:', JSON.stringify(result.data.analysisResult, null, 2));
          setAnalysisResults(result.data.analysisResult);
        } else {
          // 分析エージェントの結果を探して取得
          const steps = result.data.steps || [];
          for (const step of steps) {
            if (step.agent === 'Analysis' && step.data?.analysisResult) {
              console.log('ステップから分析結果を取得:', JSON.stringify(step.data.analysisResult, null, 2));
              setAnalysisResults(step.data.analysisResult);
              break;
            }
          }
        }
      } else {
        console.log('分析結果なし:', result);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.success 
          ? result.data?.response || '処理が完了しました。分析結果を確認してください。'
          : `エラーが発生しました: ${result.error}`
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `エラーが発生しました: ${error.message}`
      }]);
    } finally {
      setLoading(false);
      // 分析結果がセットされているか確認
      console.log('最終分析結果:', analysisResults);
    }
  };

  // 分析結果が更新されたときに確認
  useEffect(() => {
    console.log('分析結果が更新されました:', analysisResults);
  }, [analysisResults]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // レポート生成画面を閉じる
  const handleCloseReportGenerator = () => {
    setShowReportGenerator(false);
  };

  const renderAnalysisResults = () => {
    if (!analysisResults) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-2">分析結果</h3>
        
        {analysisResults.summary && (
          <div className="mb-3">
            <h4 className="font-medium">概要</h4>
            <p className="text-sm">{analysisResults.summary}</p>
          </div>
        )}
        
        {analysisResults.fileType && (
          <div className="mb-3">
            <h4 className="font-medium">ファイル情報</h4>
            <p className="text-sm">
              ファイル名: {analysisResults.fileName}<br />
              {analysisResults.contentType && `種類: ${analysisResults.contentType}`}
              {analysisResults.fileSize && `, サイズ: ${Math.round(analysisResults.fileSize / 1024)} KB`}
            </p>
          </div>
        )}
        
        {analysisResults.patterns && analysisResults.patterns.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium">検出パターン</h4>
            <ul className="list-disc list-inside text-sm">
              {analysisResults.patterns.map((pattern: any, index: number) => (
                <li key={index} className={`${pattern.severity === 'high' || pattern.severity === 'critical' ? 'text-red-600' : ''}`}>
                  {pattern.type}: {pattern.description} (頻度: {pattern.frequency})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysisResults.insights && analysisResults.insights.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium">分析結果</h4>
            <ul className="list-disc list-inside text-sm">
              {analysisResults.insights.map((insight: string, index: number) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysisResults.educationalValue && (
          <div className="mb-3">
            <h4 className="font-medium">教育的価値</h4>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${analysisResults.educationalValue * 10}%` }}></div>
              </div>
              <span className="ml-2 text-sm">{analysisResults.educationalValue}/10</span>
            </div>
            {analysisResults.relevance && (
              <p className="text-sm mt-1">{analysisResults.relevance}</p>
            )}
          </div>
        )}
        
        {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium">推奨対応</h4>
            <ul className="list-disc list-inside text-sm">
              {analysisResults.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-4">
        {/* チャット履歴 - 画面左側 */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-32px)] flex flex-col">
          <h2 className="text-xl font-bold mb-4">チャット履歴</h2>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 text-gray-800 ml-8'
                    : 'bg-gray-100 text-gray-800 mr-8'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* メインコンテンツ - 画面右側 */}
        <div className="w-full md:w-2/3 flex flex-col h-[calc(100vh-32px)]">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex-1 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">フィールドエンジニア支援システム</h1>
            
            {showReportGenerator ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">レポート作成</h2>
                  <button 
                    onClick={handleCloseReportGenerator}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    ×
                  </button>
                </div>
                <ReportGenerator />
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">データ解析</h2>
                  <p className="mb-4">ログデータや画像をアップロードして分析できます。結果に基づいたレポートも自動生成します。</p>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg flex-1">
                      <h3 className="font-medium mb-2">ログ解析</h3>
                      <p className="text-sm mb-2">システムログやエラーログを解析し、問題点を特定します</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg flex-1">
                      <h3 className="font-medium mb-2">画像・動画分析</h3>
                      <p className="text-sm mb-2">現場の写真や動画から異常を検出します</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg flex-1">
                      <h3 className="font-medium mb-2">レポート生成</h3>
                      <p className="text-sm mb-2">分析結果を元に報告書を自動生成します</p>
                    </div>
                  </div>
                </div>
                
                {/* 分析結果表示 */}
                {renderAnalysisResults()}
              </>
            )}
          </div>
          
          {/* 入力フォーム */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? '処理中...' : '送信'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <span className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    ファイル選択
                  </span>
                  {selectedFile ? selectedFile.name : 'ファイルが選択されていません'}
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 