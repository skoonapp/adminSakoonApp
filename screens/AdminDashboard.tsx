import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { ListenerProfile } from '../types';
// Fix: Use namespace import for react-router-dom to resolve module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';

// Icons
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean; linkTo?: string; }> = ({ title, value, icon, loading, linkTo }) => {
    const content = (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4 h-full hover:shadow-md transition-shadow">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                {loading ?
                    <div className="h-7 w-20 mt-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> :
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
                }
            </div>
        </div>
    );

    if (linkTo) {
        return <ReactRouterDOM.Link to={linkTo} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl">{content}</ReactRouterDOM.Link>;
    }
    return content;
};

const AnalyticsChart: React.FC<{ data: { day: string; count: number }[], loading: boolean }> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <div className="h-8 w-48 mb-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Weekly Call Volume</h3>
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">No call data for the past week.</div>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count), 1); // Avoid division by zero

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Weekly Call Volume</h3>
            <div className="flex justify-around items-end h-48 border-l border-b border-slate-200 dark:border-slate-700 pl-2 pb-1">
                {data.map(({ day, count }) => (
                    <div key={day} className="flex flex-col items-center h-full justify-end group w-1/7">
                        <div className="relative">
                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {count} call{count !== 1 && 's'}
                            </span>
                            <div
                                className="w-6 sm:w-8 bg-cyan-500 hover:bg-cyan-400 rounded-t-md transition-all duration-300"
                                style={{ height: `${(count / maxCount) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboardScreen: React.FC = () => {
  const [pendingListeners, setPendingListeners] = useState<ListenerProfile[]>([]);
  const [stats, setStats] = useState({ activeListeners: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{ day: string; count: number }[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    setLoadingAnalytics(true);

    // Fetch pending listeners
    const unsubPending = db.collection('listeners').where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        const listeners = snapshot.docs.map(doc => doc.data() as ListenerProfile);
        setPendingListeners(listeners);
      }, (error) => console.error("Error fetching pending listeners:", error));
      
    // Fetch active listeners count
    const unsubActive = db.collection('listeners').where('status', '==', 'active')
      .onSnapshot(snapshot => {
         setStats(prev => ({...prev, activeListeners: snapshot.size}));
         setLoadingStats(false);
      }, (error) => {
          console.error("Error fetching active listeners:", error)
          setLoadingStats(false);
      });
      
    // Fetch analytics data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoTimestamp = firebase.firestore.Timestamp.fromDate(sevenDaysAgo);

    const unsubAnalytics = db.collection('calls')
        .where('startTime', '>=', sevenDaysAgoTimestamp)
        .onSnapshot(snapshot => {
            const countsByDay: { [key: string]: number } = {};
            const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // Initialize counts for the last 7 days
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayKey = dayLabels[d.getDay()];
                countsByDay[dayKey] = 0;
            }

            snapshot.docs.forEach(doc => {
                const call = doc.data();
                if (call.startTime) {
                    const callDate = call.startTime.toDate();
                    const dayKey = dayLabels[callDate.getDay()];
                    if (countsByDay.hasOwnProperty(dayKey)) {
                        countsByDay[dayKey]++;
                    }
                }
            });

            // Format data for the chart, in correct order of last 7 days
            const formattedData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayKey = dayLabels[d.getDay()];
                formattedData.push({ day: dayKey, count: countsByDay[dayKey] });
            }

            setAnalyticsData(formattedData);
            setLoadingAnalytics(false);
        }, (error) => {
            console.error("Error fetching analytics data:", error);
            setLoadingAnalytics(false);
        });

    return () => {
      unsubPending();
      unsubActive();
      unsubAnalytics();
    };
  }, []);

  const handleApproval = async (uid: string, newStatus: 'active' | 'rejected') => {
      if (!uid) return;
      if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'approve' : 'reject'} this listener?`)) return;

      try {
          await db.collection('listeners').doc(uid).update({ status: newStatus });
          alert(`Listener has been ${newStatus}.`);
      } catch (error) {
          console.error(`Error updating listener status:`, error);
          alert('Failed to update listener status.');
      }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-full">
        <header>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Welcome, Admin. Here's your overview.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Pending Approvals" value={pendingListeners.length} icon={<UserClockIcon />} loading={loadingStats} />
            <StatCard title="Active Listeners" value={stats.activeListeners} icon={<UserCheckIcon />} loading={loadingStats} />
            <StatCard title="Manage All Listeners" value="View & Edit" icon={<UsersIcon />} loading={loadingStats} linkTo="/admin/listeners" />
            <StatCard title="Calls Today" value={analyticsData.length > 0 ? analyticsData[6].count : '--'} icon={<PhoneIcon />} loading={loadingAnalytics} />
        </div>
        
        {/* Weekly Analytics Section */}
        <AnalyticsChart data={analyticsData} loading={loadingAnalytics} />

        {/* Pending Listeners Table */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Pending Listener Approvals</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Age / City</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingStats ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-36 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : pendingListeners.length > 0 ? (
                                pendingListeners.map(listener => (
                                    <tr key={listener.uid} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{listener.displayName}</th>
                                        <td className="px-6 py-4">{listener.phone}</td>
                                        <td className="px-6 py-4">{listener.age} / {listener.city}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleApproval(listener.uid, 'active')} className="font-medium text-green-600 dark:text-green-500 hover:underline">Approve</button>
                                            <button onClick={() => handleApproval(listener.uid, 'rejected')} className="font-medium text-red-600 dark:text-red-500 hover:underline">Reject</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <p className="font-semibold">No pending approvals.</p>
                                        <p className="text-xs text-slate-400">All caught up!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboardScreen;