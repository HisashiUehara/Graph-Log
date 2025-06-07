import { EmbeddingProviderManager, EmbeddingPresets, type EmbeddingConfig } from './embeddingProviders';

/**
 * GraphAI用embedding使用例
 */
export class GraphAIEmbeddingExample {
  
  /**
   * 1. OpenAI Embeddings（現在の実装）
   */
  static async useOpenAIEmbeddings() {
    const config: EmbeddingConfig = {
      ...EmbeddingPresets.OPENAI_SMALL,
      apiKey: process.env.OPENAI_API_KEY,
    };

    const embeddingManager = new EmbeddingProviderManager(config);
    
    try {
      const text = "システムログの異常を検知しました";
      const embedding = await embeddingManager.generateEmbedding(text);
      
      console.log('OpenAI Embedding生成完了:');
      console.log(`次元数: ${embedding.length}`);
      console.log(`最初の10個の値: ${embedding.slice(0, 10)}`);
      
      return embedding;
    } catch (error) {
      console.error('OpenAI Embedding エラー:', error);
      throw error;
    }
  }

  /**
   * 2. Cohere Embeddings（多言語対応）
   */
  static async useCohereEmbeddings() {
    const config: EmbeddingConfig = {
      ...EmbeddingPresets.COHERE_MULTILINGUAL,
      apiKey: process.env.COHERE_API_KEY, // 要設定
    };

    const embeddingManager = new EmbeddingProviderManager(config);
    
    try {
      const text = "Network connectivity issues detected";
      const embedding = await embeddingManager.generateEmbedding(text);
      
      console.log('Cohere Embedding生成完了:');
      console.log(`次元数: ${embedding.length}`);
      
      return embedding;
    } catch (error) {
      console.error('Cohere Embedding エラー:', error);
      throw error;
    }
  }

  /**
   * 3. Hugging Face Embeddings（オープンソース）
   */
  static async useHuggingFaceEmbeddings() {
    const config: EmbeddingConfig = {
      ...EmbeddingPresets.HUGGINGFACE_MINILM,
      apiKey: process.env.HUGGINGFACE_API_KEY, // 要設定
    };

    const embeddingManager = new EmbeddingProviderManager(config);
    
    try {
      const text = "データベース接続エラーが発生しました";
      const embedding = await embeddingManager.generateEmbedding(text);
      
      console.log('Hugging Face Embedding生成完了:');
      console.log(`次元数: ${embedding.length}`);
      
      return embedding;
    } catch (error) {
      console.error('Hugging Face Embedding エラー:', error);
      throw error;
    }
  }

  /**
   * 4. Ollama Embeddings（ローカル実行）
   */
  static async useOllamaEmbeddings() {
    const config: EmbeddingConfig = {
      ...EmbeddingPresets.OLLAMA_NOMIC,
      // API keyは不要（ローカル実行）
    };

    const embeddingManager = new EmbeddingProviderManager(config);
    
    try {
      const text = "セキュリティアラート: 不正なアクセス試行を検知";
      const embedding = await embeddingManager.generateEmbedding(text);
      
      console.log('Ollama Embedding生成完了:');
      console.log(`次元数: ${embedding.length}`);
      
      return embedding;
    } catch (error) {
      console.error('Ollama Embedding エラー:', error);
      console.log('注意: Ollamaがローカルで起動していることを確認してください');
      throw error;
    }
  }

