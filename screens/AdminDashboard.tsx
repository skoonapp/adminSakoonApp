import React, { useState, useEffect } from 'react';
import { db, functions } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { ListenerProfile, Application } from '../types';
// FIX: Use named imports for react-router-dom v6 components.
import { Link } from 'react-router-dom';

// Icons
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NewApplicationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
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
        return <Link to={linkTo} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl">{content}</Link>;
    }
    return content;
};

const AdminDashboardScreen: React.FC = () => {
  const [pendingListeners, setPendingListeners] = useState<ListenerProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ activeListeners: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubPendingListeners = db.collection('listeners').where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        setPendingListeners(snapshot.docs.map(doc => doc.data() as ListenerProfile));
      });

    const unsubApplications = db.collection('applications').where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
      });

    const unsubActive = db.collection('listeners').where('status', '==', 'active')
      .onSnapshot(snapshot => {
         setStats(prev => ({...prev, activeListeners: snapshot.size}));
         setLoading(false);
      });

    return () => {
      unsubPendingListeners();
      unsubApplications();
      unsubActive();
    };
  }, []);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    if (!applicationId) return;
    const confirmationText = action === 'approve'
      ? 'Are you sure you want to approve this application and create a listener account?'
      : 'Are you sure you want to reject this application?';
    if (!window.confirm(confirmationText)) return;

    const functionName = action === 'approve' ? 'approveApplication' : 'rejectApplication';
    try {
        const callable = functions.httpsCallable(functionName);
        await callable({ applicationId });
        alert(`Application successfully ${action}d.`);
    } catch (error: any) {
        console.error(`Error ${action}ing application:`, error);
        alert(`Failed to ${action} application: ${error.message}`);
    }
  };

  const handleFinalApproval = async (uid: string, newStatus: 'active' | 'rejected') => {
      if (!uid) return;
      if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'approve' : 'reject'} this listener? This is the final step.`)) return;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="New Applications" value={applications.length} icon={<NewApplicationIcon />} loading={loading} />
            <StatCard title="Pending Final Approval" value={pendingListeners.length} icon={<UserClockIcon />} loading={loading} />
            <StatCard title="Active Listeners" value={stats.activeListeners} icon={<UserCheckIcon />} loading={loading} />
            <StatCard title="Manage All Listeners" value="View & Edit" icon={<UsersIcon />} loading={loading} linkTo="/admin/listeners" />
        </div>
        
        {/* New Applications Table */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Step 1: New Applications</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Applicant Name</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Profession</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>
                            ) : applications.length > 0 ? (
                                applications.map(app => (
                                    <tr key={app.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{app.displayName} ({app.fullName})</th>
                                        <td className="px-6 py-4">{app.phone}</td>
                                        <td className="px-6 py-4 capitalize">{app.profession}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleApplicationAction(app.id, 'approve')} className="font-medium text-green-600 dark:text-green-500 hover:underline">Approve</button>
                                            <button onClick={() => handleApplicationAction(app.id, 'reject')} className="font-medium text-red-600 dark:text-red-500 hover:underline">Reject</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">No new applications.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Pending Final Approvals Table */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Step 2: Pending Final Approvals</h3>
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
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>
                            ) : pendingListeners.length > 0 ? (
                                pendingListeners.map(listener => (
                                    <tr key={listener.uid} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{listener.displayName}</th>
                                        <td className="px-6 py-4">{listener.phone}</td>
                                        <td className="px-6 py-4">{listener.age} / {listener.city}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleFinalApproval(listener.uid, 'active')} className="font-medium text-green-600 dark:text-green-500 hover:underline">Final Approve</button>
                                            <button onClick={() => handleFinalApproval(listener.uid, 'rejected')} className="font-medium text-red-600 dark:text-red-500 hover:underline">Reject</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">No listeners awaiting final approval.</td>
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