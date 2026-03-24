import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { type UserProfile } from '../types';
import { guestDB } from '../lib/guestDB'; // The Interceptor DB

interface UserContextType {
  user: UserProfile | null;
  session: any;
  isLoading: boolean;
  isGhostMode: boolean;
  isGuestMode: boolean;
  toggleGhostMode: () => void;
  loginAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestProfile, setGuestProfile] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', session?.user?.id, isGuestMode],
    queryFn: async () => {
      // INTERCEPTOR: Return the mock profile if in Demo Mode
      if (isGuestMode) return guestProfile;

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
    enabled: !!session?.user?.id || isGuestMode, 
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      // INTERCEPTOR: Update local state instead of Supabase
      if (isGuestMode) {
         setGuestProfile(prev => prev ? { ...prev, ...updates } : null);
         return;
      }

      if (!session?.user) return;

      const dbUpdates: any = {};
      if (updates.annualRent !== undefined) dbUpdates.annual_rent = updates.annualRent;
      if (updates.burnCap !== undefined) dbUpdates.burn_cap = updates.burnCap;
      if (updates.inflationRate !== undefined) dbUpdates.inflation_rate = updates.inflationRate;
      if (updates.lastReconciliationDate) dbUpdates.last_reconciliation_date = updates.lastReconciliationDate;
      if (updates.pendingChanges) dbUpdates.pending_changes = updates.pendingChanges;
      if (updates.settings) dbUpdates.settings = updates.settings;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const loginAsGuest = () => {
     // 1. Reset the Ephemeral DB to a fresh state
     guestDB.initialize();
     // 2. Set the Demo Profile
     setGuestProfile({
        id: 'guest_operator_001',
        burnCap: 1500000,
        annualRent: 6000000,
        inflationRate: 28.5,
        lastSeen: new Date().toISOString(),
        lastReconciliationDate: new Date().toISOString(),
        runwayEmptySince: null,
        systemVersion: '2.0.0 (Demo)',
        pendingChanges: [],
        currencyCode: 'NGN',
        settings: { allowNegativeBalance: false, monthlyCheckpointDay: 1, masterKey: '123456' }
     });
     // 3. Flip the switch (The entire app will now reroute to local memory)
     setIsGuestMode(true);
     queryClient.invalidateQueries(); 
  };

  const logout = async () => {
     if (isGuestMode) {
        setIsGuestMode(false);
        setGuestProfile(null);
        queryClient.clear(); // Purge all cached demo data
     } else {
        await supabase.auth.signOut();
     }
  };

  return (
    <UserContext.Provider value={{
      user: user || null,
      session,
      isLoading,
      isGhostMode,
      isGuestMode,
      toggleGhostMode: () => setIsGhostMode(prev => !prev),
      loginAsGuest,
      updateProfile: (u) => mutation.mutateAsync(u),
      logout,
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
