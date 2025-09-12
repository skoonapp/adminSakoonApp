import React from 'react';
// FIX: Downgraded react-router-dom hooks to v5 syntax (`useNavigate` -> `useHistory`, `Outlet` removed).
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Header />
      <main 
        className="flex-grow pt-16 pb-16 overflow-y-auto"
      >
        <div className="bg-slate-50 dark:bg-slate-950 h-full w-full">
            {children}
        </div>
      </main>
      <BottomNav />
      <IncomingCallManager />
    </div>
  );
};

export default MainLayout;