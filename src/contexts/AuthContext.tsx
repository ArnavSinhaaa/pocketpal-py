/**
 * ========================================
 * AUTH CONTEXT - User Authentication Management
 * ========================================
 * 
 * This context provides authentication state and methods throughout the app.
 * It wraps Supabase Auth and makes it easy to use in any component.
 * 
 * USAGE IN COMPONENTS:
 * const { user, signIn, signOut } = useAuth();
 * 
 * CODING TIP: Always use contexts for global state that many components need.
 * Don't prop-drill auth state through multiple levels!
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * TypeScript interface for Auth Context
 * 
 * CODING TIP: Always define types for your contexts. This gives you autocomplete
 * and catches errors at compile time instead of runtime!
 */
interface AuthContextType {
  user: User | null;           // Current user object (null if not logged in)
  session: Session | null;     // Current session with access token
  loading: boolean;            // True while checking auth state
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

/**
 * Create the context with undefined default
 * This forces us to use the context only within AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use auth context
 * 
 * @throws Error if used outside AuthProvider
 * @returns Auth context value
 * 
 * CODING TIP: Always create a custom hook for your contexts. It makes usage
 * cleaner and provides better error messages if used incorrectly.
 * 
 * @example
 * const { user, signIn } = useAuth(); // ✅ Correct
 * const auth = useContext(AuthContext); // ❌ Don't do this
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * 
 * Wraps your app (or part of it) to provide authentication context.
 * Handles:
 * - Initial auth state loading
 * - Real-time auth state changes
 * - Sign in/up/out methods
 * 
 * @param children - Child components that can use auth context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effect: Set up auth state listener and fetch initial session
   * 
   * CODING TIP: Order matters! Set up the listener BEFORE fetching the session
   * to avoid race conditions.
   */
  useEffect(() => {
    // 1. Set up auth state listener FIRST
    // This watches for any auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event); // Useful for debugging
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 2. THEN check for existing session
    // This handles page refreshes where user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: Unsubscribe when component unmounts
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array = run once on mount

  /**
   * Sign in with email and password
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Object with error (if any)
   * 
   * CODING TIP: Always return errors to the caller so they can display
   * appropriate messages to the user.
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Sign up new user with email and password
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Object with error (if any)
   * 
   * IMPORTANT: This includes email redirect URL handling for localhost development
   * 
   * CODING TIP: Handle localhost specially! In production, email confirmation links
   * should point to your production URL, not localhost.
   */
  const signUp = async (email: string, password: string) => {
    const origin = window.location.origin;
    
    // Production URL for email confirmations
    // EDIT THIS if you deploy to a different URL
    const PRODUCTION_URL = 'https://b7170cfe-6155-4b48-b9cc-caf5825ff9c3.lovableproject.com';
    
    // Check if we're running locally
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    
    // Use production URL for email links even when testing locally
    const redirectUrl = `${isLocal ? PRODUCTION_URL : origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl // Where user goes after clicking email link
      }
    });
    return { error };
  };

  /**
   * Sign out current user
   * 
   * CODING TIP: Auth state will update automatically via the onAuthStateChange
   * listener, so you don't need to manually clear user/session here.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Context value object
   * All these values/functions will be available via useAuth()
   */
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};