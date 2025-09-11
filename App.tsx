import React, { useState, useEffect, lazy, Suspense } from 'react';
// Fix: Corrected import for react-router-dom components.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
const UnauthorizedScreen = lazy(() => import('./screens/UnauthorizedScreen'));

type AuthStatus = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'pending_approval' | 'active' | 'admin' | 'unauthorized';

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

            // Admin check is the absolute priority. If user is an admin,
            // grant access regardless of their listener status (e.g., active, suspended).
            if (data.isAdmin === true) {
              setAuthStatus('admin');
              return; // Exit early after setting admin status.
            }

            // If the user is not an admin, proceed with the standard listener status checks.
            switch (data.status) {
              case 'onboarding_required':
                setAuthStatus('needs_onboarding');
                break;
              case 'pending':
                setAuthStatus('pending_approval');
                break;
              case 'active':
                setAuthStatus('active');
                break;
              default:
                // Any other status (e.g., 'suspended', 'rejected', or invalid) leads to unauthorized access for non-admins.
                console.warn(`User ${firebaseUser.uid} has an unhandled or rejected status: ${data.status}`);
                setAuthStatus('unauthorized');
            }
          } else {
            // If an auth user exists but has no listener doc, they are unauthorized for this app.
            console.warn(`No listener document found for authenticated user ${firebaseUser.uid}.`);
            setAuthStatus('unauthorized');
          }
        } catch (error) {
            console.error("Error checking listener status:", error);
            setAuthStatus('unauthorized');
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
    <HashRouter>
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          {authStatus === 'unauthenticated' && (
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {authStatus === 'needs_onboarding' && user && (
            <>
              <Route path="/onboarding" element={<OnboardingScreen user={user} />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </>
          )}

          {authStatus === 'pending_approval' && (
             <>
              <Route path="/pending-approval" element={<PendingApprovalScreen />} />
              <Route path="*" element={<Navigate to="/pending-approval" replace />} />
            </>
          )}

          {authStatus === 'admin' && (
            <>
              <Route path="/admin" element={<AdminDashboardScreen />} />
              <Route path="/admin/listeners" element={<ListenerManagementScreen />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          )}
          
          {authStatus === 'unauthorized' && (
             <>
              <Route path="/unauthorized" element={<UnauthorizedScreen />} />
              <Route path="*" element={<Navigate to="/unauthorized" replace />} />
            </>
          )}

          {authStatus === 'active' && user && (
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
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="calls" element={<CallsScreen />} />
                <Route path="chat" element={<ChatScreen />} />
                <Route path="earnings" element={<EarningsScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
                <Route path="terms" element={<TermsScreen />} />
                <Route path="privacy" element={<PrivacyPolicyScreen />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;