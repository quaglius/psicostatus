import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  auth,
  onIdTokenChanged,
  signOut,
  type User,
} from '@/lib/firebase/client';
import { apiFetch } from '@/lib/api';
import type { MeResponse } from '@shared/types';

interface AuthState {
  firebaseUser: User | null;
  me: MeResponse | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  const refreshMe = async () => {
    if (!auth?.currentUser) {
      setMe(null);
      return;
    }
    try {
      const data = await apiFetch<MeResponse>('me');
      setMe(data);
    } catch {
      try {
        const bootstrapped = await apiFetch<MeResponse>('me/bootstrap', {
          method: 'POST',
          body: JSON.stringify({ displayName: auth.currentUser.displayName ?? undefined }),
        });
        setMe(bootstrapped);
      } catch {
        setMe(null);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await refreshMe();
      } else {
        setMe(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    if (auth) await signOut(auth);
    setMe(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, me, loading, refreshMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
