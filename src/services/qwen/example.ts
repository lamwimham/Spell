// // 通义千问 API 使用示例

// import { QwenAPI } from './client';
// import { useQwenChat } from './qwen';

// // 示例1: 在组件中使用 useQwenChat hook
// export const QwenChatExample = () => {
//   // 从环境变量或安全存储中获取 API Key
//   const API_KEY = process.env.QWEN_API_KEY || '';

//   const {
//     loading,
//     error,
//     messages,
//     sendMessage,
//     resetConversation
//   } = useQwenChat({
//     apiKey: API_KEY,
//     model: 'qwen-max',
//     parameters: {
//       temperature: 0.8,
//       max_tokens: 1500,
//     }
//   });

//   const handleSend = async (message: string) => {
//     try {
//       const response = await sendMessage(message);
//       console.log('API Response:', response);
//     } catch (err) {
//       console.error('Error sending message:', err);
//     }
//   };

//   return {
//     loading,
//     error,
//     messages,
//     handleSend,
//     resetConversation
//   };
// };

// // 示例2: 直接使用 QwenAPI 客户端

// const qwenAPI = new QwenAPI(process.env.QWEN_API_KEY || '');

// const chatCompletionExample = async () => {
//   try {
//     const response = await qwenAPI.chatCompletion({
//       model: 'qwen-max',
//       input: {
//         messages: [
//           { role: 'user', content: '你好，通义千问！' }
//         ]
//       },
//       parameters: {
//         temperature: 0.8,
//         max_tokens: 1500,
//       }
//     });

//     console.log('Chat Response:', response.output.text);
//     return response.output.text;
//   } catch (error) {
//     console.error('Chat Completion Error:', error);
//     throw error;
//   }
// };
