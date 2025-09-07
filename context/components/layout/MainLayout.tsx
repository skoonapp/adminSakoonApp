import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';
import InstallPWAButton from '../common/InstallPWAButton';

// --- Icon Components (for previews) ---
const IconDashboard: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const IconCalls: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const IconChat: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const IconEarnings: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);
const IconProfile: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const navItems = [
  { path: '/dashboard', icon: (active: boolean) => <IconDashboard active={active} /> },
  { path: '/calls', icon: (active: boolean) => <IconCalls active={active} /> },
  { path: '/chat', icon: (active: boolean) => <IconChat active={active} /> },
  { path: '/earnings', icon: (active: boolean) => <IconEarnings active={active} /> },
  { path: '/profile', icon: (active: boolean) => <IconProfile active={active} /> },
];

const NAV_ORDER = navItems.map(item => item.path);
const SWIPE_THRESHOLD = 75;
const DIRECTION_LOCK_THRESHOLD = 10;

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [touchState, setTouchState] = useState<{
    startX: number;
    startY: number;
    isSwiping: boolean;
    translateX: number;
    direction: 'horizontal' | 'vertical' | null;
  }>({
    startX: 0,
    startY: 0,
    isSwiping: false,
    translateX: 0,
    direction: null,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }

    setTouchState({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isSwiping: true,
      translateX: 0,
      direction: null,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchState.startX;
    const deltaY = currentY - touchState.startY;

    let currentDirection = touchState.direction;

    if (!currentDirection && (Math.abs(deltaX) > DIRECTION_LOCK_THRESHOLD || Math.abs(deltaY) > DIRECTION_LOCK_THRESHOLD)) {
      currentDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
    
    if (currentDirection === 'horizontal') {
      if (e.cancelable) e.preventDefault();
      setTouchState(prev => ({ ...prev, translateX: deltaX, direction: 'horizontal' }));
    } else {
      setTouchState(prev => ({ ...prev, direction: 'vertical' }));
    }
  };

  const handleTouchEnd = () => {
    if (!touchState.isSwiping) return;

    if (touchState.direction === 'horizontal') {
        const currentIndex = NAV_ORDER.indexOf(location.pathname);

        if (touchState.translateX > SWIPE_THRESHOLD && currentIndex > 0) {
          navigate(NAV_ORDER[currentIndex - 1]);
        } else if (touchState.translateX < -SWIPE_THRESHOLD && currentIndex < NAV_ORDER.length - 1) {
          navigate(NAV_ORDER[currentIndex + 1]);
        }
    }
    
    setTouchState({ startX: 0, startY: 0, isSwiping: false, translateX: 0, direction: null });
  };
  
  useEffect(() => {
    setTouchState(prev => ({ ...prev, translateX: 0 }));
  }, [location.pathname]);

  const currentIndex = NAV_ORDER.indexOf(location.pathname);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : -1;
  const nextIndex = currentIndex < NAV_ORDER.length - 1 ? currentIndex + 1 : -1;
  const screenWidth = window.innerWidth;
  const swipeProgress = touchState.translateX / screenWidth;

  const swipeableStyle: React.CSSProperties = {
    transform: `translateX(${touchState.translateX}px)`,
    transition: touchState.isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.1, 0.7, 0.5, 1)',
    height: '100%',
    width: '100%',
    position: 'relative',
    zIndex: 10,
    boxShadow: `0 10px 40px rgba(0,0,0,${Math.min(Math.abs(swipeProgress) * 0.3, 0.3)})`,
  };
  
  const previewBaseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: touchState.isSwiping ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out',
    color: 'rgba(128, 128, 128, 0.2)',
  };

  const prevPreviewStyle: React.CSSProperties = {
      ...previewBaseStyle,
      opacity: Math.max(0, swipeProgress),
      transform: `scale(${0.95 + swipeProgress * 0.05})`,
      display: swipeProgress > 0 ? 'flex' : 'none',
  };

  const nextPreviewStyle: React.CSSProperties = {
      ...previewBaseStyle,
      opacity: Math.max(0, -swipeProgress),
      transform: `scale(${0.95 + -swipeProgress * 0.05})`,
      display: swipeProgress < 0 ? 'flex' : 'none',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <Header />
      <main 
        className="flex-grow pt-16 pb-16 overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {prevIndex > -1 && (
            <div style={prevPreviewStyle}>
                {navItems[prevIndex].icon(false)}
            </div>
        )}
        {nextIndex > -1 && (
            <div style={nextPreviewStyle}>
                {navItems[nextIndex].icon(false)}
            </div>
        )}

        <div style={swipeableStyle} className="bg-slate-100 dark:bg-slate-950">
            <Outlet />
        </div>
      </main>
      <BottomNav />
      <IncomingCallManager />
      <InstallPWAButton />
    </div>
  );
};

export default MainLayout;