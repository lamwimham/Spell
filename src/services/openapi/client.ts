// OpenAPI 客户端

import OpenAI from 'openai';
import {
  OPENAPI_DEFAULT_BASE_URL,
  OPENAPI_DEFAULT_MODEL,
  OPENAPI_DEFAULT_PARAMETERS,
} from './config';
import {
  OpenAIChatRequest,
  OpenAIChatResponse,
  OpenAIMessage,
} from './types';

export class OpenAPIClient {
  private client: OpenAI;
  private defaultModel: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = OPENAPI_DEFAULT_BASE_URL, defaultModel: string = OPENAPI_DEFAULT_MODEL) {
    // console.log('实例化openai', apiKey, baseUrl, defaultModel)
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl
    });
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }
  

  /**
   * 发送聊天完成请求
   * @param messages 消息列表
   * @param model 模型名称
   * @param options 其他选项
   * @returns Promise<OpenAIChatResponse>
   */
  async chatCompletion(
    messages: OpenAIMessage[],
    model: string = this.defaultModel,
    options: Partial<Omit<OpenAIChatRequest, 'messages' | 'model'>> = {}
  ): Promise<OpenAIChatResponse> {
    try {
      const request: OpenAIChatRequest = {
        model,
        messages,
        response_format: {
          'type': 'json_object'
        },
        ...OPENAPI_DEFAULT_PARAMETERS,
        ...options,
      };

      console.log('请求体', request);
      const response = await this.client.chat.completions.create(request);
      console.log('返回体', response);
      return response as OpenAIChatResponse;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAPI Error: ${error.message} (Status: ${error.status})`);
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 流式聊天完成请求
   * @param messages 消息列表
   * @param model 模型名称
   * @param options 其他选项
   * @returns AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
   */
  async *streamChatCompletion(
    messages: OpenAIMessage[],
    model: string = this.defaultModel,
    options: Partial<Omit<OpenAIChatRequest, 'messages' | 'model'>> = {}
  ): AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    try {
      const request: OpenAIChatRequest = {
        model,
        messages,
        stream: true,
        ...OPENAPI_DEFAULT_PARAMETERS,
        ...options,
      };

      const response = await this.client.chat.completions.create(request);
      
      // 使用类型断言确保TypeScript知道这是一个可迭代对象
      const stream = response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      
      // 直接迭代流
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAPI Error: ${error.message} (Status: ${error.status})`);
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}