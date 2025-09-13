
import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Downgraded react-router-dom from v6 to v5 syntax to match project dependencies.
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
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
          <Switch>
            <Route path="/login" component={LoginScreen} />
            <Redirect to="/login" />
          </Switch>
        );
      case 'needs_onboarding':
        return user ? (
          <Switch>
            <Route path="/onboarding">
              <OnboardingScreen user={user} />
            </Route>
            <Redirect to="/onboarding" />
          </Switch>
        ) : <SplashScreen />;
      case 'pending_approval':
        return (
          <Switch>
            <Route path="/pending-approval" component={PendingApprovalScreen} />
            <Redirect to="/pending-approval" />
          </Switch>
        );
      case 'admin':
        return (
          <Switch>
            <Route path="/admin/listeners" component={ListenerManagementScreen} />
            <Route path="/admin" component={AdminDashboardScreen} />
            <Redirect to="/admin" />
          </Switch>
        );
      case 'unauthorized':
        return (
          <Switch>
            <Route path="/unauthorized" component={UnauthorizedScreen} />
            <Redirect to="/unauthorized" />
          </Switch>
        );
      case 'active':
        return user ? (
          <Switch>
            <Route path="/call/:callId">
              <ListenerProvider user={user}>
                <ActiveCallScreen />
              </ListenerProvider>
            </Route>
            <Route path="/">
              <ListenerProvider user={user}>
                <MainLayout>
                  <Switch>
                    <Route path="/dashboard" component={DashboardScreen} />
                    <Route path="/calls" component={CallsScreen} />
                    <Route path="/chat" component={ChatScreen} />
                    <Route path="/earnings" component={EarningsScreen} />
                    <Route path="/profile" component={ProfileScreen} />
                    <Route path="/terms" component={TermsScreen} />
                    <Route path="/privacy" component={PrivacyPolicyScreen} />
                    <Redirect from="/" to="/dashboard" exact />
                    <Redirect to="/dashboard" />
                  </Switch>
                </MainLayout>
              </ListenerProvider>
            </Route>
          </Switch>
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
