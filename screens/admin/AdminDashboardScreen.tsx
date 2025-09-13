


import React, { useState, useEffect } from 'react';
import { db, functions, auth } from '../../utils/firebase';
import type { ListenerProfile, Application } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

// --- Icon Components ---
const RupeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ProfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TransactionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UserClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NewApplicationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean; }> = ({ title, value, icon, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4 h-full">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            {loading ?
                <div className="h-7 w-24 mt-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div> :
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            }
        </div>
    </div>
);

const PayoutNotice: React.FC = () => {
    const getNextMonday = () => {
        const today = new Date();
        const day = today.getDay(); // Sunday - 0, Monday - 1, ...
        const daysUntilMonday = (8 - day) % 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
        return nextMonday;
    };

    const isTodayPayoutDay = new Date().getDay() === 1;
    const nextPayoutDate = getNextMonday();

    return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-4">
            <div className="flex-grow">
                <h3 className="font-bold text-lg">{isTodayPayoutDay ? "✅ आज पेआउट का दिन है!" : "🗓️ अगला पेआउट शेड्यूल"}</h3>
                <p className="text-sm">{isTodayPayoutDay ? "सुनिश्चित करें कि सभी गणनाएँ सत्यापित हैं।" : `पेआउट हर सोमवार को प्रोसेस किए जाते हैं। अगला पेआउट: ${nextPayoutDate.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}</p>
            </div>
            <CalendarIcon />
        </div>
    );
};


const AdminDashboardScreen: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [onboardingListeners, setOnboardingListeners] = useState<ListenerProfile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await auth.signOut();
        navigate('/login'); 
    } catch (error) {
        console.error('Error signing out: ', error);
        alert('Could not log out. Please try again.');
    }
  };

  useEffect(() => {
    setLoading(true);

    const fetchAllData = async () => {
        try {
            const getStats = functions.httpsCallable('getAdminDashboardStats');
            const result = await getStats();
            setStats(result.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };
    fetchAllData();

    const unsubApplications = db.collection('applications').where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
        setLoading(false); // Stop loading after first fetch
      });
      
    const unsubOnboarding = db.collection('listeners').where('status', '==', 'onboarding_required')
      .onSnapshot(snapshot => {
        setOnboardingListeners(snapshot.docs.map(doc => doc.data() as ListenerProfile));
      });

    return () => {
      unsubApplications();
      unsubOnboarding();
    };
  }, []);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    if (!applicationId) return;
    const confirmationText = action === 'approve'
      ? 'Are you sure you want to approve this application? This will create a listener account and ask them to complete their profile.'
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


  return (
    <div className="p-4 sm:p-6 space-y-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">एडमिन डैशबोर्ड</h1>
                <p className="text-slate-500 dark:text-slate-400">आपका स्वागत है, एडमिन। यहाँ आपके व्यवसाय का पूरा अवलोकन है।</p>
            </div>
             <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0"
            >
                Logout
            </button>
        </header>
        
        <PayoutNotice />

        {/* Overall Stats Grid */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">कुल बिज़नेस परफॉरमेंस</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="कुल कमाई" value={`₹${stats?.totalRevenue ?? '...'}`} icon={<RupeeIcon />} loading={!stats} />
                <StatCard title="कुल मुनाफ़ा" value={`₹${stats?.totalProfit ?? '...'}`} icon={<ProfitIcon />} loading={!stats} />
                <StatCard title="लिसनर्स को भुगतान" value={`₹${stats?.totalPaidToListeners ?? '...'}`} icon={<CashIcon />} loading={!stats} />
                <StatCard title="कुल ट्रांजैक्शन" value={stats?.totalTransactions ?? '...'} icon={<TransactionIcon />} loading={!stats} />
            </div>
        </div>

        {/* Today's Stats Grid */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">आज का परफॉरमेंस</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="आज की कमाई" value={`₹${stats?.dailyRevenue ?? '...'}`} icon={<RupeeIcon />} loading={!stats} />
                <StatCard title="आज का मुनाफ़ा" value={`₹${stats?.dailyProfit ?? '...'}`} icon={<ProfitIcon />} loading={!stats} />
                <StatCard title="आज की कॉल्स" value={stats?.dailyCalls ?? '...'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} loading={!stats} />
                <StatCard title="आज की चैट्स" value={stats?.dailyChats ?? '...'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} loading={!stats} />
            </div>
        </div>

        {/* Listener Funnel */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">लिसनर मैनेजमेंट फनल</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="नए आवेदन" value={applications.length} icon={<NewApplicationIcon />} loading={loading} />
                <StatCard title="प्रोफाइल पूर्णता बाकी" value={onboardingListeners.length} icon={<UserClockIcon />} loading={loading} />
                <StatCard title="सक्रिय श्रोता" value={stats?.activeListeners ?? '...'} icon={<UserCheckIcon />} loading={!stats} />
                 <Link to="/admin/listeners" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl block bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 h-full">
                        <div className="flex-shrink-0"><UsersIcon /></div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">सभी श्रोताओं को प्रबंधित करें</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">देखें और संपादित करें</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
        
        {/* New Applications Table */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">ACTION REQUIRED: नए आवेदन</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">आवेदक का नाम</th>
                                <th scope="col" className="px-6 py-3">फोन</th>
                                <th scope="col" className="px-6 py-3">पेशा</th>
                                <th scope="col" className="px-6 py-3 text-right">कार्रवाई</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-4">लोड हो रहा है...</td></tr>
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
                                    <td colSpan={4} className="text-center py-8">समीक्षा के लिए कोई नया आवेदन नहीं है।</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Pending Profile Completion Table */}
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">INFORMATIONAL: प्रोफाइल पूर्णता बाकी</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                         <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">नाम</th>
                                <th scope="col" className="px-6 py-3">फोन</th>
                                <th scope="col" className="px-6 py-3">Approved On</th>
                                <th scope="col" className="px-6 py-3 text-right">कार्रवाई</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-4">लोड हो रहा है...</td></tr>
                            ) : onboardingListeners.length > 0 ? (
                                onboardingListeners.map(listener => (
                                    <tr key={listener.uid} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{listener.displayName}</th>
                                        <td className="px-6 py-4">{listener.phone}</td>
                                        <td className="px-6 py-4">{listener.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button disabled className="font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed">रिमाइंडर भेजें</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">कोई भी लिसनर वर्तमान में अपनी प्रोफाइल पूरी नहीं कर रहा है।</td>
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