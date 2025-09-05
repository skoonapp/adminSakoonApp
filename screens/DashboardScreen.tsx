import React, { useState, useEffect } from 'react';
import { useListener } from './../context/ListenerContext';
import { db } from './../utils/firebase';
import firebase from 'firebase/compat/app';
import type { CallRecord, ListenerChatSession } from '../types';
import { Link } from 'react-router-dom';

// FIX: Redefined Activity as a discriminated union to fix type errors.
type CallActivity = CallRecord & { type: 'call'; timestamp: firebase.firestore.Timestamp; };
type ChatActivity = ListenerChatSession & { type: 'chat'; timestamp: firebase.firestore.Timestamp; };
type Activity = CallActivity | ChatActivity;

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

const StatValue: React.FC<{ loading: boolean; value: string | number; prefix?: string; suffix?: string }> = ({ loading, value, prefix = '', suffix = '' }) => {
    if (loading) {
        return <span className="inline-block h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span>;
    }
    return <>{prefix}{value}{suffix}</>;
};

const ActivityRow: React.FC<{ activity: Activity }> = ({ activity }) => {
    const isCall = activity.type === 'call';
    const record = activity; // activity is already correctly typed as CallActivity or ChatActivity

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCall ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
                    {isCall ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> : 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    }
                 </div>
                <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {isCall ? `Call with ${record.userName}` : `Chat with ${record.userName}`}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activity.timestamp.toDate().toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                </div>
            </div>
            <div>
                {isCall ? (
                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                        + ₹{Number((record as CallRecord).earnings).toFixed(2)}
                    </p>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate max-w-[120px] sm:max-w-[150px]">
                        {(record as ListenerChatSession).lastMessageText}
                    </p>
                )}
            </div>
        </div>
    );
};

const DashboardScreen: React.FC = () => {
    const { profile } = useListener();
    const [stats, setStats] = useState({ callsToday: 0, minutesToday: 0, chatsToday: 0 });
    const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    useEffect(() => {
        if (!profile?.uid) {
            setLoadingStats(false);
            setLoadingRecent(false);
            return;
        }

        setLoadingStats(true);

        const callsUnsubscribe = db.collection('calls')
            .where('listenerId', '==', profile.uid)
            .where('status', '==', 'completed')
            .onSnapshot(snapshot => {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStartDate = new Date(now);
                weekStartDate.setDate(now.getDate() - now.getDay()); // Assuming week starts Sunday
                weekStartDate.setHours(0, 0, 0, 0);
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                let callsToday = 0, minutesToday = 0, earningsToday = 0, earningsWeek = 0, earningsMonth = 0, earningsTotal = 0;

                snapshot.forEach(doc => {
                    const call = doc.data() as CallRecord;
                    const callEarning = Number(call.earnings) || 0;
                    const callDate = call.startTime.toDate();

                    earningsTotal += callEarning;
                    if (callDate >= monthStart) earningsMonth += callEarning;
                    if (callDate >= weekStartDate) earningsWeek += callEarning;
                    if (callDate >= todayStart) {
                        callsToday++;
                        minutesToday += Math.round((call.durationSeconds || 0) / 60);
                        earningsToday += callEarning;
                    }
                });
                
                setStats(prev => ({ ...prev, callsToday, minutesToday }));
                setEarnings({ today: earningsToday, week: earningsWeek, month: earningsMonth, total: earningsTotal });
                setLoadingStats(false);
            }, error => {
                console.error("Error fetching call stats:", error);
                setLoadingStats(false);
            });

        const chatsUnsubscribe = db.collection('chats')
            .where('listenerId', '==', profile.uid)
            .onSnapshot(snapshot => {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                let chatsToday = 0;
                snapshot.forEach(doc => {
                    if (doc.data().lastMessageTimestamp?.toDate() >= todayStart) {
                        chatsToday++;
                    }
                });
                setStats(prev => ({ ...prev, chatsToday }));
            });

        return () => {
            callsUnsubscribe();
            chatsUnsubscribe();
        };
    }, [profile?.uid]);
    
    useEffect(() => {
        if (!profile?.uid) return;
        setLoadingRecent(true);
        const fetchActivities = async () => {
            try {
                const callsPromise = db.collection('calls').where('listenerId', '==', profile.uid).where('status', '==', 'completed').orderBy('startTime', 'desc').limit(5).get();
                const chatsPromise = db.collection('chats').where('listenerId', '==', profile.uid).orderBy('lastMessageTimestamp', 'desc').limit(5).get();
                const [callsSnapshot, chatsSnapshot] = await Promise.all([callsPromise, chatsPromise]);
                const calls: CallActivity[] = callsSnapshot.docs.map(doc => ({ ...(doc.data() as CallRecord), type: 'call' as const, timestamp: doc.data().startTime }));
                const chats: ChatActivity[] = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<ListenerChatSession, 'id'>), type: 'chat' as const, timestamp: doc.data().lastMessageTimestamp }));
                const combined = [...calls, ...chats].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
                setRecentActivities(combined.slice(0, 7));
            } catch (error) {
                console.error("Error fetching recent activities:", error);
            } finally {
                setLoadingRecent(false);
            }
        };
        fetchActivities();
    }, [profile?.uid]);

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Hello, {profile?.displayName || 'Listener'}!</h1>
                <p className="text-slate-500 dark:text-slate-400">Here’s today’s performance snapshot.</p>
            </header>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Calls Today" value={<StatValue loading={loadingStats} value={stats.callsToday} />} color="bg-blue-100 dark:bg-blue-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
                <StatCard title="Minutes Talked" value={<StatValue loading={loadingStats} value={stats.minutesToday} suffix=" min" />} color="bg-green-100 dark:bg-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Chats Today" value={<StatValue loading={loadingStats} value={stats.chatsToday} />} color="bg-purple-100 dark:bg-purple-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
                <StatCard title="Total Earnings" value={<StatValue loading={loadingStats} value={earnings.total.toFixed(2)} prefix="₹" />} color="bg-yellow-100 dark:bg-yellow-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Earnings Snapshot</h3>
                     <Link to="/earnings" className="text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">View Details &rarr;</Link>
                </div>
                 <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                     <div className="px-2 text-center"><p className="text-sm text-slate-500">Today</p><p className="font-bold text-lg">₹{earnings.today.toFixed(2)}</p></div>
                     <div className="px-2 text-center"><p className="text-sm text-slate-500">This Week</p><p className="font-bold text-lg">₹{earnings.week.toFixed(2)}</p></div>
                     <div className="px-2 text-center"><p className="text-sm text-slate-500">This Month</p><p className="font-bold text-lg">₹{earnings.month.toFixed(2)}</p></div>
                 </div>
            </div>

            <div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Recent Activity</h3>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    {loadingRecent ? (
                        <p className="text-center text-slate-500 p-4">Loading recent activity...</p>
                    ) : recentActivities.length > 0 ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {recentActivities.map(activity => <ActivityRow key={`${activity.type}-${isCallRecord(activity) ? activity.callId : activity.id}`} activity={activity} />)}
                        </div>
                    ) : (
                        <div className="text-center p-4">
                           <p className="text-slate-500 dark:text-slate-400">No recent activity to show.</p>
                           <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Completed sessions will appear here.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

// FIX: Update type guard to use the new discriminated union types.
// Type guard to differentiate between CallRecord and ListenerChatSession inside the map key
function isCallRecord(activity: Activity): activity is CallActivity {
  return activity.type === 'call';
}

export default DashboardScreen;