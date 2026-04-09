'use client';

import { createContext, ReactNode, useContext } from 'react';
import { User } from '@/app/models/user';

interface UserContextProps {
  user: User;
  isLoading: boolean;
}

interface UserProviderProps extends UserContextProps {
  children: ReactNode;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({
  user,
  isLoading,
  children,
}: UserProviderProps) => {
  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
