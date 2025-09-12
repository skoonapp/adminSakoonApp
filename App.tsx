import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Upgraded react-router-dom from v5 to v6 syntax.
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
          // --- Priority 1: Check for secure custom admin claim on the token ---
          const idTokenResult = await firebaseUser.getIdTokenResult();
          if (idTokenResult.claims.admin === true) {
            setAuthStatus('admin');
            return; // Exit early, this is the highest level of authorization.
          }

          // --- Priority 2: Fallback to checking the Firestore document ---
          const listenerRef = db.collection('listeners').doc(firebaseUser.uid);
          const doc = await listenerRef.get();
          
          if (doc.exists) {
            const data = doc.data() as ListenerProfile;

            // This check remains as a fallback or for admins set via Firestore.
            if (data.isAdmin === true) {
              setAuthStatus('admin');
              return;
            }

            // If the user is not an admin, proceed with standard listener status checks.
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
                // Any other status (e.g., 'suspended', 'rejected') leads to unauthorized access.
                console.warn(`User ${firebaseUser.uid} has an unhandled or rejected status: ${data.status}`);
                setAuthStatus('unauthorized');
            }
          } else {
            // If an auth user exists but has no listener doc, they are unauthorized.
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

  const renderRoutes = () => {
    switch (authStatus) {
      case 'unauthenticated':
        return (
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        );
      case 'needs_onboarding':
        return user ? (
          <Routes>
            <Route path="/onboarding" element={<OnboardingScreen user={user} />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        ) : <SplashScreen />;
      case 'pending_approval':
        return (
          <Routes>
            <Route path="/pending-approval" element={<PendingApprovalScreen />} />
            <Route path="*" element={<Navigate to="/pending-approval" replace />} />
          </Routes>
        );
      case 'admin':
        return (
          <Routes>
            <Route path="/admin/listeners" element={<ListenerManagementScreen />} />
            <Route path="/admin" element={<AdminDashboardScreen />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        );
      case 'unauthorized':
        return (
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedScreen />} />
            <Route path="*" element={<Navigate to="/unauthorized" replace />} />
          </Routes>
        );
      case 'active':
        return user ? (
          <Routes>
            <Route path="/call/:callId" element={
              <ListenerProvider user={user}>
                <ActiveCallScreen />
              </ListenerProvider>
            } />
            <Route path="/*" element={
              <ListenerProvider user={user}>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/calls" element={<CallsScreen />} />
                    <Route path="/chat" element={<ChatScreen />} />
                    <Route path="/earnings" element={<EarningsScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/terms" element={<TermsScreen />} />
                    <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ListenerProvider>
            } />
          </Routes>
        ) : <SplashScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <HashRouter>
      <Suspense fallback={<SplashScreen />}>
        {renderRoutes()}
      </Suspense>
    </HashRouter>
  );
};

export default App;
