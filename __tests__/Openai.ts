import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-2cdf6abd8b384b0ca16907b58a4d0eec',
    baseURL: 'https://api.deepseek.com',
});

const response = await client.responses.create({
  model: 'gpt-4o',
  instructions: 'You are a coding assistant that talks like a pirate',
  input: 'Are semicolons optional in JavaScript?',
});

console.log(response.output_text);