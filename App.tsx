import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Use named imports for react-router-dom to fix module resolution errors.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth } from './utils/firebase';

import LoginScreen from './screens/LoginScreen';
import MainLayout from './context/components/layout/MainLayout';
import SplashScreen from './context/components/common/SplashScreen';
import { ListenerProvider } from './context/ListenerContext';

const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const CallsScreen = lazy(() => import('./screens/CallsScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const EarningsScreen = lazy(() => import('./screens/EarningsScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ActiveCallScreen = lazy(() => import('./screens/ActiveCallScreen'));
const TermsScreen = lazy(() => import('./screens/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <HashRouter>
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          {user ? (
            // Authenticated Routes
            <>
              <Route path="/call/:callId" element={
                <ListenerProvider user={user}>
                  <ActiveCallScreen />
                </ListenerProvider>
              } />
              <Route path="/" element={
                <ListenerProvider user={user}>
                  <MainLayout />
                </ListenerProvider>
              }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="calls" element={<CallsScreen />} />
                <Route path="chat" element={<ChatScreen />} />
                <Route path="earnings" element={<EarningsScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
                <Route path="terms" element={<TermsScreen />} />
                <Route path="privacy" element={<PrivacyPolicyScreen />} />
              </Route>
              {/* Catch-all for authenticated users */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            // Unauthenticated Routes
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;
