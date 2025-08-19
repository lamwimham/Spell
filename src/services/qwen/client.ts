// 通义千问 API 客户端

import { QWEN_API_BASE_URL, QWEN_CHAT_COMPLETION_ENDPOINT } from './config';
import { QwenChatRequest, QwenChatResponse, QwenError } from './types';

export class QwenAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = QWEN_API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天完成请求
   * @param request 聊天请求参数
   * @returns Promise<QwenChatResponse>
   */
  async chatCompletion(request: QwenChatRequest): Promise<QwenChatResponse> {
    const url = `${this.baseUrl}${QWEN_CHAT_COMPLETION_ENDPOINT}`;

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: QwenError = await response.json();
        throw new Error(`Qwen API Error: ${errorData.message} (Code: ${errorData.code})`);
      }

      const data: QwenChatResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('Unknown error occurred');
    }
  }
}
