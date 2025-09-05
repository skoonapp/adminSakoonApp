import React, { useState, useEffect } from 'react';
import { useListener } from '../context/ListenerContext';
import { db } from '../utils/firebase';
import type { CallRecord } from '../types';
import firebase from 'firebase/compat/app';

interface EarningsData {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
}

const StatCard: React.FC<{ title: string; value: string; loading: boolean }> = ({ title, value, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {loading ? 
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div> :
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        }
    </div>
);

const TransactionRow: React.FC<{ call: CallRecord }> = ({ call }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
        <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Call with {call.userName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {call.startTime.toDate().toLocaleDateString('en-IN')}
            </p>
        </div>
        <p className="font-bold text-green-600 dark:text-green-400">
            + ₹{Number(call.earnings).toFixed(2)}
        </p>
    </div>
);


const EarningsScreen: React.FC = () => {
    const { profile } = useListener();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<EarningsData>({ total: 0, today: 0, last7Days: 0, last30Days: 0 });
    const [transactions, setTransactions] = useState<CallRecord[]>([]);

    useEffect(() => {
        if (!profile) return;

        setLoading(true);
        const unsubscribe = db.collection('calls')
            .where('listenerId', '==', profile.uid)
            .where('status', '==', 'completed')
            .orderBy('startTime', 'desc')
            .onSnapshot(snapshot => {
                const calls = snapshot.docs.map(doc => doc.data() as CallRecord);
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

                const calculatedEarnings: EarningsData = { total: 0, today: 0, last7Days: 0, last30Days: 0 };

                calls.forEach(call => {
                    const callEarning = Number(call.earnings) || 0;
                    const callDate = call.startTime.toDate();
                    
                    calculatedEarnings.total += callEarning;
                    if (callDate >= sevenDaysAgo) calculatedEarnings.last7Days += callEarning;
                    if (callDate >= thirtyDaysAgo) calculatedEarnings.last30Days += callEarning;
                    if (callDate >= today) calculatedEarnings.today += callEarning;
                });

                setEarnings(calculatedEarnings);
                setTransactions(calls.slice(0, 20)); // show latest 20 transactions
                setLoading(false);
            }, (error) => {
                console.error("Error fetching earnings:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [profile]);

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Earnings</h1>
                <p className="text-slate-500 dark:text-slate-400">Your income overview and history.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Earnings" value={`₹${earnings.total.toFixed(2)}`} loading={loading} />
                <StatCard title="Today" value={`₹${earnings.today.toFixed(2)}`} loading={loading} />
                <StatCard title="Last 7 Days" value={`₹${earnings.last7Days.toFixed(2)}`} loading={loading} />
                <StatCard title="Last 30 Days" value={`₹${earnings.last30Days.toFixed(2)}`} loading={loading} />
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Recent Transactions</h3>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    {loading ? (
                        <p className="text-center text-slate-500 p-4">Loading transactions...</p>
                    ) : transactions.length > 0 ? (
                        <div>
                            {transactions.map(call => <TransactionRow key={call.callId} call={call} />)}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 p-4">No transactions found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarningsScreen;
