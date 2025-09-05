import React, { useEffect } from 'react';
// FIX: Use namespace import for react-router-dom to fix module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
import { messaging, db } from '../../../utils/firebase';
import { useListener } from '../../ListenerContext';
import firebase from 'firebase/compat/app';

const IncomingCallManager: React.FC = () => {
  const { profile } = useListener();
  const navigate = ReactRouterDOM.useNavigate();

  useEffect(() => {
    if (!messaging || !profile) {
      return;
    }

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          const currentToken = await messaging.getToken({
            vapidKey: 'BDS6yZUIoOU5Kz0I1XVbNlO3p_e-1G2yF2P2aKsoj1Z2t3hfkq_pKztz8G1-vlnQLtXklqP7wy28b7XhGchpWJI', // Replace with your VAPID key
          });
          
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Save the token to the listener's profile if it's not already there
            const listenerRef = db.collection('listeners').doc(profile.uid);
            await listenerRef.update({
                fcmTokens: firebase.firestore.FieldValue.arrayUnion(currentToken)
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    setupNotifications();

    // Handle foreground messages
    const unsubscribe = messaging.onMessage((payload) => {
      console.log('Message received in foreground. ', payload);
      const { type, userName, callId } = payload.data || {};

      if (type === 'incoming_call') {
        const isConfirmed = window.confirm(
          `${userName || 'A user'} is calling. Do you want to accept?`
        );
        if (isConfirmed && callId) {
          navigate(`/call/${callId}`);
        } else {
          // TODO: Implement call rejection logic
          console.log('Call rejected by listener from foreground prompt.');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [profile, navigate]);

  return null; // This component does not render anything itself.
};

export default IncomingCallManager;