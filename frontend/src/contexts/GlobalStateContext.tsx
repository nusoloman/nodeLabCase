import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  // add more fields as needed
}

interface GlobalStateContextType {
  onlineUsers: User[];
  setOnlineUsers: (users: User[]) => void;
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined
);

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  return (
    <GlobalStateContext.Provider
      value={{
        onlineUsers,
        setOnlineUsers,
        activeConversation,
        setActiveConversation,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const ctx = useContext(GlobalStateContext);
  if (!ctx)
    throw new Error('useGlobalState must be used within GlobalStateProvider');
  return ctx;
};
