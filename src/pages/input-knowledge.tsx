import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

interface InputKnowledgeItem {
  id: string;
  content: string;
  mediaType: 'text' | 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
  transcription?: string;
  timestamp: string;
  userId?: string;
  department?: string;
  accessLevel: 'public' | 'company' | 'department' | 'project';
}

interface SearchResult extends InputKnowledgeItem {
  similarity: number;
}

const InputKnowledgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'search'>('add');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [content, setContent] = useState('');
  const [department, setDepartment] = useState('');
  const [accessLevel, setAccessLevel] = useState<'public' | 'company' | 'department' | 'project'>('company');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Handle text knowledge addition
  const handleTextSubmit = async () => {
    if (!content.trim()) {
      setUploadStatus('❌ Please enter text content');
      return;
    }

    setIsUploading(true);
    setUploadStatus('📝 Adding text knowledge...');

    try {
      const response = await fetch('/api/internal-knowledge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mediaType: 'text',
          department,
          accessLevel,
          source: 'manual_input'
        })
      });

      const result = await response.json();
      if (result.success) {
        setUploadStatus(`✅ Text knowledge added successfully (ID: ${result.id})`);
        setContent('');
      } else {
        setUploadStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus('❌ Upload failed');
      console.error('Text upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file upload (image/video)
  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setIsUploading(true);
    setUploadStatus(`📁 Uploading ${type === 'image' ? 'image' : 'video'}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', type);
    formData.append('department', department);
    formData.append('accessLevel', accessLevel);

    try {
      const response = await fetch('/api/internal-knowledge/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setUploadStatus(`✅ ${type === 'image' ? 'Image' : 'Video'} added successfully (ID: ${result.id})`);
      } else {
        setUploadStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus('❌ Upload failed');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle knowledge search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/internal-knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10
        })
      });

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.results);
        
        // Add to search history
        setSearchHistory(prev => {
          const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
          return updated;
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-emerald-800">📝 Input Knowledge</h1>
          <p className="text-emerald-600">Internal Knowledge Management System</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'default' : 'outline'}
            className={`flex items-center space-x-2 ${
              activeTab === 'add' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
            }`}
          >
            <LucideIcons.Plus className="w-4 h-4" />
            <span>Add Knowledge</span>
          </Button>
          <Button
            onClick={() => setActiveTab('search')}
            variant={activeTab === 'search' ? 'default' : 'outline'}
            className={`flex items-center space-x-2 ${
              activeTab === 'search' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
            }`}
          >
            <LucideIcons.Search className="w-4 h-4" />
            <span>Search Knowledge</span>
          </Button>
        </div>

        {/* Add Knowledge Tab */}
        {activeTab === 'add' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center space-x-2">
                  <LucideIcons.FileText className="w-5 h-5" />
                  <span>Basic Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-emerald-700">Department</label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Field Engineer"
                    className="bg-white border-emerald-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-emerald-700">Access Level</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded text-emerald-800"
                  >
                    <option value="public">Public</option>
                    <option value="company">Company</option>
                    <option value="department">Department</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-emerald-700">Media Type</label>
                  <div className="flex space-x-2">
                    {(['text', 'image', 'video'] as const).map((type) => (
                      <Button
                        key={type}
                        onClick={() => setMediaType(type)}
                        variant={mediaType === type ? 'default' : 'outline'}
                        className={`flex items-center space-x-1 ${
                          mediaType === type 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                            : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                        }`}
                      >
                        {type === 'text' && <LucideIcons.FileText className="w-4 h-4" />}
                        {type === 'image' && <LucideIcons.Image className="w-4 h-4" />}
                        {type === 'video' && <LucideIcons.Video className="w-4 h-4" />}
                        <span>{type === 'text' ? 'Text' : type === 'image' ? 'Image' : 'Video'}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center space-x-2">
                  <LucideIcons.Upload className="w-5 h-5" />
                  <span>Add Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mediaType === 'text' && (
                  <>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter text knowledge..."
                      rows={8}
                      className="bg-white border-emerald-300"
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={isUploading || !content.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isUploading ? 'Adding...' : 'Add Text Knowledge'}
                    </Button>
                  </>
                )}

                {mediaType === 'image' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'image');
                      }}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </>
                )}

                {mediaType === 'video' && (
                  <>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'video');
                      }}
                      className="hidden"
                    />
                    <Button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Video'}
                    </Button>
                  </>
                )}

                {uploadStatus && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                    <p className="text-sm text-emerald-700">{uploadStatus}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Input */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Knowledge Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search keywords..."
                    className="bg-white border-emerald-300 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-emerald-500 mb-2">Search History</p>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery(query);
                            handleSearch();
                          }}
                          className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="bg-white border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800">
                    Search Results ({searchResults.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 bg-emerald-50 border border-emerald-200 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.mediaType === 'text' && <LucideIcons.FileText className="w-4 h-4" />}
                            {result.mediaType === 'image' && <LucideIcons.Image className="w-4 h-4" />}
                            {result.mediaType === 'video' && <LucideIcons.Video className="w-4 h-4" />}
                            <Badge variant="outline" className="text-xs">
                              {result.mediaType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {result.accessLevel}
                            </Badge>
                            <span className="text-xs text-emerald-500">
                              Similarity: {(result.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-emerald-700 mb-2">
                          {result.content.length > 200 
                            ? `${result.content.substring(0, 200)}...` 
                            : result.content}
                        </p>
                        
                        <div className="flex justify-between items-center text-xs text-emerald-500">
                          <span>{result.department || 'Department not set'}</span>
                          <span>{new Date(result.timestamp).toLocaleString('en-US')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputKnowledgePage; 