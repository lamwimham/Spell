import React, { createContext, useContext } from 'react';
import { DatabaseContext } from '@nozbe/watermelondb/react';
import { database } from './database';

const DatabaseProviderContext = createContext();

export const DatabaseProvider = ({ children }) => {
  return (
    <DatabaseProviderContext.Provider value={database}>
      <DatabaseContext.Provider value={database}>
        {children}
      </DatabaseContext.Provider>
    </DatabaseProviderContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseProviderContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};