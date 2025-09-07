import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';
import ChatbotFAB from '../chatbot/ChatbotFAB';
import ChatbotModal from '../chatbot/ChatbotModal';
import InstallPWAButton from '../common/InstallPWAButton';

// The navigation order must match BottomNav to ensure correct swipe logic
const NAV_ORDER = ['/dashboard', '/calls', '/chat', '/earnings', '/profile'];
const SWIPE_THRESHOLD = 75; // Minimum pixels to move to trigger a navigation
const DIRECTION_LOCK_THRESHOLD = 10; // Minimum pixels to move before locking swipe direction to horizontal/vertical

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

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent swipe on interactive elements to not override their default behavior
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

    // Lock direction after a small movement to distinguish between scroll and swipe
    if (!currentDirection && (Math.abs(deltaX) > DIRECTION_LOCK_THRESHOLD || Math.abs(deltaY) > DIRECTION_LOCK_THRESHOLD)) {
      currentDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
    
    // If the swipe is horizontal, translate the view and prevent vertical scrolling
    if (currentDirection === 'horizontal') {
      if (e.cancelable) e.preventDefault();
      setTouchState(prev => ({ ...prev, translateX: deltaX, direction: 'horizontal' }));
    } else {
      // If it's vertical, let the browser handle the scroll
      setTouchState(prev => ({ ...prev, direction: 'vertical' }));
    }
  };

  const handleTouchEnd = () => {
    if (!touchState.isSwiping) return;

    // Only navigate if the swipe was horizontal and exceeded the threshold
    if (touchState.direction === 'horizontal') {
        const currentIndex = NAV_ORDER.indexOf(location.pathname);

        if (touchState.translateX > SWIPE_THRESHOLD && currentIndex > 0) {
          // Swipe Right -> Go to the previous page in the nav order
          navigate(NAV_ORDER[currentIndex - 1]);
        } else if (touchState.translateX < -SWIPE_THRESHOLD && currentIndex < NAV_ORDER.length - 1) {
          // Swipe Left -> Go to the next page in the nav order
          navigate(NAV_ORDER[currentIndex + 1]);
        }
    }
    
    // Reset state for the next interaction, causing a snap-back animation if no navigation occurred
    setTouchState({ startX: 0, startY: 0, isSwiping: false, translateX: 0, direction: null });
  };
  
  // When navigation happens via other means (e.g., bottom nav), ensure the view is visually reset
  useEffect(() => {
    setTouchState(prev => ({ ...prev, translateX: 0 }));
  }, [location.pathname]);

  const swipeableStyle: React.CSSProperties = {
    transform: `translateX(${touchState.translateX}px)`,
    transition: touchState.isSwiping ? 'none' : 'transform 0.3s ease-out',
    height: '100%',
    width: '100%',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <Header />
      <main 
        className="flex-grow pt-16 pb-16 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={swipeableStyle}>
            <Outlet />
        </div>
      </main>
      <BottomNav />
      <IncomingCallManager />
      <ChatbotFAB onClick={() => setIsChatbotOpen(true)} />
      <ChatbotModal isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      <InstallPWAButton />
    </div>
  );
};

export default MainLayout;