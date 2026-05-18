import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../services/types';
import * as userService from '../services/userService';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;
  register: (username: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateDailyGoal: (goal: number) => Promise<void>;
  addXp: (amount: number, source: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await userService.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string) => {
    const u = await userService.loginUser(email);
    setUser(u);
  };

  const register = async (username: string, email: string) => {
    const u = await userService.registerUser(username, email);
    setUser(u);
  };

  const logout = async () => {
    await userService.logoutUser();
    setUser(null);
  };

  const updateDailyGoal = async (goal: number) => {
    if (!user) return;
    const updated = await userService.updateDailyGoal(user.id, goal);
    setUser(updated);
  };

  const addXp = async (amount: number, source: string) => {
    if (!user) return;
    const updated = await userService.addXp(user.id, amount, source);
    setUser(updated);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, isLoggedIn: !!user, login, register, logout, refreshUser, updateDailyGoal, addXp }}>
      {children}
    </UserContext.Provider>
  );
}
