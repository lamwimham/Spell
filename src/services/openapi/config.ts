// OpenAPI 客户端配置

// 默认基础 URL
// 注意：在 React Native 中，环境变量需要通过其他方式注入
// 例如通过原生代码或配置文件
export const OPENAPI_DEFAULT_BASE_URL = 'https://api.deepseek.com';

export const OPENAPI_API_KEY='sk-2cdf6abd8b384b0ca16907b58a4d0eec'

// 聊天完成端点
export const OPENAPI_CHAT_COMPLETION_ENDPOINT = '/chat/completions';

// 默认模型
export const OPENAPI_DEFAULT_MODEL = 'deepseek-chat';

// 默认参数
export const OPENAPI_DEFAULT_PARAMETERS = {
  temperature: 0.7,
  top_p: 1,
  max_tokens: 1000,
  frequency_penalty: 0,
  presence_penalty: 0,
};