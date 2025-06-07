import { NextApiRequest, NextApiResponse } from 'next';
import { RAGService } from '../../lib/services/ragService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    console.log('=== RAG DATABASE DEBUG ===');
    console.log('Requested UserID:', userId);

    // 全てのドキュメントを取得（デバッグ用）
    const allDocuments = (RAGService as any).documents || [];
    console.log('Total documents in RAG:', allDocuments.length);

    // ユーザー別データを取得
    const userLogs = userId ? RAGService.getUserDocuments(userId as string, 'log') : [];
    const userAnalyses = userId ? RAGService.getUserDocuments(userId as string, 'analysis') : [];
    const userReports = userId ? RAGService.getUserDocuments(userId as string, 'report') : [];

    console.log(`User ${userId} data:`, {
      logs: userLogs.length,
      analyses: userAnalyses.length,
      reports: userReports.length
    });

    // 全ドキュメントの詳細情報
    const documentDetails = allDocuments.map((doc: any) => ({
      id: doc.id,
      type: doc.metadata.type,
      source: doc.metadata.source,
      userId: doc.metadata.userId,
      timestamp: doc.metadata.timestamp,
      contentPreview: doc.content.substring(0, 100) + '...'
    }));

    // 類似度テスト
    const testQuery = "最新のエラーログが見たい";
    let searchResults = [];
    
    try {
      // 低い閾値でテスト検索
      searchResults = await RAGService.searchSimilarDocuments(
        testQuery,
        10,
        0.1, // 非常に低い閾値
        userId ? { userId: userId as string } : undefined
      );
      console.log('Search results with low threshold:', searchResults.length);
    } catch (searchError) {
      console.error('Search error:', searchError);
    }

    // ユニークユーザーIDを取得（TypeScript互換）
    const userIds = allDocuments.map((doc: any) => doc.metadata.userId).filter((id: any) => id);
    const uniqueUserIds = userIds.filter((id: any, index: number) => userIds.indexOf(id) === index);

    res.status(200).json({
      success: true,
      debug: {
        totalDocuments: allDocuments.length,
        userDocuments: {
          logs: userLogs.length,
          analyses: userAnalyses.length,
          reports: userReports.length,
          total: userLogs.length + userAnalyses.length + userReports.length
        },
        documentDetails,
        searchTest: {
          query: testQuery,
          resultsFound: searchResults.length,
          threshold: 0.1
        },
        allUsers: uniqueUserIds,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('RAG debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 