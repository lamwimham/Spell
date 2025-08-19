// 通义千问 API 类型定义

export interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface QwenChatRequest {
  model: string;
  input: {
    messages: QwenMessage[];
  };
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    seed?: number;
    repetition_penalty?: number;
    enable_search?: boolean;
  };
}

export interface QwenChatResponse {
  output: {
    finish_reason: string;
    text: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

export interface QwenError {
  message: string;
  code: string;
  request_id: string;
}
