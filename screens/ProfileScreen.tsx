import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';
import ListenerGuidelines from '../context/components/profile/ListenerGuidelines';
import { useListener } from '../context/ListenerContext';
import { TermsContent } from './TermsScreen';
import { PrivacyPolicyContent } from './PrivacyPolicyScreen';


// --- Reusable Accordion Component ---
const ChevronDownIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                aria-expanded={isOpen}
            >
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                <ChevronDownIcon isOpen={isOpen} className="text-slate-500 dark:text-slate-400" />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 prose prose-slate dark:prose-invert max-w-4xl mx-auto">
                   {children}
                </div>
            </div>
        </div>
    );
};


const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${checked ? 'bg-primary-600' : 'bg-slate-400 dark:bg-slate-600'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        aria-checked={checked}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const WhatsAppIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.48 3.4 1.27 4.88L2 22l5.29-1.38c1.39.71 2.99 1.14 4.75 1.14c5.46 0 9.91-4.45 9.91-9.85c0-5.46-4.45-9.9-9.91-9.9zM12.04 20.13c-1.56 0-3.03-.4-4.31-1.18l-.31-.18l-3.21.84l.85-3.13l-.2-.32c-.85-1.34-1.31-2.91-1.31-4.58c0-4.49 3.62-8.12 8.12-8.12c4.49 0 8.12 3.63 8.12 8.12c0 4.49-3.63 8.12-8.12 8.12zm4.18-5.32c-.22-.11-1.3-.65-1.5-.72c-.2-.07-.35-.11-.49.11c-.15.22-.57.72-.7 1.05c-.13.11-.25.13-.49.02c-.23-.11-1-.37-1.9-1.18c-.71-.63-1.18-1.41-1.32-1.65c-.13-.25-.01-.38.1-.5c.1-.11.22-.28.33-.42c.11-.13.15-.22.22-.38c.07-.15.04-.28-.02-.39c-.07-.11-.49-1.18-.68-1.61c-.18-.43-.37-.37-.49-.37c-.12 0-.25-.01-.38-.01c-.13 0-.35.05-.53.22c-.18.18-.7.68-.7 1.66c0 .98.72 1.93.82 2.07c.1.15 1.41 2.15 3.43 3.01c.48.21.87.33 1.16.42c.5.15 1 .13 1.38-.08c.43-.25.7-.57.8-1.1c.1-.53.1-.98.07-1.1c-.04-.12-.16-.18-.34-.29z" />
    </svg>
);


const ProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const { profile, loading } = useListener();
    const isInitialLoad = useRef(true);

    const [localSettings, setLocalSettings] = useState({
        calls: true,
        messages: true,
    });

    useEffect(() => {
        // This effect syncs the local state with the listener profile's settings
        // ONLY ON THE INITIAL LOAD. This prevents optimistic UI updates from being
        // overwritten by the profile data before Firestore has had time to update.
        if (profile?.notificationSettings && isInitialLoad.current) {
            setLocalSettings({
                calls: profile.notificationSettings.calls ?? true,
                messages: profile.notificationSettings.messages ?? true,
            });
            isInitialLoad.current = false;
        }
    }, [profile]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };
    
    const handleSettingsChange = async (key: 'calls' | 'messages', value: boolean) => {
        if (!profile?.uid) return;

        // Optimistic UI update
        setLocalSettings(prev => ({ ...prev, [key]: value }));

        try {
            const listenerRef = db.collection('listeners').doc(profile.uid);
            await listenerRef.update({
                [`notificationSettings.${key}`]: value
            });
        } catch (error) {
            console.error(`Failed to update ${key} notification setting:`, error);
            // Revert UI on failure and notify user
            setLocalSettings(prev => ({ ...prev, [key]: !value }));
            alert(`Could not save setting for ${key}. Please try again.`);
        }
    };

    const sections = [
        <div key="profile" className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{profile?.displayName || 'Listener'}</h2>
                </div>
              </div>
              <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                Logout
              </button>
          </div>
        </div>,
        <div key="notifications" className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <h3 className="p-4 text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">Notification Settings</h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Incoming Call Ringtones</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Play a sound for new calls.</p>
                    </div>
                    <ToggleSwitch checked={localSettings.calls} onChange={(v) => handleSettingsChange('calls', v)} disabled={loading} />
                </div>
                 <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">New Message Sounds</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Play a sound for new messages.</p>
                    </div>
                    <ToggleSwitch checked={localSettings.messages} onChange={(v) => handleSettingsChange('messages', v)} disabled={loading} />
                </div>
            </div>
        </div>,
        <div key="support" className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <a href="https://chat.whatsapp.com/FDgBcmlnuBUFeuSSdy4Yhy?mode=ems_copy_c" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><WhatsAppIcon className="w-6 h-6" /></div>
                    <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Join WhatsApp Support Group</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400">For help, questions, and updates.</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </a>
        </div>,
        <ListenerGuidelines key="guidelines" />,
        <Accordion key="terms" title="Terms & Conditions"><TermsContent /></Accordion>,
        <Accordion key="privacy" title="Privacy Policy"><PrivacyPolicyContent /></Accordion>,
    ];

  return (
    <div className="p-4 space-y-4">
        {sections.map((section) => section)}
    </div>
  );
};

export default ProfileScreen;