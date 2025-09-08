import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../utils/firebase';
import { useListener } from '../context/ListenerContext';
import type { CallRecord } from '../types';
import CallHistoryCard from '../components/calls/CallHistoryCard';

type StatusFilter = 'all' | 'completed' | 'missed' | 'rejected';
type DateFilter = 'all' | 'today' | '7d' | '30d';

const FilterButton: React.FC<{
  options: { value: string, label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ options, value, onChange }) => (
    <select 
        value={value} 
        onChange={onChange}
        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    >
        {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
    </select>
);


const CallsScreen: React.FC = () => {
    const { profile } = useListener();
    const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    useEffect(() => {
        if (!profile?.uid) return;

        setLoading(true);
        const unsubscribe = db.collection('calls')
            .where('listenerId', '==', profile.uid)
            .orderBy('startTime', 'desc')
            .onSnapshot(snapshot => {
                const callsData = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    callId: doc.id,
                })) as CallRecord[];
                setAllCalls(callsData);
                setLoading(false);
            }, error => {
                console.error("Error fetching call history: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [profile?.uid]);

    const filteredCalls = useMemo(() => {
        let calls = allCalls;

        // Filter by status
        if (statusFilter !== 'all') {
            calls = calls.filter(call => call.status === statusFilter);
        }

        // Filter by date
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateFilter === '30d') {
                startDate.setDate(now.getDate() - 30);
            }
            
            calls = calls.filter(call => call.startTime && call.startTime.toDate() >= startDate);
        }

        return calls;
    }, [allCalls, statusFilter, dateFilter]);

    return (
        <div className="p-4 space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Call History</h1>
                    <p className="text-slate-500 dark:text-slate-400">Review your recent calls.</p>
                </div>
                <div className="flex items-center gap-3">
                    <FilterButton 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'missed', label: 'Missed' },
                            { value: 'rejected', label: 'Rejected' },
                        ]}
                    />
                    <FilterButton 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'today', label: 'Today' },
                            { value: '7d', label: 'Last 7 Days' },
                            { value: '30d', label: 'Last 30 Days' },
                        ]}
                    />
                </div>
            </header>
            
            {loading ? (
                <div className="text-center py-10">
                    <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Loading history...</p>
                </div>
            ) : filteredCalls.length > 0 ? (
                <div className="space-y-3">
                    {filteredCalls.map(call => (
                        <CallHistoryCard key={call.callId} call={call} />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm text-center border border-dashed border-slate-300 dark:border-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">No Calls Found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your call history matching these filters will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default CallsScreen;