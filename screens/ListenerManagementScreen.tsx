import React, { useState, useEffect, useMemo } from 'react';
// Fix: Use namespace import for react-router-dom to resolve module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../utils/firebase';
import type { ListenerProfile, ListenerAccountStatus } from '../types';
import ListenerRow from '../components/admin/ListenerRow';

type StatusFilter = 'all' | ListenerAccountStatus;

const ListenerManagementScreen: React.FC = () => {
    const [allListeners, setAllListeners] = useState<ListenerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('listeners')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const listenersData = snapshot.docs.map(doc => doc.data() as ListenerProfile);
                setAllListeners(listenersData);
                setLoading(false);
            }, error => {
                console.error("Error fetching listeners:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const filteredListeners = useMemo(() => {
        return allListeners.filter(listener => {
            const matchesStatus = statusFilter === 'all' || listener.status === statusFilter;
            const matchesSearch = searchTerm === '' ||
                listener.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (listener.phone && listener.phone.includes(searchTerm));
            
            return matchesStatus && matchesSearch;
        });
    }, [allListeners, statusFilter, searchTerm]);

    const filterOptions: { value: StatusFilter, label: string }[] = [
        { value: 'all', label: 'All Listeners' },
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'rejected', label: 'Rejected' },
    ];
    
    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-100 dark:bg-slate-900 min-h-full">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                    <div className="flex items-center gap-2">
                         <ReactRouterDOM.Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 -ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </ReactRouterDOM.Link>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Listener Management</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10">View, manage, and update all listener accounts.</p>
                </div>
            </header>
            
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="sm:w-1/4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {filterOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label} ({option.value === 'all' ? allListeners.length : allListeners.filter(l => l.status === option.value).length})</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            
            {/* Listeners Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Listener</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Details</th>
                                <th scope="col" className="px-6 py-3 text-right">Change Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <td className="px-6 py-4"><div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-10 w-32 ml-auto bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredListeners.length > 0 ? (
                                filteredListeners.map(listener => <ListenerRow key={listener.uid} listener={listener} />)
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10">
                                        <p className="font-semibold text-lg text-slate-600 dark:text-slate-300">No Listeners Found</p>
                                        <p className="text-slate-400">No listeners match the current filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ListenerManagementScreen;