  /**
   * 5. プロバイダー比較テスト
   */
  static async compareEmbeddingProviders() {
    const testText = "IoTセンサーから異常な温度データを受信";
    const results: Array<{
      provider: string;
      model: string;
      dimensions: number;
      embedding: number[];
      executionTime: number;
    }> = [];

    // OpenAI
    try {
      const startTime = Date.now();
      const openaiManager = new EmbeddingProviderManager({
        ...EmbeddingPresets.OPENAI_SMALL,
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openaiEmbedding = await openaiManager.generateEmbedding(testText);
      const executionTime = Date.now() - startTime;

      results.push({
        provider: 'OpenAI',
        model: 'text-embedding-3-small',
        dimensions: openaiEmbedding.length,
        embedding: openaiEmbedding.slice(0, 5), // 最初の5個のみ表示
        executionTime,
      });
    } catch (error) {
      console.log('OpenAI比較テストスキップ:', error.message);
    }

    // Hugging Face (API Keyがある場合のみ)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const startTime = Date.now();
        const hfManager = new EmbeddingProviderManager({
          ...EmbeddingPresets.HUGGINGFACE_MINILM,
          apiKey: process.env.HUGGINGFACE_API_KEY,
        });
        const hfEmbedding = await hfManager.generateEmbedding(testText);
        const executionTime = Date.now() - startTime;

        results.push({
          provider: 'Hugging Face',
          model: 'all-MiniLM-L6-v2',
          dimensions: hfEmbedding.length,
          embedding: hfEmbedding.slice(0, 5),
          executionTime,
        });
      } catch (error) {
        console.log('Hugging Face比較テストエラー:', error.message);
      }
    }

    console.log('\n=== Embedding Provider 比較結果 ===');
    results.forEach(result => {
      console.log(`\n${result.provider}:`);
      console.log(`  モデル: ${result.model}`);
      console.log(`  次元数: ${result.dimensions}`);
      console.log(`  実行時間: ${result.executionTime}ms`);
      console.log(`  サンプル値: [${result.embedding.map(v => v.toFixed(4)).join(', ')}...]`);
    });

    return results;
  }

  /**
   * 6. GraphAI統合用のEmbedding Agent作成例
   */
  static createGraphAIEmbeddingAgent(providerConfig: EmbeddingConfig) {
    return {
      name: 'embeddingAgent',
      agent: async (inputs: { text: string }) => {
        const embeddingManager = new EmbeddingProviderManager(providerConfig);
        const embedding = await embeddingManager.generateEmbedding(inputs.text);
        
        return {
          embedding,
          dimensions: embeddingManager.getDimensions(),
          provider: providerConfig.provider,
          model: providerConfig.model,
        };
      },
      inputs: {
        text: 'string',
      },
      output: {
        embedding: 'array',
        dimensions: 'number',
        provider: 'string',
        model: 'string',
      },
    };
  }
}

// 利用方法のサンプル
export async function demonstrateEmbeddingProviders() {
  console.log('🚀 GraphAI Embedding Providers デモ開始\n');

  // 1. OpenAI Embeddings
  console.log('1. OpenAI Embeddings テスト');
  try {
    await GraphAIEmbeddingExample.useOpenAIEmbeddings();
  } catch (error) {
    console.log('OpenAIテストスキップ: API Keyが設定されていません');
  }

  console.log('\n---\n');

  // 2. プロバイダー比較
  console.log('2. プロバイダー比較テスト');
  try {
    await GraphAIEmbeddingExample.compareEmbeddingProviders();
  } catch (error) {
    console.log('比較テストエラー:', error.message);
  }

  console.log('\n🎯 GraphAI用のEmbedding Agentサンプル:');
  
  // 3. GraphAI Agent作成例
  const embeddingAgent = GraphAIEmbeddingExample.createGraphAIEmbeddingAgent({
    ...EmbeddingPresets.OPENAI_SMALL,
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  console.log('Embedding Agent設定完了:');
  console.log(`- Agent名: ${embeddingAgent.name}`);
  console.log(`- 入力: ${JSON.stringify(embeddingAgent.inputs)}`);
  console.log(`- 出力: ${JSON.stringify(embeddingAgent.output)}`);
}

// 環境変数設定例
export const REQUIRED_ENV_VARS = {
  OPENAI_API_KEY: 'OpenAI API Key（現在設定済み）',
  COHERE_API_KEY: 'Cohere API Key（オプション）',
  HUGGINGFACE_API_KEY: 'Hugging Face API Key（オプション）',
  // Ollama: ローカル実行のためAPI Key不要
}; 