

import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Downgraded react-router-dom from v6 to v5 syntax.
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from './utils/firebase';

import LoginScreen from './screens/auth/LoginScreen';
import MainLayout from './components/layout/MainLayout';
import SplashScreen from './components/common/SplashScreen';
import { ListenerProvider } from './context/ListenerContext';
import type { ListenerProfile } from './types';

// Lazy load all screens
const DashboardScreen = lazy(() => import('./screens/listener/DashboardScreen'));
const CallsScreen = lazy(() => import('./screens/listener/CallsScreen'));
const ChatScreen = lazy(() => import('./screens/listener/ChatScreen'));
const EarningsScreen = lazy(() => import('./screens/listener/EarningsScreen'));
const ProfileScreen = lazy(() => import('./screens/listener/ProfileScreen'));
const ActiveCallScreen = lazy(() => import('./screens/listener/ActiveCallScreen'));
const TermsScreen = lazy(() => import('./screens/listener/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/listener/PrivacyPolicyScreen'));
const OnboardingScreen = lazy(() => import('./screens/auth/OnboardingScreen'));
const PendingApprovalScreen = lazy(() => import('./screens/auth/PendingApprovalScreen'));
const AdminDashboardScreen = lazy(() => import('./screens/admin/AdminDashboardScreen'));
const ListenerManagementScreen = lazy(() => import('./screens/admin/ListenerManagementScreen'));
const UnauthorizedScreen = lazy(() => import('./screens/auth/UnauthorizedScreen'));

type AuthStatus = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'pending_approval' | 'active' | 'admin' | 'unauthorized';

const GuardedPage: React.FC<{user: firebase.User, children: React.ReactNode}> = ({ user, children }) => (
    <ListenerProvider user={user}>
        <MainLayout>
            {children}
        </MainLayout>
    </ListenerProvider>
);

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
  
  // This handles the cases where auth state is determined but the user object might be null temporarily.
  if ((authStatus === 'active' || authStatus === 'needs_onboarding') && !user) {
      return <SplashScreen />;
  }

  return (
    <HashRouter>
      <Suspense fallback={<SplashScreen />}>
        <Switch>
            {authStatus === 'unauthenticated' && <>
                <Route path="/login"><LoginScreen /></Route>
                <Route path="*"><Redirect to="/login" /></Route>
            </>}
            {authStatus === 'needs_onboarding' && user && <>
                <Route path="/onboarding"><OnboardingScreen user={user} /></Route>
                <Route path="*"><Redirect to="/onboarding" /></Route>
            </>}
            {authStatus === 'pending_approval' && <>
                <Route path="/pending-approval"><PendingApprovalScreen /></Route>
                <Route path="*"><Redirect to="/pending-approval" /></Route>
            </>}
            {authStatus === 'admin' && <>
                <Route path="/admin/listeners"><ListenerManagementScreen /></Route>
                <Route path="/admin"><AdminDashboardScreen /></Route>
                <Route path="*"><Redirect to="/admin" /></Route>
            </>}
            {authStatus === 'unauthorized' && <>
                <Route path="/unauthorized"><UnauthorizedScreen /></Route>
                <Route path="*"><Redirect to="/unauthorized" /></Route>
            </>}
            {authStatus === 'active' && user && (
                <>
                    <Route path="/call/:callId"><ListenerProvider user={user}><ActiveCallScreen /></ListenerProvider></Route>
                    <Route path="/dashboard"><GuardedPage user={user}><DashboardScreen /></GuardedPage></Route>
                    <Route path="/calls"><GuardedPage user={user}><CallsScreen /></GuardedPage></Route>
                    <Route path="/chat"><GuardedPage user={user}><ChatScreen /></GuardedPage></Route>
                    <Route path="/earnings"><GuardedPage user={user}><EarningsScreen /></GuardedPage></Route>
                    <Route path="/profile"><GuardedPage user={user}><ProfileScreen /></GuardedPage></Route>
                    <Route path="/terms"><GuardedPage user={user}><TermsScreen /></GuardedPage></Route>
                    <Route path="/privacy"><GuardedPage user={user}><PrivacyPolicyScreen /></GuardedPage></Route>
                    <Route exact path="/"><Redirect to="/dashboard" /></Route>
                    <Route path="*"><Redirect to="/dashboard" /></Route>
                </>
            )}
             {/* Fallback for unhandled statuses or when conditions are not met */}
             <Route path="*"><SplashScreen /></Route>
        </Switch>
      </Suspense>
    </HashRouter>
  );
};

export default App;