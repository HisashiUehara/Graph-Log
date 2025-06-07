import type { NextApiRequest, NextApiResponse } from 'next';
import { PersistentRAGService } from '../../lib/services/persistentRAGService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, userId, searchMode = 'hybrid', config = {} } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'クエリが必要です' });
  }

  try {
    console.log(`🔍 Hybrid RAG Search: "${query}" (mode: ${searchMode})`);
    const startTime = Date.now();

    // 検索設定
    const searchConfig = {
      userId,
      logWeight: config.logWeight || 0.6,
      knowledgeWeight: config.knowledgeWeight || 0.4,
      internalWeight: config.internalWeight || 1.1, // Internal Knowledge weight
      includeInternal: config.includeInternal !== false, // Default to true
      limit: config.limit || 8,
      threshold: config.threshold || 0.25,
      ...config
    };

    let searchResults;

    switch (searchMode) {
      case 'logs':
        // ログのみ検索
        searchResults = await PersistentRAGService.hybridSearch(query, {
          ...searchConfig,
          includeNamespaces: ['logs'],
          includeInternal: false, // Exclude internal for logs-only search
          logWeight: 1.0,
          knowledgeWeight: 0.0
        });
        break;

      case 'knowledge':
        // ナレッジのみ検索
        const knowledgeData = await PersistentRAGService.hybridSearch(query, {
          ...searchConfig,
          includeNamespaces: ['knowledge', 'projects'],
          includeInternal: false, // Exclude internal for knowledge-only search
          logWeight: 0.0,
          knowledgeWeight: 1.0
        });
        // フォーマット統一
        searchResults = {
          logs: [],
          knowledge: knowledgeData.knowledge,
          internal: [],
          integrated: knowledgeData.knowledge.map(doc => ({ ...doc, relevanceScore: doc.similarity })),
          summary: await generateSimpleSummary(query, knowledgeData.knowledge)
        };
        break;

      case 'internal':
        // Internal Knowledge専用検索（フィールドエンジニア専用）
        const internalResults = await PersistentRAGService.searchInternalKnowledge(query, {
          userId,
          threshold: searchConfig.threshold,
          limit: searchConfig.limit
        });
        // フォーマット統一
        searchResults = {
          logs: [],
          knowledge: [],
          internal: internalResults,
          integrated: internalResults.map(doc => ({ ...doc, relevanceScore: doc.similarity })),
          summary: await generateSimpleSummary(query, internalResults, 'internal')
        };
        break;

      case 'security':
        // セキュリティ専用検索
        searchResults = await PersistentRAGService.hybridSearch(query, {
          ...searchConfig,
          includeNamespaces: ['security', 'logs'],
          includeInternal: false // Security searches exclude internal by default
        });
        break;

      default:
        // ハイブリッド検索（Internal Knowledge含む）
        searchResults = await PersistentRAGService.hybridSearch(query, searchConfig);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // レスポンス統計
    const stats = {
      totalResults: searchResults.integrated.length,
      logResults: searchResults.logs.length,
      knowledgeResults: searchResults.knowledge.length,
      internalResults: searchResults.internal ? searchResults.internal.length : 0, // Add internal stats
      searchTime: responseTime,
      searchMode,
      hasResults: searchResults.integrated.length > 0,
      includeInternal: searchConfig.includeInternal
    };

    // 結果の整形
    const formattedResults = {
      query,
      summary: searchResults.summary,
      results: searchResults.integrated.map((doc, index) => ({
        id: doc.id,
        content: doc.content,
        type: doc.metadata.type,
        namespace: doc.metadata.namespace,
        source: doc.metadata.source,
        timestamp: doc.metadata.timestamp,
        // Internal Knowledge用の追加フィールド
        mediaType: doc.metadata.mediaType,
        department: doc.metadata.department,
        accessLevel: doc.metadata.accessLevel,
        fileName: doc.metadata.fileName,
        // スコア情報
        similarity: Math.round(doc.similarity * 100) / 100,
        relevanceScore: Math.round(doc.relevanceScore * 100) / 100,
        rank: index + 1,
        citation: `[${index + 1}] ${doc.metadata.type} (${doc.metadata.namespace})`
      })),
      categories: {
        logs: searchResults.logs.map(doc => ({
          id: doc.id,
          content: doc.content.substring(0, 150) + '...',
          similarity: Math.round(doc.similarity * 100) / 100,
          timestamp: doc.metadata.timestamp
        })),
        knowledge: searchResults.knowledge.map(doc => ({
          id: doc.id,
          content: doc.content.substring(0, 150) + '...',
          similarity: Math.round(doc.similarity * 100) / 100,
          type: doc.metadata.type
        })),
        internal: searchResults.internal ? searchResults.internal.map(doc => ({
          id: doc.id,
          content: doc.content.substring(0, 150) + '...',
          similarity: Math.round(doc.similarity * 100) / 100,
          mediaType: doc.metadata.mediaType,
          department: doc.metadata.department,
          accessLevel: doc.metadata.accessLevel
        })) : []
      },
      stats,
      searchConfig: {
        mode: searchMode,
        threshold: searchConfig.threshold,
        logWeight: searchConfig.logWeight,
        knowledgeWeight: searchConfig.knowledgeWeight,
        internalWeight: searchConfig.internalWeight,
        includeInternal: searchConfig.includeInternal
      }
    };

    console.log(`✅ Search completed: ${stats.totalResults} results in ${responseTime}ms`);

    res.status(200).json({
      success: true,
      data: formattedResults
    });

  } catch (error) {
    console.error('Hybrid RAG search error:', error);
    res.status(500).json({
      success: false,
      error: 'ハイブリッド検索に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 簡易要約生成（OpenAI未使用時のフォールバック）
 */
async function generateSimpleSummary(query: string, results: any[], context?: string): Promise<string> {
  if (results.length === 0) {
    const contextText = context === 'internal' ? 'Internal Knowledge' : '';
    return `「${query}」に関連する${contextText}情報は見つかりませんでした。`;
  }

  const types = Array.from(new Set(results.map(r => r.metadata.type)));
  const namespaces = Array.from(new Set(results.map(r => r.metadata.namespace)));
  
  let summaryText = `「${query}」について${results.length}件の関連情報が見つかりました。`;
  
  if (context === 'internal') {
    const mediaTypes = Array.from(new Set(results.map(r => r.metadata.mediaType).filter(Boolean)));
    if (mediaTypes.length > 0) {
      summaryText += ` メディアタイプ: ${mediaTypes.join(', ')}`;
    }
  } else {
    summaryText += ` 検索範囲: ${namespaces.join(', ')} / 種類: ${types.join(', ')}`;
  }
  
  return summaryText;
} 