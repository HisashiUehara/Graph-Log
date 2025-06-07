import OpenAI from 'openai';

// Embedding provider types
export type EmbeddingProvider = 'openai' | 'cohere' | 'huggingface' | 'ollama' | 'azure-openai';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  dimensions?: number;
}

export class EmbeddingProviderManager {
  private config: EmbeddingConfig;
  private openai?: OpenAI;

  constructor(config: EmbeddingConfig) {
    this.config = config;
    
    if (config.provider === 'openai' && config.apiKey) {
      this.openai = new OpenAI({ apiKey: config.apiKey });
    }
  }

  /**
   * 統一されたembedding生成インターface
   */
  async generateEmbedding(text: string): Promise<number[]> {
    switch (this.config.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text);
      case 'cohere':
        return this.generateCohereEmbedding(text);
      case 'huggingface':
        return this.generateHuggingFaceEmbedding(text);
      case 'ollama':
        return this.generateOllamaEmbedding(text);
      case 'azure-openai':
        return this.generateAzureOpenAIEmbedding(text);
      default:
        throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
    }
  }

  /**
   * OpenAI Embeddings（現在の実装）
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model || 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error('OpenAI埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * Cohere Embeddings
   */
  private async generateCohereEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/embed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          model: this.config.model || 'embed-english-v3.0',
        }),
      });

      const data = await response.json();
      return data.embeddings[0];
    } catch (error) {
      console.error('Cohere embedding error:', error);
      throw new Error('Cohere埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * Hugging Face Embeddings
   */
  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.config.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text,
          }),
        }
      );

      const data = await response.json();
      return Array.isArray(data[0]) ? data[0] : data;
    } catch (error) {
      console.error('Hugging Face embedding error:', error);
      throw new Error('Hugging Face埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * Ollama Embeddings（ローカル）
   */
  private async generateOllamaEmbedding(text: string): Promise<number[]> {
    try {
      const baseUrl = this.config.baseUrl || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'nomic-embed-text',
          prompt: text,
        }),
      });

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Ollama embedding error:', error);
      throw new Error('Ollama埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * Azure OpenAI Embeddings
   */
  private async generateAzureOpenAIEmbedding(text: string): Promise<number[]> {
    try {
      // Azure OpenAI specific implementation
      const baseUrl = this.config.baseUrl;
      const response = await fetch(`${baseUrl}/openai/deployments/${this.config.model}/embeddings?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
        }),
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Azure OpenAI embedding error:', error);
      throw new Error('Azure OpenAI埋め込みベクトルの生成に失敗しました');
    }
  }

  /**
   * embeddingの次元数を取得
   */
  getDimensions(): number {
    const dimensionMap: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
      'embed-english-v3.0': 1024,
      'embed-multilingual-v3.0': 1024,
      'all-MiniLM-L6-v2': 384,
      'all-mpnet-base-v2': 768,
      'nomic-embed-text': 768,
    };

    return this.config.dimensions || dimensionMap[this.config.model] || 1536;
  }
}

// 利用例とプリセット設定
export const EmbeddingPresets = {
  // OpenAI（高品質、商用）
  OPENAI_SMALL: {
    provider: 'openai' as EmbeddingProvider,
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  OPENAI_LARGE: {
    provider: 'openai' as EmbeddingProvider,
    model: 'text-embedding-3-large',
    dimensions: 3072,
  },

  // Cohere（多言語対応）
  COHERE_ENGLISH: {
    provider: 'cohere' as EmbeddingProvider,
    model: 'embed-english-v3.0',
    dimensions: 1024,
  },
  COHERE_MULTILINGUAL: {
    provider: 'cohere' as EmbeddingProvider,
    model: 'embed-multilingual-v3.0',
    dimensions: 1024,
  },

  // Hugging Face（無料・オープンソース）
  HUGGINGFACE_MINILM: {
    provider: 'huggingface' as EmbeddingProvider,
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 384,
  },
  HUGGINGFACE_MPNET: {
    provider: 'huggingface' as EmbeddingProvider,
    model: 'sentence-transformers/all-mpnet-base-v2',
    dimensions: 768,
  },

  // Ollama（ローカル実行）
  OLLAMA_NOMIC: {
    provider: 'ollama' as EmbeddingProvider,
    model: 'nomic-embed-text',
    dimensions: 768,
    baseUrl: 'http://localhost:11434',
  },
}; 