import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VoiceInterface from '@/components/VoiceInterface';
import { SpeechService } from '@/lib/services/speechService';
import { RAGService } from '@/lib/services/ragService';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced' | 'report' | 'rag'>('simple');
  const [logData, setLogData] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(() => `user_${Date.now()}`);
  const [ragStats, setRagStats] = useState<any>(null);

  // サンプルデータ
  const sampleLogData = `2024-01-25 10:30:15 INFO システム開始
2024-01-25 10:30:16 INFO データベース接続成功
2024-01-25 10:31:22 WARNING CPU使用率が85%に達しました
2024-01-25 10:32:45 ERROR メモリ不足が発生しました
2024-01-25 10:33:01 ERROR 接続タイムアウト: database.example.com
2024-01-25 10:33:15 INFO 自動復旧を試行中
2024-01-25 10:33:30 INFO システム復旧完了`;

  // RAG統計を取得
  useEffect(() => {
    const stats = RAGService.getDocumentStats(userId);
    setRagStats(stats);
  }, [userId, result]);

  // 音声文字起こしのハンドラー
  const handleVoiceTranscription = (text: string) => {
    if (activeTab === 'simple' || activeTab === 'advanced') {
      setQuery(text);
    }
  };

  // 音声エラーハンドラー
  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 音声再生
  const playResultAudio = async () => {
    if (!result) return;
    
    try {
      const textToSpeak = typeof result === 'string' ? result : 
                         result.analysis || result.report || result.response || 
                         JSON.stringify(result);
      
      const audioBuffer = await SpeechService.textToSpeech(textToSpeak);
      SpeechService.playAudio(audioBuffer);
    } catch (error) {
      setError(`音声再生に失敗しました: ${error.message}`);
    }
  };

  // Simple Analysis
  const handleSimpleAnalysis = async () => {
    if (!logData.trim()) {
      setError('ログデータを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simple-field-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logData, query, userId }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      setError(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Analysis
  const handleAdvancedAnalysis = async () => {
    if (!logData.trim()) {
      setError('ログデータを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/advanced-field-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logData, query, userId }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      setError(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Report Generation
  const handleReportGeneration = async () => {
    if (!result) {
      setError('分析結果がありません。まず分析を実行してください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysisData = {
        summary: result.analysis || result.finalReport || '分析完了',
        findings: ['ログ分析実行', 'エラー検出', 'システム状態確認'],
        recommendations: ['定期監視の実施', 'リソース最適化', 'エラー対応手順の確認']
      };

      const response = await fetch('/api/report-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisData, reportType: 'standard', userId }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({ ...result, report: data.report });
      } else {
        setError(data.error || 'Report generation failed');
      }
    } catch (error) {
      setError(`レポート生成エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // RAG Search
  const handleRAGSearch = async () => {
    if (!query.trim()) {
      setError('検索クエリを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({ response: data.response });
      } else {
        setError(data.error || 'RAG search failed');
      }
    } catch (error) {
      setError(`RAG検索エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Graph-Log AI Assistant</h1>
              <p className="text-xl opacity-90">
                音声対応フィールドエンジニア向けAIアシスタント
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">GraphAI 2.0.5 + OpenAI</p>
                <p className="text-sm opacity-75">RAG機能搭載</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          {[
            { id: 'simple', label: 'Simple Analysis', icon: '🔍' },
            { id: 'advanced', label: 'Advanced Analysis', icon: '⚡' },
            { id: 'report', label: 'Report Generation', icon: '📊' },
            { id: 'rag', label: 'RAG Search', icon: '🧠' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📝</span>
                  <span>入力データ</span>
                </CardTitle>
                <CardDescription>
                  ログデータや質問を入力してください。音声入力も利用できます。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice Interface */}
                <div className="flex justify-center">
                  <VoiceInterface
                    onTranscription={handleVoiceTranscription}
                    onError={handleVoiceError}
                    className="mb-4"
                  />
                </div>

                {/* Log Data Input */}
                {(activeTab === 'simple' || activeTab === 'advanced') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ログデータ
                    </label>
                    <Textarea
                      value={logData}
                      onChange={(e) => setLogData(e.target.value)}
                      placeholder="ログデータを入力してください..."
                      className="min-h-[200px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogData(sampleLogData)}
                      className="mt-2"
                    >
                      サンプルデータを読み込み
                    </Button>
                  </div>
                )}

                {/* Query Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    質問・クエリ
                  </label>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="質問を入力してください..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {activeTab === 'simple' && (
                    <Button onClick={handleSimpleAnalysis} disabled={loading}>
                      {loading ? '分析中...' : 'Simple Analysis'}
                    </Button>
                  )}
                  {activeTab === 'advanced' && (
                    <Button onClick={handleAdvancedAnalysis} disabled={loading}>
                      {loading ? '分析中...' : 'Advanced Analysis'}
                    </Button>
                  )}
                  {activeTab === 'report' && (
                    <Button onClick={handleReportGeneration} disabled={loading}>
                      {loading ? '生成中...' : 'Generate Report'}
                    </Button>
                  )}
                  {activeTab === 'rag' && (
                    <Button onClick={handleRAGSearch} disabled={loading}>
                      {loading ? '検索中...' : 'RAG Search'}
                    </Button>
                  )}
                  
                  {result && (
                    <Button variant="outline" onClick={playResultAudio}>
                      🔊 音声で聞く
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {(result || error) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📋</span>
                    <span>結果</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}
                  
                  {result && (
                    <div className="space-y-4">
                      {result.analysis && (
                        <div>
                          <h3 className="font-semibold mb-2">分析結果:</h3>
                          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                            {result.analysis}
                          </div>
                        </div>
                      )}
                      
                      {result.report && (
                        <div>
                          <h3 className="font-semibold mb-2">レポート:</h3>
                          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                            {result.report}
                          </div>
                        </div>
                      )}
                      
                      {result.response && (
                        <div>
                          <h3 className="font-semibold mb-2">RAG回答:</h3>
                          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                            {result.response}
                          </div>
                        </div>
                      )}
                      
                      {result.finalReport && (
                        <div>
                          <h3 className="font-semibold mb-2">最終レポート:</h3>
                          <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                            {result.finalReport}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RAG Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>RAG統計</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ragStats && (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">総ドキュメント数:</span> {ragStats.total}
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">タイプ別:</span>
                      <ul className="ml-4 mt-1">
                        {Object.entries(ragStats.byType).map(([type, count]) => (
                          <li key={type}>
                            {type}: {count as number}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>✨</span>
                  <span>機能</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span>🎤</span>
                    <span>音声入力・出力</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>ログ分析</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>レポート生成</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>🧠</span>
                    <span>RAG検索</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>⚡</span>
                    <span>GraphAI 2.0.5</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>ユーザー情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  User ID: {userId.slice(-8)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  セッション開始: {new Date().toLocaleString('ja-JP')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 