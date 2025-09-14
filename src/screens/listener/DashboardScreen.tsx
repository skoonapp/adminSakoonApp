import React, { memo, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { useListener } from '../../context/ListenerContext';
import type { ListenerAppStatus } from '../../types';
import InstallPWAButton from '../../components/common/InstallPWAButton';

// --- Icon Components for Stats ---
const RupeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Stat Card Component ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean; }> = memo(({ title, value, icon, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {loading ? 
                <div className="h-7 w-20 mt-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
        </div>
    </div>
));


// --- Active Status Toggle Component ---
const ActiveStatus: React.FC = memo(() => {
    const { profile, loading } = useListener();
    
    // Determine the current status, defaulting to 'Offline' if loading or no profile.
    const currentStatus = profile?.appStatus ?? 'Offline';
    const isBusy = currentStatus === 'Busy';

    const handleStatusChange = useCallback(async (newStatus: ListenerAppStatus) => {
        if (loading || !profile || isBusy || profile.appStatus === newStatus) {
            return;
        }
        try {
            // Optimistic UI update
            await db.collection('listeners').doc(profile.uid).update({ appStatus: newStatus });
        } catch (error) {
            console.error("Failed to update status:", error);
            // Optionally, show an error to the user and revert UI
        }
    }, [profile, loading, isBusy]);
    
    const getStatusText = () => {
        switch (currentStatus) {
            case 'Available': return "You are online and ready to take calls.";
            case 'Offline': return "You are offline. Go online to start taking calls.";
            case 'Busy': return "You are currently in a call.";
            default: return "Your status is being updated.";
        }
    };

    // 'Available' is the status for being Online
    const isOnline = currentStatus === 'Available';
    
    return (
        <div className="p-4 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">Active Status</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getStatusText()}</p>
                </div>

                <div className="relative flex items-center w-36 h-10 p-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                    {/* Sliding Pill Background */}
                    <span 
                        className={`absolute left-1 w-[calc(50%-0.25rem)] h-8 rounded-full transition-transform duration-300 ease-in-out
                        ${isOnline ? 'translate-x-full bg-green-500' : 'translate-x-0 bg-slate-500'}
                        ${isBusy ? '!bg-orange-500' : ''}`}
                    />
                    
                    {/* Buttons */}
                    <button 
                        onClick={() => handleStatusChange('Offline')} 
                        disabled={isBusy}
                        aria-pressed={!isOnline && !isBusy}
                        className={`relative z-10 w-1/2 text-center text-sm font-semibold transition-colors duration-300 rounded-full ${!isOnline && !isBusy ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Offline
                    </button>
                    <button 
                        onClick={() => handleStatusChange('Available')} 
                        disabled={isBusy}
                        aria-pressed={isOnline && !isBusy}
                        className={`relative z-10 w-1/2 text-center text-sm font-semibold transition-colors duration-300 rounded-full ${isOnline && !isBusy ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Online
                    </button>
                    {/* Busy Overlay */}
                    {isBusy && (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-500 rounded-full cursor-not-allowed">
                            <span className="text-sm font-semibold text-white">Busy</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});


// --- Main Dashboard Screen ---
const DashboardScreen: React.FC = () => {
    const { profile, loading } = useListener();

    return (
        <div className="space-y-4">
            <div className="p-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                    Welcome, {loading ? '...' : profile?.displayName || 'Listener'}!
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Here's a summary of your activity.</p>
            </div>

            <ActiveStatus />

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    title="Total Earnings" 
                    value={`₹${profile?.totalEarnings?.toFixed(2) ?? '0.00'}`}
                    icon={<RupeeIcon />} 
                    loading={loading} 
                />
                <StatCard 
                    title="Calls Completed" 
                    value={profile?.callsCompleted ?? profile?.totalCalls ?? 0} 
                    icon={<PhoneIcon />} 
                    loading={loading} 
                />
                <StatCard 
                    title="Total Minutes" 
                    value={profile?.totalMinutes ?? 0} 
                    icon={<ClockIcon />} 
                    loading={loading} 
                />
            </div>

            <div className="px-4">
                <InstallPWAButton />
            </div>
        </div>
    );
};

export default DashboardScreen;
