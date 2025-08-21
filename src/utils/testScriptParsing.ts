// 测试脚本解析功能

interface ParseResult {
  scripts: string[];
  success: boolean;
  error?: string;
}

/**
 * 测试AI响应解析函数
 * @param responseText AI返回的文本
 * @returns 解析结果
 */
export function testScriptParsing(responseText: string): ParseResult {
  let scripts: string[] = [];

  try {
    // 尝试解析JSON格式的响应
    const trimmedResponse = responseText.trim();

    // 检查是否为JSON格式
    if (
      (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) ||
      (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']'))
    ) {
      const jsonResponse = JSON.parse(trimmedResponse);

      // 处理您提供的格式: { "input": "...", "output": [...] }
      if (jsonResponse.output && Array.isArray(jsonResponse.output)) {
        scripts = jsonResponse.output.filter(
          (item: any) => typeof item === 'string' && item.trim() !== '',
        );
      }
      // 处理数组格式
      else if (Array.isArray(jsonResponse)) {
        scripts = jsonResponse.filter(
          (item: any) => typeof item === 'string' && item.trim() !== '',
        );
      }
      // 处理其他对象格式
      else if (typeof jsonResponse === 'object' && jsonResponse.content) {
        scripts = [jsonResponse.content];
      }
    }
  } catch (jsonError) {
    // JSON解析失败
    return {
      scripts: [],
      success: false,
      error: `JSON parsing failed: ${
        jsonError instanceof Error ? jsonError.message : 'Unknown error'
      }`,
    };
  }

  // 如果JSON解析没有得到结果，使用备用方法
  if (scripts.length === 0) {
    // 尝试按行分割
    const lines = responseText.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 1) {
      scripts = lines;
    } else {
      // 尝试按句号分割
      const sentences = responseText.split(/(?<=[.。!！?？])\s+/).filter(s => s.trim() !== '');
      if (sentences.length > 1) {
        scripts = sentences.slice(0, Math.min(10, sentences.length)); // 最多取10个选项
      } else {
        // 最后回退到完整响应
        scripts = [responseText];
      }
    }
  }

  // 过滤掉空的脚本
  scripts = scripts.filter(script => script.trim() !== '');

  return {
    scripts: scripts.map(script => script.trim()),
    success: true,
  };
}

// 测试用例
export function runTests() {
  console.log('Running script parsing tests...');

  // 测试用例1: 您提供的格式
  const test1 = `{
    "input": "我希望戒烟",
    "output":["我从来不抽烟，因为烟很臭","我从来不抽烟，因为我讨厌被剥削的感觉"]
  }`;

  const result1 = testScriptParsing(test1);
  console.log('Test 1 - JSON format:', result1);

  // 测试用例2: 纯文本格式
  const test2 = `这是第一个选项
这是第二个选项
这是第三个选项`;

  const result2 = testScriptParsing(test2);
  console.log('Test 2 - Text format:', result2);

  // 测试用例3: 单个选项
  const test3 = '这是一个单独的选项';

  const result3 = testScriptParsing(test3);
  console.log('Test 3 - Single option:', result3);

  // 测试用例4: 无效的JSON
  const test4 = '{ invalid json }';

  const result4 = testScriptParsing(test4);
  console.log('Test 4 - Invalid JSON:', result4);
}
