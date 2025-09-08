import React, { useState, useEffect, lazy, Suspense } from 'react';
// Fix: Use namespace import for react-router-dom to resolve module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from './utils/firebase';

import LoginScreen from './screens/LoginScreen';
import MainLayout from './components/layout/MainLayout';
import SplashScreen from './components/common/SplashScreen';
import { ListenerProvider } from './context/ListenerContext';
import type { ListenerProfile } from './types';

// Lazy load all screens
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const CallsScreen = lazy(() => import('./screens/CallsScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const EarningsScreen = lazy(() => import('./screens/EarningsScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ActiveCallScreen = lazy(() => import('./screens/ActiveCallScreen'));
const TermsScreen = lazy(() => import('./screens/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
const PendingApprovalScreen = lazy(() => import('./screens/PendingApprovalScreen'));
const AdminDashboardScreen = lazy(() => import('./screens/AdminDashboard'));
const ListenerManagementScreen = lazy(() => import('./screens/ListenerManagementScreen'));

type AuthStatus = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'pending_approval' | 'active' | 'admin';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const listenerRef = db.collection('listeners').doc(firebaseUser.uid);
          const doc = await listenerRef.get();
          
          if (doc.exists) {
            const data = doc.data() as ListenerProfile;

            // Admin check takes highest priority
            if (data.isAdmin === true) {
              setAuthStatus('admin');
            } else if (data.status === 'pending') {
              setAuthStatus('pending_approval');
            } else if (data.status === 'active') {
              setAuthStatus('active');
            } else {
              // Handle other statuses like 'suspended' or 'rejected' by logging them out
              console.warn(`User ${firebaseUser.uid} has an unhandled or rejected status: ${data.status}`);
              await auth.signOut();
              setAuthStatus('unauthenticated');
            }
          } else {
            // No listener document means they need to go through onboarding.
            setAuthStatus('needs_onboarding');
          }
        } catch (error) {
            console.error("Error checking listener status:", error);
            await auth.signOut();
            setAuthStatus('unauthenticated');
        }
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  if (authStatus === 'loading') {
    return <SplashScreen />;
  }

  return (
    <ReactRouterDOM.HashRouter>
      <Suspense fallback={<SplashScreen />}>
        <ReactRouterDOM.Routes>
          {authStatus === 'unauthenticated' && (
            <>
              <ReactRouterDOM.Route path="/login" element={<LoginScreen />} />
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/login" replace />} />
            </>
          )}

          {authStatus === 'needs_onboarding' && user && (
            <>
              <ReactRouterDOM.Route path="/onboarding" element={<OnboardingScreen user={user} />} />
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/onboarding" replace />} />
            </>
          )}

          {authStatus === 'pending_approval' && (
             <>
              <ReactRouterDOM.Route path="/pending-approval" element={<PendingApprovalScreen />} />
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/pending-approval" replace />} />
            </>
          )}

          {authStatus === 'admin' && (
            <>
              <ReactRouterDOM.Route path="/admin" element={<AdminDashboardScreen />} />
              <ReactRouterDOM.Route path="/admin/listeners" element={<ListenerManagementScreen />} />
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/admin" replace />} />
            </>
          )}

          {authStatus === 'active' && user && (
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
                <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
                <ReactRouterDOM.Route path="dashboard" element={<DashboardScreen />} />
                <ReactRouterDOM.Route path="calls" element={<CallsScreen />} />
                <ReactRouterDOM.Route path="chat" element={<ChatScreen />} />
                <ReactRouterDOM.Route path="earnings" element={<EarningsScreen />} />
                <ReactRouterDOM.Route path="profile" element={<ProfileScreen />} />
                <ReactRouterDOM.Route path="terms" element={<TermsScreen />} />
                <ReactRouterDOM.Route path="privacy" element={<PrivacyPolicyScreen />} />
              </ReactRouterDOM.Route>
              <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
            </>
          )}
        </ReactRouterDOM.Routes>
      </Suspense>
    </ReactRouterDOM.HashRouter>
  );
};

export default App;