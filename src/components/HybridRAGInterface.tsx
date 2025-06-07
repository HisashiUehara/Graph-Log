import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface HybridRAGInterfaceProps {
  userId?: string;
  onError?: (error: string) => void;
}

interface SearchResult {
  id: string;
  content: string;
  type: string;
  namespace: string;
  source: string;
  timestamp: string;
  similarity: number;
  relevanceScore: number;
  rank: number;
  citation: string;
}

interface SearchResponse {
  query: string;
  summary: string;
  results: SearchResult[];
  categories: {
    logs: Array<{ id: string; content: string; similarity: number; timestamp: string }>;
    knowledge: Array<{ id: string; content: string; similarity: number; type: string }>;
  };
  stats: {
    totalResults: number;
    logResults: number;
    knowledgeResults: number;
    searchTime: number;
    searchMode: string;
    hasResults: boolean;
  };
}

export default function HybridRAGInterface({ userId = 'test-user', onError }: HybridRAGInterfaceProps) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'logs' | 'knowledge' | 'security'>('hybrid');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  // Initialize data and get system statistics
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Quick test to add sample data
        await fetch('/api/quick-hybrid-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        // Get statistics
        const statsResponse = await fetch('/api/debug-hybrid-data');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.debug.stats);
        }
      } catch (error) {
        console.error('System initialization error:', error);
      }
    };

    initializeSystem();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      onError?.('Please enter a search query');
      return;
    }

    setLoading(true);
    
    try {
      // First add sample data (required for each session)
      await fetch('/api/quick-hybrid-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      // Execute hybrid search
      const response = await fetch('/api/hybrid-rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId,
          searchMode,
          config: {
            threshold: 0.1, // Low threshold for broader search
            limit: 8
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
        
        // Add to recent search queries
        setRecentQueries(prev => {
          const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
          return updated;
        });
      } else {
        onError?.(data.error || 'Hybrid search failed');
      }
    } catch (error) {
      onError?.(`Search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
  };

  const quickQueries = [
    'Database error',
    'CPU usage',
    'System monitoring',
    'Security issues',
    'Project progress'
  ];

  const getNamespaceColor = (namespace: string) => {
    const colors = {
      logs: 'bg-emerald-100 text-emerald-800',
      knowledge: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      projects: 'bg-purple-100 text-purple-800'
    };
    return colors[namespace as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      log: '📝',
      manual: '📖',
      policy: '📋',
      report: '📊',
      analysis: '🔍',
      knowledge: '💡'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Hybrid RAG Search</span>
          </CardTitle>
          <CardDescription>
            Advanced search functionality integrating log data and internal knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search settings */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter search content..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">🔄 Hybrid</SelectItem>
                <SelectItem value="logs">📝 Logs Only</SelectItem>
                <SelectItem value="knowledge">📚 Knowledge Only</SelectItem>
                <SelectItem value="security">🔒 Security</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading || !query.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? '🔄' : '🔍'} Search
            </Button>
          </div>

          {/* Quick search */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-emerald-600">Quick Search:</div>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((quickQuery) => (
                <Button
                  key={quickQuery}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuery(quickQuery)}
                  className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  {quickQuery}
                </Button>
              ))}
            </div>
          </div>

          {/* Recent searches */}
          {recentQueries.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-emerald-600">Recent Searches:</div>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((recentQuery, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickQuery(recentQuery)}
                    className="text-xs text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    {recentQuery}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Search statistics */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{searchResults.stats.totalResults}</div>
                  <div className="text-sm text-emerald-600">Total Results</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{searchResults.stats.logResults}</div>
                  <div className="text-sm text-emerald-600">Log Results</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{searchResults.stats.knowledgeResults}</div>
                  <div className="text-sm text-emerald-600">Knowledge Results</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{searchResults.stats.searchTime}ms</div>
                  <div className="text-sm text-emerald-600">Search Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI summary */}
          {searchResults.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span>AI Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded">
                  <p className="text-emerald-700">{searchResults.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search results list */}
          {searchResults.results.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({searchResults.results.length} items)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.results.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 hover:bg-emerald-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(result.type)}</span>
                          <Badge className={getNamespaceColor(result.namespace)}>
                            {result.namespace}
                          </Badge>
                          <Badge variant="outline">{result.type}</Badge>
                          <span className="text-sm font-medium">#{result.rank}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-emerald-500">
                          <span>Similarity: {Math.round(result.similarity * 100)}%</span>
                          <span>Relevance: {Math.round(result.relevanceScore * 100)}%</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-emerald-700 leading-relaxed">{result.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-emerald-500">
                        <span>Source: {result.source}</span>
                        <span>{new Date(result.timestamp).toLocaleString('en-US')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No search results found</h3>
                <p className="text-emerald-600 mb-4">
                  Please try different keywords or add sample data.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await fetch('/api/test-hybrid-rag', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ addSampleData: true })
                      });
                      onError?.('Sample data added. Please search again.');
                    } catch (error) {
                      onError?.('Failed to add sample data');
                    }
                  }}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  📝 Add Sample Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* System information */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Documents</div>
                <div className="text-emerald-600">{stats.total}</div>
              </div>
              <div>
                <div className="font-medium">Environment</div>
                <div className="text-emerald-600">{stats.storageInfo?.environment || 'unknown'}</div>
              </div>
              <div>
                <div className="font-medium">Persistence</div>
                <div className="text-emerald-600">
                  {stats.storageInfo?.localStorageAvailable ? '✅' : '❌'} Local / 
                  {stats.storageInfo?.indexedDBAvailable ? '✅' : '❌'} IndexedDB
                </div>
              </div>
              <div>
                <div className="font-medium">In Memory</div>
                <div className="text-emerald-600">{stats.storageInfo?.memoryCount || 0} items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}