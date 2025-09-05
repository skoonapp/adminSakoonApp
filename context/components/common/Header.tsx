import React from 'react';
import { useListener } from '../../ListenerContext';
import { db } from '../../../utils/firebase';
import { ListenerStatus } from '../../../types';

const Header: React.FC = () => {
    const { profile, loading } = useListener();

    // Derive online status directly from the context profile
    const isOnline = profile?.status === 'Available' || profile?.status === 'Busy';

    const handleToggleOnline = async () => {
        if (!profile?.uid || loading) return;
        
        const newStatus: ListenerStatus = isOnline ? 'Offline' : 'Available';
        
        try {
            const listenerRef = db.collection('listeners').doc(profile.uid);
            await listenerRef.update({
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert('Failed to update status. Please try again.');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-50">
            <div className="flex items-center justify-between h-full px-4">
                {/* Left Side */}
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">SakoonApp Admin</h1>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    <span className="hidden sm:block font-semibold text-slate-700 dark:text-slate-300">
                        {profile?.displayName || 'Listener'}
                    </span>
                    <div className="flex items-center gap-2">
                         <span className={`text-sm font-semibold ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                         </span>
                         <button
                            onClick={handleToggleOnline}
                            disabled={loading}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isOnline ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'} ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            aria-label={isOnline ? 'Go Offline' : 'Go Online'}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${isOnline ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;