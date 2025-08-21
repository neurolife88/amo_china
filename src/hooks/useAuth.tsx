
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  emailVerified: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      setProfileError(null);
      
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, email, full_name, role, clinic_name, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && profileData) {
        setProfile(profileData);
        setProfileError(null);
      } else {
        // Retry once on failure
        if (retryCount < 1) {
          setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
          return;
        }
        setProfileError(error?.message || 'Failed to load profile');
        setProfile(null);
      }
    } catch (err) {
      setProfileError('Network error while loading profile');
      setProfile(null);
    }
  }, []);

  const resendVerificationEmail = async () => {
    if (!user?.email) return;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) throw error;
  };

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  const clearError = useCallback(() => {
    setProfileError(null);
  }, []);

  useEffect(() => {
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setEmailVerified(session?.user?.email_confirmed_at ? true : false);
        
        if (session?.user) {
          if (session.user.email_confirmed_at) {
            setTimeout(() => fetchProfile(session.user.id), 0);
          } else {
            setProfile(null);
            setProfileError(null);
          }
        } else {
          setProfile(null);
          setProfileError(null);
          setEmailVerified(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      profileError, 
      emailVerified, 
      signIn, 
      signOut, 
      refetchProfile, 
      resendVerificationEmail,
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
