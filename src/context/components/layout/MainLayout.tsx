import React from 'react';
// FIX: Changed react-router-dom import to a namespace import to resolve module export errors for Outlet.
import * as ReactRouterDom from 'react-router-dom';
const { Outlet } = ReactRouterDom;
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="flex-grow pt-16 pb-16 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
      {/* 
        The IncomingCallManager will listen for calls globally 
        and display an overlay when a call is received.
      */}
      <IncomingCallManager />
    </div>
  );
};

export default MainLayout;