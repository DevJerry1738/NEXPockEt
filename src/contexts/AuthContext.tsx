import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  avatar_url?: string;
  balance?: number;
  kyc_status?: string;
  referral_code?: string;
  withdrawal_enabled?: boolean;
  status?: string;
  total_earned?: number;
  total_withdrawn?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, login: async () => {}, register: async () => {},
  logout: () => {}, refreshUser: async () => {}, isAdmin: false,
});

// Helper to wrap promises with a timeout
// In .tsx files, use <T,> to avoid ambiguity with JSX tags
async function withTimeout<T>(promise: Promise<T> | any, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

const fetchProfile = async (userId: string): Promise<User | null> => {
  try {
    // Wrap Supabase query in Promise.resolve() to ensure it's a standard Promise
    const response = await withTimeout<any>(
      Promise.resolve(supabase.from('profiles').select('*').eq('id', userId).single()),
      15000,
      'Profile fetch timed out'
    );
    
    if (response.error) return null;
    return response.data as User;
  } catch (err) {
    return null;
  }
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session: any) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
      // Always clear loading after processing a session change
      if (mounted) {
        isInitialized.current = true;
        setLoading(false);
      }
    };

    // Step 1: Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isInitialized.current) handleSession(session);
    });

    // Step 2: Listener for login/logout/token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Safety timeout
    const timer = setTimeout(() => {
      if (mounted && !isInitialized.current) {
        isInitialized.current = true;
        setLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []); 

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }
    // Note: loading will be set to false by the onAuthStateChange listener
    // which fires after successful login
  };

  const register = async (formData: any) => {
    setLoading(true);
    
    // Resolve referral code to referrer ID if provided
    let referred_by_id = null;
    if (formData.referral_code) {
      // Use RPC function instead of direct query - bypasses RLS since function is SECURITY DEFINER
      const { data: referrerId, error: refError } = await supabase
        .rpc('validate_referral_code', {
          p_referral_code: formData.referral_code.toUpperCase()
        });
      
      if (refError) {
        setLoading(false);
        throw new Error(`Failed to validate referral code: ${refError.message}`);
      }
      
      if (!referrerId) {
        setLoading(false);
        throw new Error(`Referral code "${formData.referral_code}" not found`);
      }
      
      referred_by_id = referrerId;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { 
        data: { 
          name: formData.name,
          referred_by: referred_by_id
        },
      },
    });
    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }
    if (!data.session) {
      setLoading(false);
      throw new Error('Check email to confirm registration.');
    }
  };

  const logout = async () => {
    setUser(null);
    // Sign out from Supabase — onAuthStateChange will fire with session=null,
    // which sets user to null and lets React Router's guards redirect to /login.
    // Do NOT use window.location.href here: it resolves against the current
    // hostname and would redirect to the production URL in a hosted environment.
    await supabase.auth.signOut().catch(console.error);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
