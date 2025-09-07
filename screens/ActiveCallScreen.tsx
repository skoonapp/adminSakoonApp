import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListener } from '../context/ListenerContext';
import { fetchZegoToken } from '../utils/zego';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';

const ActiveCallScreen: React.FC = () => {
    const { callId } = useParams<{ callId: string }>();
    const navigate = useNavigate();
    const { profile } = useListener();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const zegoContainerRef = useRef<HTMLDivElement | null>(null);
    const callStartTime = useRef<Date | null>(null);

    // Effect to initialize the Zego call client
    useEffect(() => {
        if (!profile || !callId || !zegoContainerRef.current) {
            return;
        }

        let zp: any; // ZegoUIKitPrebuilt instance

        const initZego = async () => {
            try {
                if (!window.ZegoUIKitPrebuilt) {
                    throw new Error('Call service is currently unavailable. Please try again later.');
                }
                
                setIsLoading(true);
                setError(null);
                const token = await fetchZegoToken(callId);
                
                zp = window.ZegoUIKitPrebuilt.create(token);
                
                zp.joinRoom({
                    container: zegoContainerRef.current,
                    sharedLinks: [
                        {
                            name: 'Copy call link',
                            url: window.location.href,
                        },
                    ],
                    scenario: {
                        mode: window.ZegoUIKitPrebuilt.OneONoneCall,
                    },
                    showScreenSharingButton: false,
                    showPreJoinView: false,
                    turnOnMicrophoneWhenJoining: true,
                    turnOnCameraWhenJoining: true,
                    onLeaveRoom: () => handleCallEnd(),
                    onUserLeave: () => handleCallEnd(),
                });
                
                setIsLoading(false);
                callStartTime.current = new Date();
                
                // Mark call as 'answered'
                await db.collection('calls').doc(callId).update({ 
                    status: 'answered',
                    startTime: firebase.firestore.FieldValue.serverTimestamp() 
                });

            } catch (err: any) {
                console.error("Error initializing Zego:", err);
                setError(err.message || 'Failed to connect to the call.');
                setIsLoading(false);
                
                // Mark call as missed if listener fails to join
                 await db.collection('calls').doc(callId).update({ status: 'missed' });
            }
        };

        initZego();

        return () => {
            // Cleanup on component unmount
            if (zp) {
                zp.destroy();
            }
        };
    }, [profile, callId, navigate]);

    const handleCallEnd = async () => {
        if (callStartTime.current) {
            const endTime = new Date();
            const durationSeconds = Math.round((endTime.getTime() - callStartTime.current.getTime()) / 1000);

            // Update call record in Firestore with end time and duration
            try {
                 await db.collection('calls').doc(callId).update({
                    status: 'completed',
                    endTime: firebase.firestore.Timestamp.fromDate(endTime),
                    durationSeconds: durationSeconds,
                });
            } catch (error) {
                console.error("Failed to update call record on completion:", error);
            }
            callStartTime.current = null; // Prevent multiple updates
        }
        
        console.log("Call ended or user left. Navigating to dashboard.");
        navigate('/dashboard');
    };

    if (error) {
        return (
            <div className="min-h-screen bg-red-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">Connection Error</h1>
                <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-900 text-white relative">
            {isLoading && (
                 <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg">Connecting to call...</p>
                 </div>
            )}
            <div ref={zegoContainerRef} className="w-full h-screen" />
        </div>
    );
};

export default ActiveCallScreen;
