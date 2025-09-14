import React, { memo, useState, useEffect, useCallback } from 'react';
import { useListener } from '../context/ListenerContext';
import { db } from '../utils/firebase';
import type { ListenerAppStatus } from '../types';
import InstallPWAButton from '../components/common/InstallPWAButton';

// --- Stat Card Component ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean; }> = memo(({ title, value, icon, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {loading ? 
                <div className="h-7 w-20 mt-1 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div> :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
        </div>
    </div>
));


// --- Welcome Header ---
const WelcomeHeader: React.FC = memo(() => {
    const { profile } = useListener();
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                Welcome, {profile?.displayName || 'Listener'}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Here's a look at your activity today.</p>
        </div>
    );
});


// --- Active Status Component ---
const ActiveStatus: React.FC = memo(() => {
    const { profile, loading } = useListener();
    const [currentStatus, setCurrentStatus] = useState<ListenerAppStatus | undefined>(profile?.appStatus);

    useEffect(() => {
        // Sync with profile changes from context or set default on initial load
        if (profile?.appStatus) {
            setCurrentStatus(profile.appStatus);
        } else if (!loading) {
            setCurrentStatus('Offline');
        }
    }, [profile?.appStatus, loading]);

    const handleStatusChange = useCallback(async (newStatus: ListenerAppStatus) => {
        if (!profile || loading || currentStatus === newStatus || currentStatus === 'Busy') return;
        
        // Optimistic update
        setCurrentStatus(newStatus);

        try {
            await db.collection('listeners').doc(profile.uid).update({ appStatus: newStatus });
        } catch (error) {
            console.error("Failed to update status:", error);
            // Revert on error
            setCurrentStatus(profile.appStatus);
            alert("Could not update status. Please try again.");
        }
    }, [profile, loading, currentStatus]);

    const getStatusText = (status: ListenerAppStatus | undefined) => {
        switch (status) {
            case 'Available': return 'You are ready to take calls.';
            case 'Offline': return 'You are not receiving calls.';
            case 'Busy': return 'You are currently on a call.';
            default: return 'Go online to start taking calls.';
        }
    };
    
    const isOnline = currentStatus === 'Available';
    const isBusy = currentStatus === 'Busy';
    const isDisabled = isBusy || loading;

    return (
        <div className="bg-white dark:bg-slate-800/50 py-4 px-4 border-y border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Status</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getStatusText(currentStatus)}</p>
                </div>

                {/* New Sliding Pill Toggle */}
                <div className={`relative flex w-48 h-10 items-center bg-slate-200 dark:bg-slate-700 rounded-full p-1 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {/* Sliding Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-in-out
                        ${isOnline ? 'translate-x-full bg-green-500' : 'translate-x-0 bg-slate-500'}`}
                    ></div>

                    {/* Offline Button */}
                    <button
                        onClick={() => handleStatusChange('Offline')}
                        disabled={isDisabled}
                        className={`relative z-10 w-1/2 h-full flex items-center justify-center text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none
                        ${!isOnline ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        aria-pressed={!isOnline}
                    >
                        Offline
                    </button>

                    {/* Online Button */}
                    <button
                        onClick={() => handleStatusChange('Available')}
                        disabled={isDisabled}
                        className={`relative z-10 w-1/2 h-full flex items-center justify-center text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none
                        ${isOnline ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
                        aria-pressed={isOnline}
                    >
                        Online
                    </button>
                </div>
            </div>
        </div>
    );
});


// --- Stats Grid ---
const StatsGrid: React.FC = memo(() => {
    const { profile, loading } = useListener();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Calls Today" 
                value={0} // Placeholder
                loading={loading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} 
            />
            <StatCard 
                title="Minutes Today" 
                value={0} // Placeholder
                loading={loading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            <StatCard 
                title="Earnings Today" 
                value={`₹${(profile?.dailyEarnings?.[new Date().toISOString().split('T')[0]] || 0).toFixed(2)}`} 
                loading={loading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
             <StatCard 
                title="Rating" 
                value={profile?.rating?.toFixed(1) || 'N/A'} 
                loading={loading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} 
            />
        </div>
    );
});


// --- New User Tip ---
const NewUserTip: React.FC = memo(() => {
    // This could be enhanced to only show for listeners with < 5 calls, for example.
    return (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 p-4 rounded-xl border border-teal-200 dark:border-teal-700">
            <div className="flex items-start gap-4">
                <div className="text-2xl mt-1">💡</div>
                <div>
                    <h3 className="font-bold text-teal-800 dark:text-teal-200">Pro Tip</h3>
                    <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                        Always be polite and respectful to users to improve your ratings and increase your call durations. Longer calls mean higher per-minute earnings!
                    </p>
                </div>
            </div>
        </div>
    );
});


// --- Main Dashboard Screen Component ---
const DashboardScreen: React.FC = () => {
    return (
        <div className="space-y-4 p-4">
            <InstallPWAButton />
            <WelcomeHeader />
            <ActiveStatus />
            <StatsGrid />
            <NewUserTip />
        </div>
    );
};

export default DashboardScreen;
