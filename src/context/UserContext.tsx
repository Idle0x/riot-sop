import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { type UserProfile } from '../types';

interface UserContextType {
  user: UserProfile | null;
  session: any;
  isLoading: boolean;
  isGhostMode: boolean;
  toggleGhostMode: () => void; // ADDED
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>; // CHANGED: Returns Promise
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [isGhostMode, setIsGhostMode] = useState(false); // FIXED: Added setter
  const queryClient = useQueryClient();

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Profile (Cloud Sync)
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Transform snake_case DB to camelCase JS
      return {
        id: data.id,
        burnCap: data.burn_cap,
        annualRent: data.annual_rent,
        inflationRate: data.inflation_rate,
        lastSeen: data.last_seen,
        lastReconciliationDate: data.last_reconciliation_date,
        runwayEmptySince: data.runway_empty_since,
        systemVersion: data.system_version,
        pendingChanges: data.pending_changes,
        settings: data.settings,
        currencyCode: data.currency_code
      } as UserProfile;
    },
    enabled: !!session?.user?.id, 
  });

  // 3. Update Mutation
  const mutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!session?.user) return;

      // Convert back to snake_case for DB
      const dbUpdates: any = {};
      
      // Core Financials
      if (updates.annualRent !== undefined) dbUpdates.annual_rent = updates.annualRent;
      if (updates.burnCap !== undefined) dbUpdates.burn_cap = updates.burnCap;
      if (updates.inflationRate !== undefined) dbUpdates.inflation_rate = updates.inflationRate;
      
      // System State
      if (updates.lastReconciliationDate) dbUpdates.last_reconciliation_date = updates.lastReconciliationDate;
      if (updates.pendingChanges) dbUpdates.pending_changes = updates.pendingChanges;
      if (updates.settings) dbUpdates.settings = updates.settings;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return (
    <UserContext.Provider value={{
      user: user || null,
      session,
      isLoading,
      isGhostMode,
      toggleGhostMode: () => setIsGhostMode(prev => !prev),
      updateProfile: (u) => mutation.mutateAsync(u), // FIXED: awaitable
      logout: () => supabase.auth.signOut(),
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
