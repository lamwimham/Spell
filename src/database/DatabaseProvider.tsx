import React, { createContext, useContext, ReactNode } from 'react';
// import { withDatabase } from '@nozbe/watermelondb/react';
import database from './index';
import { Database } from '@nozbe/watermelondb';

interface DatabaseProviderProps {
  children: ReactNode;
}

const DatabaseProviderContext = createContext<Database | undefined>(undefined);

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  return (
    <DatabaseProviderContext.Provider value={database}>{children}</DatabaseProviderContext.Provider>
  );
};

export const useDatabase = (): Database => {
  const context = useContext(DatabaseProviderContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};
