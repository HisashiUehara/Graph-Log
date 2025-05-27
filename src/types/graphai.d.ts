import { AgentFunctionContext } from 'graphai';

declare module 'graphai' {
  export interface KnowledgeOutput {
    content: string;
    source: string;
  }

  export interface LogAnalysisOutput {
    content: string;
    highlights: string[];
    timestamp: string;
  }

  export interface ReportAgentOutput {
    content: string;
    metadata: {
      title: string;
      date: string;
      author: string;
      template: string;
    };
    extractedInfo: {
      [key: string]: string | string[];
    };
  }

  export interface AgentFunctionInfo {
    knowledgeAgent?: (context: AgentFunctionContext) => Promise<KnowledgeOutput>;
    logAnalysisAgent?: (context: AgentFunctionContext) => Promise<LogAnalysisOutput>;
    reportAgent?: (context: AgentFunctionContext) => Promise<ReportAgentOutput>;
  }

  export interface GraphAIResult {
    answer?: string;
    summary?: string;
    markdown?: string;
    metadata?: any;
    templateAnalysis?: {
      text: string;
    };
    chatAssistant?: {
      text: string;
    };
    finalReport?: string;
  }

  export class GraphAI {
    constructor(flow: any, options: { agents: AgentFunctionInfo });
    injectValue(key: string, value: any): void;
    run(): Promise<GraphAIResult>;
  }
} 