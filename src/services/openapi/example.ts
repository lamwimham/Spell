// OpenAPI 使用示例

import { OpenAPIClient } from './client';
import { OpenAIMessage } from './types';

// 初始化客户端
// 注意：在实际应用中，您需要从安全的地方获取 API 密钥
const API_KEY = 'your-api-key'; // 请替换为您的实际 API 密钥

const client = new OpenAPIClient(
  API_KEY,
  'https://api.openai.com/v1', // 可选，替换为您的基础 URL
  'gpt-3.5-turbo', // 可选，替换为您的默认模型
);

// 示例：发送聊天完成请求
export async function chatCompletionExample() {
  try {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: '你好，世界！' },
    ];

    const response = await client.chatCompletion(messages, 'gpt-3.5-turbo', {
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log('Response:', response);
    console.log('Answer:', response.choices[0]?.message?.content || 'No response');
    return response.choices[0]?.message?.content || 'No response';
  } catch (error) {
    console.error('Error:', error);
    return 'Error occurred';
  }
}

// 示例：流式聊天完成请求
export async function streamChatCompletionExample() {
  try {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: '写一首关于春天的诗。' },
    ];

    console.log('Streaming response:');
    const stream = client.streamChatCompletion(messages, 'gpt-3.5-turbo', {
      temperature: 0.8,
      max_tokens: 200,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        console.log(content);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
