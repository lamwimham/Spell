/**
 * SpellApp - React Native iOS应用
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { DatabaseProvider } from './src/database/DatabaseProvider';

const App = () => {
  return (
    <Provider store={store}>
      <DatabaseProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </DatabaseProvider>
    </Provider>
  );
};

export default App;
