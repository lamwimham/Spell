// 测试 useQwen hook 的功能

import { renderHook, act } from '@testing-library/react-native';
import {
  useQwenChat,
  useQwenChatWithSystemPrompt,
  useQwenChatWithCustomSystemPrompt,
  useQwenChatWithDynamicSystemPrompt,
} from '../src/hooks/useQwen';
import { QwenAPI } from '../src/services/qwen/client';

// Mock QwenAPI
jest.mock('../src/services/qwen/client', () => {
  return {
    QwenAPI: jest.fn().mockImplementation(() => {
      return {
        chatCompletion: jest.fn().mockResolvedValue({
          output: {
            finish_reason: 'stop',
            text: 'Mocked response',
          },
          usage: {
            input_tokens: 10,
            output_tokens: 20,
            total_tokens: 30,
          },
          request_id: 'test-request-id',
        }),
      };
    }),
  };
});

describe('useQwenChat', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useQwenChat({ apiKey: 'test-key' }));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.lastResponse).toBeNull();
  });

  it('should send a message and update state correctly', async () => {
    const { result } = renderHook(() => useQwenChat({ apiKey: 'test-key' }));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toHaveLength(2); // User message + AI response
    expect(result.current.lastResponse).toEqual({
      role: 'assistant',
      content: 'Mocked response',
    });
  });

  it('should reset conversation correctly', async () => {
    const { result } = renderHook(() => useQwenChat({ apiKey: 'test-key' }));

    // Send a message first
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Verify messages were added
    expect(result.current.messages).toHaveLength(2);

    // Reset conversation
    act(() => {
      result.current.resetConversation();
    });

    // Verify reset
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResponse).toBeNull();
  });
});

describe('useQwenChat - Error Handling', () => {
  it('should handle API errors correctly', async () => {
    // Mock an API error
    const mockChatCompletion = jest.fn().mockRejectedValue(new Error('API Error'));

    // Reset the mock and set up the error case
    (QwenAPI as jest.Mock).mockImplementation(() => {
      return {
        chatCompletion: mockChatCompletion,
      };
    });

    const { result } = renderHook(() => useQwenChat({ apiKey: 'test-key' }));

    await act(async () => {
      try {
        await result.current.sendMessage('Hello');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
    expect(result.current.messages).toHaveLength(1); // Only user message
  });
});

describe('useQwenChatWithSystemPrompt', () => {
  it('should initialize with a system prompt', () => {
    const { result } = renderHook(() => useQwenChatWithSystemPrompt('ENGLISH_TEACHER'));

    // Check that the hook is properly initialized
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useQwenChatWithCustomSystemPrompt', () => {
  it('should initialize with a custom system prompt', () => {
    const { result } = renderHook(() =>
      useQwenChatWithCustomSystemPrompt('You are a helpful assistant'),
    );

    // Check that the hook is properly initialized
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useQwenChatWithDynamicSystemPrompt', () => {
  it('should initialize with dynamic system prompt functionality', () => {
    const { result } = renderHook(() => useQwenChatWithDynamicSystemPrompt());

    // Check that the hook is properly initialized
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentSystemPrompt).toBeUndefined();
  });

  it('should set system prompt by key', () => {
    const { result } = renderHook(() => useQwenChatWithDynamicSystemPrompt());

    act(() => {
      result.current.setSystemPromptByKey('ENGLISH_TEACHER');
    });

    expect(result.current.currentSystemPrompt).toBeDefined();
    expect(result.current.currentSystemPrompt?.role).toBe('system');
  });

  it('should set custom system prompt', () => {
    const { result } = renderHook(() => useQwenChatWithDynamicSystemPrompt());

    act(() => {
      result.current.setCustomSystemPrompt('You are a math tutor');
    });

    expect(result.current.currentSystemPrompt).toBeDefined();
    expect(result.current.currentSystemPrompt?.role).toBe('system');
    expect(result.current.currentSystemPrompt?.content).toBe('You are a math tutor');
  });

  it('should clear system prompt', () => {
    const { result } = renderHook(() => useQwenChatWithDynamicSystemPrompt());

    act(() => {
      result.current.setCustomSystemPrompt('You are a math tutor');
    });

    expect(result.current.currentSystemPrompt).toBeDefined();

    act(() => {
      result.current.clearSystemPrompt();
    });

    expect(result.current.currentSystemPrompt).toBeUndefined();
  });
});
