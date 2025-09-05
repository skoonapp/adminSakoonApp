import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { db } from './../utils/firebase';
import { ListenerProfile } from './../types';
import firebase from 'firebase/compat/app';

interface ListenerContextType {
  profile: ListenerProfile | null;
  loading: boolean;
}

const ListenerContext = createContext<ListenerContextType | undefined>(undefined);

interface ListenerProviderProps {
  children: ReactNode;
  user: firebase.User;
}

export const ListenerProvider: React.FC<ListenerProviderProps> = ({ children, user }) => {
  const [profile, setProfile] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setProfile(null);
        return;
    };

    const listenerRef = db.collection('listeners').doc(user.uid);
    const unsubscribe = listenerRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        setProfile(docSnap.data() as ListenerProfile);
      } else {
        // Handle case where listener profile doesn't exist yet
        // Maybe redirect to a profile setup screen
        console.warn(`Listener profile not found for UID: ${user.uid}`);
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching listener profile:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};

export const useListener = (): ListenerContextType => {
  const context = useContext(ListenerContext);
  if (context === undefined) {
    throw new Error('useListener must be used within a ListenerProvider');
  }
  return context;
};
