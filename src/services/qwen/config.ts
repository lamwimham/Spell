// 通义千问 API 配置

export const QWEN_API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
export const QWEN_CHAT_COMPLETION_ENDPOINT = '/services/aigc/text-generation/generation';

// 默认模型
export const DEFAULT_MODEL = 'qwen-max';

// 默认参数
export const DEFAULT_PARAMETERS = {
  temperature: 0.8,
  top_p: 0.8,
  max_tokens: 1500,
  enable_search: false,
};
