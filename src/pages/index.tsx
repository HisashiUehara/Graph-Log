import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VoiceInterface from '@/components/VoiceInterface';
import HybridRAGInterface from '@/components/HybridRAGInterface';
import dynamic from 'next/dynamic';

// Dynamic import for Input Knowledge to avoid SSR issues
const InputKnowledgePage = dynamic(() => import('./input-knowledge'), {
  ssr: false,
  loading: () => <p>Loading Input Knowledge...</p>
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simple' | 'report' | 'rag' | 'hybrid' | 'input'>('simple');
  const [logData, setLogData] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState('user_session_001');
  const [ragStats, setRagStats] = useState<any>(null);
  
  // RAG chat state
  const [chatHistory, setChatHistory] = useState<Array<{id: string, type: 'user' | 'assistant', content: string, timestamp: string}>>([]);
  const [ragQuery, setRagQuery] = useState('');

  // Sample data
  const sampleLogData = `2024-01-25 10:30:15 INFO System startup
2024-01-25 10:30:16 INFO Database connection successful
2024-01-25 10:31:22 WARNING CPU usage reached 85%
2024-01-25 10:32:45 ERROR Memory shortage occurred
2024-01-25 10:33:01 ERROR Connection timeout: database.example.com
2024-01-25 10:33:15 INFO Attempting automatic recovery
2024-01-25 10:33:30 INFO System recovery completed`;

  // Stable character configuration
  const graphLogChars = useMemo(() => [
    { char: 'G', color: '#228B22', id: 'g-0' },
    { char: 'r', color: '#C0C0C0', id: 'r-1' },
    { char: 'a', color: '#228B22', id: 'a-2' },
    { char: 'p', color: '#C0C0C0', id: 'p-3' },
    { char: 'h', color: '#FFFFFF', id: 'h-4' },
    { char: '-', color: '#FF69B4', id: 'dash-5' },
    { char: 'L', color: '#228B22', id: 'l-6' },
    { char: 'o', color: '#C0C0C0', id: 'o-7' },
    { char: 'g', color: '#228B22', id: 'g2-8' }
  ], []);

  // Fetch RAG statistics
  useEffect(() => {
    const fetchRagStats = async () => {
      try {
        const response = await fetch(`/api/rag-stats?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setRagStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch RAG stats:', error);
      }
    };
    
    fetchRagStats();
  }, [userId, result]);

  // Voice transcription handler
  const handleVoiceTranscription = (text: string) => {
    if (activeTab === 'simple') {
      setQuery(text);
    } else if (activeTab === 'rag') {
      setRagQuery(text);
    }
  };

  // Voice error handler
  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Audio playback
  const playResultAudio = async () => {
    if (!result) return;
    
    try {
      const textToSpeak = typeof result === 'string' ? result : 
                         result.analysis || result.report || result.response || 
                         JSON.stringify(result);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak }),
      });

      const data = await response.json();
      if (data.success) {
        // Play Base64 audio data
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
        ], { type: data.mimeType });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.play().catch(error => {
          console.error('Audio playback error:', error);
          setError('Audio playback failed');
        });

        // Prevent memory leaks by releasing URL after playback
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
        });
      } else {
        setError(data.error || 'Audio generation failed');
      }
    } catch (error) {
      setError(`Audio playback failed: ${error.message}`);
    }
  };

  // Simple Analysis
  const handleSimpleAnalysis = async () => {
    if (!logData.trim()) {
      setError('Please enter log data');
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
      setError(`Error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Report Generation
  const handleReportGeneration = async () => {
    if (!result) {
      setError('No analysis results available. Please run analysis first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysisData = {
        summary: result.analysis || result.finalReport || 'Analysis completed',
        findings: ['Log analysis executed', 'Error detection', 'System status check'],
        recommendations: ['Implement regular monitoring', 'Resource optimization', 'Error response procedure review']
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
      setError(`Report generation error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // RAG Search (chat format)
  const handleRAGSearch = async () => {
    if (!ragQuery.trim()) {
      setError('Please enter a question');
      return;
    }

    // Add user message to chat history
    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user' as const,
      content: ragQuery,
      timestamp: new Date().toLocaleString('en-US')
    };
    setChatHistory(prev => [...prev, userMessage]);

    setLoading(true);
    setError(null);
    const currentQuery = ragQuery;
    setRagQuery(''); // Clear input field

    try {
      // Use intelligent search API
      const response = await fetch('/api/rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentQuery, 
          userId,
          useIntelligentSearch: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Add assistant response to chat history
        const assistantMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant' as const,
          content: data.response,
          timestamp: new Date().toLocaleString('en-US')
        };
        setChatHistory(prev => [...prev, assistantMessage]);
        
        // Show related information if available
        if (data.relatedDocuments > 0) {
          console.log(`Referenced historical data: ${data.relatedDocuments} items`);
        }
      } else {
        setError(data.error || 'RAG search failed');
      }
    } catch (error) {
      setError(`RAG search error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
    
    return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="container mx-auto px-6 pt-24 pb-8">
          <div className="text-left max-w-4xl">
            <h1 className="mb-2 relative" style={{ fontSize: '6rem', fontWeight: 'bold', letterSpacing: '2px' }}>
              <div 
                className="flex gradient-text"
                style={{
                  background: 'linear-gradient(90deg,rgb(236, 56, 59) 0%,rgb(245, 67, 60) 8%,rgb(252, 85, 65) 16%,rgb(255, 108, 73) 24%,rgb(255, 132, 81) 32%,rgb(255, 157, 90) 40%,rgb(255, 182, 98) 48%,rgb(250, 206, 108) 56%,rgb(235, 225, 118) 64%,rgb(210, 235, 120) 72%,rgb(180, 225, 110) 80%,rgb(140, 211, 101) 88%,rgb(82, 194, 93) 94%,rgb(24, 216, 85) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: '#10B981',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4)) drop-shadow(0 8px 24px rgba(255, 107, 107, 0.3))'
                }}
              >
                {graphLogChars.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      display: 'inline-block',
                      userSelect: 'text',
                      cursor: 'text'
                    }}
                    title={`Character: ${item.char}`}
                  >
                    {item.char}
                  </span>
                ))}
              </div>
              <style jsx>{`
                .gradient-text {
                  -webkit-background-clip: text !important;
                  -webkit-text-fill-color: transparent !important;
                  background-clip: text !important;
                  animation: glow 3s ease-in-out infinite alternate;
                }
                
                @keyframes glow {
                  0% {
                    filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4)) drop-shadow(0 8px 24px rgba(255, 107, 107, 0.3));
                  }
                  100% {
                    filter: drop-shadow(0 6px 16px rgba(16, 185, 129, 0.6)) drop-shadow(0 12px 32px rgba(255, 107, 107, 0.5));
                  }
                }
                
                /* フォールバック */
                @supports not (-webkit-background-clip: text) {
                  .gradient-text {
                    color: #10B981 !important;
                  }
                }
              `}</style>
            </h1>
            
            <p className="text-4xl font-bold text-emerald-600 mb-2">
              Comprehensive AI Assistant
            </p>
            <p className="text-lg text-emerald-700 leading-relaxed mb-16">
              A powerful AI system for log analysis, knowledge management, and intelligent data processing
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-0">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          {[
            { id: 'simple', label: 'Simple Analysis', icon: '📊' },
            { id: 'report', label: 'Report Generation', icon: '📝' },
            { id: 'rag', label: 'RAG Search', icon: '🧠' },
            { id: 'hybrid', label: 'Hybrid RAG', icon: '🔄' },
            { id: 'input', label: 'Input Knowledge', icon: '📝' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                  : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Full-width Interfaces */}
          {(activeTab === 'hybrid' || activeTab === 'input') ? (
            <div className="lg:col-span-3">
              {activeTab === 'hybrid' && (
                <HybridRAGInterface 
                  userId={userId} 
                  onError={setError} 
                />
              )}
              {activeTab === 'input' && (
                <InputKnowledgePage />
              )}
            </div>
          ) : (
            <>
              {/* Input Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>📝</span>
                      <span>Input Data</span>
                    </CardTitle>
                    <CardDescription>
                      Enter log data or questions. Voice input is also available.
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
                
                    {/* RAG tab chat interface */}
                    {activeTab === 'rag' ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">💬 AI Information Chat</h3>
                          <p className="text-sm text-emerald-600">
                            Ask questions about previously entered log data and analysis results
                          </p>
                        </div>
                        
                        {/* Chat history */}
                        <div className="bg-emerald-50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                          {chatHistory.length === 0 ? (
                            <div className="text-center text-emerald-500 py-8">
                              <p>💡 Question examples:</p>
                              <ul className="mt-2 text-sm space-y-1">
                                <li>• What are the important errors in today's logs?</li>
                                <li>• Please summarize the analysis results</li>
                                <li>• Tell me about the system status</li>
                              </ul>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {chatHistory.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[70%] p-3 rounded-lg ${
                                      message.type === 'user'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-emerald-50 border border-emerald-200'
                                    }`}
                                  >
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                    <div className={`text-xs mt-1 ${
                                      message.type === 'user' ? 'text-emerald-100' : 'text-emerald-400'
                                    }`}>
                                      {message.timestamp}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* RAG question input */}
                        <div className="flex space-x-2">
                          <Input
                            value={ragQuery}
                            onChange={(e) => setRagQuery(e.target.value)}
                            placeholder="Enter your question..."
                            onKeyPress={(e) => e.key === 'Enter' && handleRAGSearch()}
                          />
                          <Button onClick={handleRAGSearch} disabled={loading || !ragQuery.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? '⏳' : 'Send'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Existing log data input (for log analysis tab) */}
                        {(activeTab === 'simple') && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Log Data
                            </label>
                            <Textarea
                              value={logData}
                              onChange={(e) => setLogData(e.target.value)}
                              placeholder="Enter log data..."
                              className="min-h-[200px]"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLogData(sampleLogData)}
                              className="mt-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              Load Sample Data
                            </Button>
                          </div>
                        )}
                    
                        {/* Question/Query input (non-RAG) */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Question/Query
                          </label>
                          <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter your question..."
                          />
                        </div>
                        
                        {/* Action buttons (non-RAG) */}
                        <div className="flex space-x-2">
                          {activeTab === 'simple' && (
                            <Button onClick={handleSimpleAnalysis} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              {loading ? 'Analyzing...' : 'Simple Analysis'}
                            </Button>
                          )}
                          {activeTab === 'report' && (
                            <Button onClick={handleReportGeneration} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              {loading ? 'Generating...' : 'Generate Report'}
                            </Button>
                          )}
                          
                          {result && (
                            <Button variant="outline" onClick={playResultAudio} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                              🔊 Play Audio
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Results Section */}
                {(result || error) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>📋</span>
                        <span>Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 mb-4">
                          <p className="text-emerald-800">{error}</p>
                        </div>
                      )}
                      
                      {result && (
                        <div className="space-y-4">
                          {result.analysis && (
                            <div>
                              <h3 className="font-semibold mb-2">Analysis Results:</h3>
                              <div className="bg-emerald-50 rounded-lg p-4 whitespace-pre-wrap">
                                {result.analysis}
                              </div>
                            </div>
                          )}
                          
                          {result.report && (
                            <div>
                              <h3 className="font-semibold mb-2">Report:</h3>
                              <div className="bg-emerald-50 rounded-lg p-4 whitespace-pre-wrap">
                                {result.report}
                              </div>
                            </div>
                          )}
                          
                          {result.response && (
                            <div>
                              <h3 className="font-semibold mb-2">RAG Response:</h3>
                              <div className="bg-emerald-50 rounded-lg p-4 whitespace-pre-wrap">
                                {result.response}
                              </div>
                            </div>
                          )}
                          
                          {result.finalReport && (
                            <div>
                              <h3 className="font-semibold mb-2">Final Report:</h3>
                              <div className="bg-emerald-50 rounded-lg p-4 whitespace-pre-wrap">
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
                      <span>RAG Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ragStats && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Total Documents:</span> {ragStats.total}
                        </p>
                        <div className="text-sm">
                          <span className="font-medium">By Type:</span>
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
                      <span>Features</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <span>🎤</span>
                        <span>Voice Input/Output</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>🔍</span>
                        <span>Log Analysis</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>📊</span>
                        <span>Report Generation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>🧠</span>
                        <span>RAG Search</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 