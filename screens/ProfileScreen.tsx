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
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 448 512">
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 439.6c-38.2 0-73.7-11.8-103.6-32.5l-7.4-4.4-77.1 20.3 20.7-75.2-4.9-7.8c-22.1-35.3-33.8-75.7-33.8-118.1 0-108.2 88.2-196.3 196.4-196.3 53 0 102.6 20.5 138.8 56.8 36.2 36.2 56.8 85.8 56.8 138.8-2.3 108.1-89.1 196.2-198.2 196.2zm101.7-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
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
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{profile?.displayName || 'Listener'}</h2>
              </div>
          </div>
        </div>,
        <div key="notifications" className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <h3 className="p-4 text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">Notification Settings</h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Incoming Call Notifications</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Play a ringtone for new calls.</p>
                    </div>
                    <ToggleSwitch checked={localSettings.calls} onChange={(v) => handleSettingsChange('calls', v)} disabled={loading} />
                </div>
                 <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">New Message Notifications</p>
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
        <div key="logout">
             <button onClick={handleLogout} className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                Logout
            </button>
        </div>
    ];

  return (
    <div className="p-4">
        {sections.map((section, index) => (
            <React.Fragment key={index}>
                {section}
                {index < sections.length - 1 && <hr className="my-6 border-transparent" />}
            </React.Fragment>
        ))}
    </div>
  );
};

export default ProfileScreen;