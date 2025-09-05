import React from 'react';
import { auth } from '../utils/firebase';
import { Link, useNavigate } from 'react-router-dom';
import ListenerGuidelines from '../context/components/profile/ListenerGuidelines';

const PolicyLink: React.FC<{ title: string, to: string }> = ({ title, to }) => (
    <Link to={to} className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
        <span className="text-slate-700 dark:text-slate-300 font-medium">{title}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
    </Link>
);


const ProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const user = auth.currentUser;

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

  return (
    <>
      <div className="p-4 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your account details and settings.</p>
        </header>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-4 flex items-center justify-center border-4 border-white dark:border-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-500 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{user?.displayName || 'Listener'}</h2>
              <p className="text-slate-500 dark:text-slate-400">{user?.phoneNumber}</p>
          </div>
        </div>

        {/* New Listener Guidelines Section */}
        <ListenerGuidelines />

        {/* Legal & Policies Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <h3 className="p-4 text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">Legal &amp; Policies</h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <PolicyLink title="Terms & Conditions" to="/terms" />
                <PolicyLink title="Privacy Policy" to="/privacy" />
            </div>
        </div>

        <div>
              <button 
                  onClick={handleLogout}
                  className="w-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-bold py-3 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                  <span>Logout</span>
              </button>
          </div>
      </div>
    </>
  );
};

export default ProfileScreen;