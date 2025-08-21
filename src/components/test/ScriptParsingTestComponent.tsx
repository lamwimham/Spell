// ScriptParsingTestComponent.tsx - 用于测试脚本解析逻辑的组件

import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { testScriptParsing, runTests } from '../../utils/testScriptParsing';

const ScriptParsingTestComponent = () => {
  const [testResult, setTestResult] = useState<string>('');

  const runTest = () => {
    runTests();
    setTestResult('Tests completed. Check console for results.');
    Alert.alert('测试完成', '请查看控制台输出');
  };

  const testSpecificCase = () => {
    const testJson = `{
      "input": "我希望戒烟",
      "output":["我从来不抽烟，因为烟很臭","我从来不抽烟，因为我讨厌被剥削的感觉", "我是一个健康的人，因为我珍惜生命"]
    }`;
    
    const result = testScriptParsing(testJson);
    setTestResult(JSON.stringify(result, null, 2));
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>脚本解析测试</Text>
      
      <Button title="运行所有测试" onPress={runTest} />
      
      <View style={{ height: 20 }} />
      
      <Button title="测试特定JSON格式" onPress={testSpecificCase} />
      
      <View style={{ height: 20 }} />
      
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>测试结果:</Text>
      <Text style={{ fontSize: 12, marginTop: 10 }}>{testResult}</Text>
    </View>
  );
};

export default ScriptParsingTestComponent;