import React, { useState, useEffect } from 'react';
import { useListener } from '../../ListenerContext';
import { db } from '../../../utils/firebase';
import firebase from 'firebase/compat/app';

interface Notification {
    id: string;
    title: string;
    body: string;
    timestamp: firebase.firestore.Timestamp;
    read: boolean;
    link?: string; // Optional link to navigate to
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper to format time since notification
const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
    <div className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <div className="flex items-start gap-3">
            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" aria-label="Unread"></div>}
            <div className={`w-full ${!notification.read ? '' : 'pl-5'}`}>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{notification.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{notification.body}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(notification.timestamp.toDate())}</p>
            </div>
        </div>
    </div>
);

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
    const { profile } = useListener();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.uid) return;

        setLoading(true);
        const unsubscribe = db.collection('listeners').doc(profile.uid).collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                setNotifications(notifs);
                setLoading(false);
            }, (error) => {
                 console.error("Error fetching notifications:", error);
                 setLoading(false);
            });

        return () => unsubscribe();
    }, [profile?.uid]);

    useEffect(() => {
        // Mark notifications as read when panel is opened
        if (isOpen && notifications.some(n => !n.read) && profile?.uid) {
            const batch = db.batch();
            const unreadNotifs = notifications.filter(n => !n.read);
            
            unreadNotifs.forEach(notif => {
                const notifRef = db.collection('listeners').doc(profile!.uid).collection('notifications').doc(notif.id);
                batch.update(notifRef, { read: true });
            });

            batch.commit().catch(err => console.error("Failed to mark notifications as read", err));
        }
    }, [isOpen, notifications, profile?.uid]);


    if (!isOpen) return null;

    return (
        <div className="absolute top-14 right-0 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in z-50">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                <button onClick={onClose} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Close</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <p className="p-4 text-center text-slate-500 dark:text-slate-400">Loading...</p>
                ) : notifications.length > 0 ? (
                    notifications.map(notif => <NotificationItem key={notif.id} notification={notif} />)
                ) : (
                    <div className="p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-5-5.917V5a2 2 0 10-4 0v.083A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <h4 className="mt-2 font-semibold text-slate-700 dark:text-slate-300">All caught up!</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">You have no new notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
