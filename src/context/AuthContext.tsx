import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { AppUser, AuthContextValue } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

// Map Supabase error messages → Mongolian
function toMnError(msg: string = ''): string {
  if (msg.includes('Invalid login credentials'))  return 'И-мэйл эсвэл нууц үг буруу байна';
  if (msg.includes('already registered'))          return 'Энэ и-мэйл аль хэдийн бүртгэлтэй байна';
  if (msg.includes('at least 6'))                  return 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой';
  if (msg.includes('valid email'))                 return 'Зөв и-мэйл хаяг оруулна уу';
  if (msg.includes('Email not confirmed'))         return 'И-мэйлээ баталгаажуулна уу';
  return msg;
}

// Keep a flat {id, name, email} shape so existing screens don't need changes
function toProfile(supaUser: any): AppUser | null {
  if (!supaUser) return null;
  return {
    id:    supaUser.id,
    name:  supaUser.user_metadata?.name ?? supaUser.email ?? 'Хэрэглэгч',
    email: supaUser.email ?? '',
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(toProfile(session?.user ?? null));
      setLoading(false);
    });

    // Stay in sync with Supabase auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(toProfile(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(toMnError(error.message));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email:    email.trim(),
      password,
      options:  { data: { name: name.trim() } },
    });
    if (error) throw new Error(toMnError(error.message));
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
