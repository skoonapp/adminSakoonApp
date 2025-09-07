import React from 'react';

// Fix: Create a placeholder component for the Admin Dashboard to resolve module errors.
const AdminDashboardScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Admin Dashboard</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Admin-specific features and controls will be available here.</p>
            <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">This page is under construction.</p>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboardScreen;
