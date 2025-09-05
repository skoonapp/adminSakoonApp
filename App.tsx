import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Use namespace import for react-router-dom to fix module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
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
    <ReactRouterDOM.HashRouter>
      <Suspense fallback={<SplashScreen />}>
        <ReactRouterDOM.Routes>
          {user ? (
            // Authenticated Routes
            <>
              <ReactRouterDOM.Route path="/call/:callId" element={
                <ListenerProvider user={user}>
                  <ActiveCallScreen />
                </ListenerProvider>
              } />
              <ReactRouterDOM.Route path="/" element={
                <ListenerProvider user={user}>
                  <MainLayout />
                </ListenerProvider>
              }>
                <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="/dashboard" />} />
                <ReactRouterDOM.Route path="dashboard" element={<DashboardScreen />} />
                <ReactRouterDOM.Route path="calls" element={<CallsScreen />} />
                <ReactRouterDOM.Route path="chat" element={<ChatScreen />} />
                <ReactRouterDOM.Route path="earnings" element={<EarningsScreen />} />
                <ReactRouterDOM.Route path="profile" element={<ProfileScreen />} />
                <ReactRouterDOM.Route path="terms" element={<TermsScreen />} />
                <ReactRouterDOM.Route path="privacy" element={<PrivacyPolicyScreen />} />
              </ReactRouterDOM.Route>
              {/* Catch-all for authenticated users */}
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/dashboard" />} />
            </>
          ) : (
            // Unauthenticated Routes
            <>
              <ReactRouterDOM.Route path="/login" element={<LoginScreen />} />
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/login" />} />
            </>
          )}
        </ReactRouterDOM.Routes>
      </Suspense>
    </ReactRouterDOM.HashRouter>
  );
};

export default App;