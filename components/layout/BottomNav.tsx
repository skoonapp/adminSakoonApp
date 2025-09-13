
import React from 'react';
// FIX: Downgraded react-router-dom from v6 to v5 syntax. Replaced NavLink with Link and useRouteMatch.
import { Link, useRouteMatch } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: (active: boolean) => <IconDashboard active={active} /> },
  { path: '/calls', label: 'Calls', icon: (active: boolean) => <IconCalls active={active} /> },
  { path: '/chat', label: 'Chat', icon: (active: boolean) => <IconChat active={active} /> },
  { path: '/earnings', label: 'Earnings', icon: (active: boolean) => <IconEarnings active={active} /> },
  { path: '/profile', label: 'Profile', icon: (active: boolean) => <IconProfile active={active} /> },
];

const NavItem: React.FC<{ path: string; label: string; icon: (active: boolean) => React.ReactNode; }> = ({ path, label, icon }) => {
    const match = useRouteMatch({
        path: path,
        exact: true
    });
    const isActive = !!match;

    const baseClasses = "relative flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";
    const inactiveClasses = "text-cyan-200 hover:text-white";
    const activeClasses = "text-white";

    return (
        <Link
            to={path}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {isActive && <div className="absolute top-0 h-1 w-8 bg-white rounded-b-full"></div>}
            {icon(isActive)}
            <span className={`text-xs mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
        </Link>
    );
};


const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-slate-900 dark:to-slate-800 shadow-[0_-2px_15px_-5px_rgba(0,0,0,0.2)] border-t border-black/10 dark:border-white/10 z-50">
      <div className="flex justify-around h-full">
        {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
        ))}
      </div>
    </nav>
  );
};

// SVG Icon Components
const IconDashboard: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const IconCalls: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const IconChat: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const IconEarnings: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);
const IconProfile: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);


export default BottomNav;
