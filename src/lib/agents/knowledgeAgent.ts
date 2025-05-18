import { AgentFunctionContext } from 'graphai';

interface KnowledgeInput {
  query: string;
  context?: string;
}

interface KnowledgeOutput {
  content: string;
  source: string;
  error?: string;
}

interface KnowledgeContext extends AgentFunctionContext {
  inputs: KnowledgeInput;
}

export const knowledgeAgent = async (context: KnowledgeContext): Promise<KnowledgeOutput> => {
  try {
    const { query, context: userContext } = context.inputs;

    if (!query) {
      throw new Error('Query is required');
    }

    // Combine query with context if available
    const searchContent = userContext 
      ? `${query}\nAdditional Context: ${userContext}`
      : query;

    // TODO: Replace with actual knowledge base search
    // This is a placeholder implementation
    const content = `Sample content related to: ${searchContent}`;
    
    return {
      content,
      source: "knowledge-base"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: '',
      source: "error",
      error: errorMessage
    };
  }
}; 