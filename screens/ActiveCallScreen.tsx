import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListener } from '../context/ListenerContext';
import { db } from '../utils/firebase';
import { fetchZegoToken } from '../utils/zego';
import type { CallRecord } from '../types';

// --- Icons ---
const EndCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 17.657A8 8 0 016.343 6.343m11.314 0A8 8 0 016.343 17.657m0-11.314L6.343 6.343m11.314 11.314L17.657 17.657" /></svg>;
const ConnectingIcon = () => <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;


const ActiveCallScreen: React.FC = () => {
    const { callId } = useParams<{ callId: string }>();
    const navigate = useNavigate();
    const { profile } = useListener();
    const zegoContainerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'loading' | 'connecting' | 'connected' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [callDetails, setCallDetails] = useState<{ userName?: string }>({});
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        if (!callId || !profile || !zegoContainerRef.current) {
            if (!profile) setStatus('error');
            return;
        }

        let zp: any = null; // ZegoUIKitPrebuilt instance
        const initZego = async () => {
            try {
                setStatus('connecting');
                
                // Fetch call details to display user name and check if it's a new user
                const callDoc = await db.collection('calls').doc(callId).get();
                if (callDoc.exists) {
                    const callData = callDoc.data() as CallRecord;
                    setCallDetails({ userName: callData.userName });

                    // Check for prior completed calls with this user
                    if (callData.userId) {
                        const priorCallsQuery = db.collection('calls')
                            .where('listenerId', '==', profile.uid)
                            .where('userId', '==', callData.userId)
                            .where('status', '==', 'completed')
                            .limit(1);
                        
                        const priorCallsSnapshot = await priorCallsQuery.get();
                        if (priorCallsSnapshot.empty) {
                            setIsNewUser(true);
                        }
                    }
                }

                const token = await fetchZegoToken(callId);
                
                zp = window.ZegoUIKitPrebuilt.create(token);

                zp.joinRoom({
                    container: zegoContainerRef.current,
                    scenario: {
                        mode: window.ZegoUIKitPrebuilt.OneONoneCall,
                    },
                    showPreJoinView: false,
                    onLeaveRoom: () => {
                        navigate('/dashboard');
                    },
                    onUserLeave: () => {
                        // The call might be over, hang up and redirect.
                        zp?.destroy();
                        navigate('/dashboard', { replace: true });
                    },
                    turnOnCameraWhenJoining: false,
                    turnOnMicrophoneWhenJoining: true,
                    showAudioMuteButton: true,
                    showVideoMuteButton: false, // Voice call only
                    showScreenSharingButton: false,
                });
                setStatus('connected');
            } catch (err: any) {
                console.error("Zego initialization failed:", err);
                setError(err.message || 'Failed to connect to the call.');
                setStatus('error');
            }
        };

        initZego();
        
        return () => {
            // Cleanup on component unmount
            if (zp) {
                zp.destroy();
            }
        };

    }, [callId, profile, navigate]);

    const handleHangUp = () => {
        // Here you would also update the call status in Firestore to 'completed' or 'rejected_by_listener'
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className={`min-h-screen text-white flex flex-col transition-colors duration-500 ${isNewUser ? 'bg-new-user-gradient animate-gradient-flow' : 'bg-slate-900'}`}>
             {/* Header Section */}
            <div className={`p-4 text-center ${isNewUser ? 'bg-white/10' : 'bg-black/30'}`}>
                <h1 className="text-2xl font-bold">{callDetails.userName || 'Connecting...'}</h1>
                <p className="text-slate-300">Active Call</p>
            </div>
            
            {isNewUser && (
                <div className="absolute top-20 right-4 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-fade-in z-20">
                    ✨ New Caller
                </div>
            )}


            {/* Main Content Area */}
            <div className="flex-grow relative">
                {/* Zego UI container */}
                <div ref={zegoContainerRef} className="w-full h-full" />
                
                {/* Overlay for loading/error states */}
                {(status === 'connecting' || status === 'error') && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                        {status === 'connecting' && (
                            <>
                                <ConnectingIcon />
                                <p className="mt-4 text-lg">Connecting your call...</p>
                                {isNewUser && <p className="mt-2 text-yellow-300">Say hello to a new user!</p>}
                            </>
                        )}
                         {status === 'error' && (
                            <>
                                <p className="text-lg text-red-400">Connection Failed</p>
                                <p className="text-slate-300 mt-2">{error}</p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-full"
                                >
                                    Go to Dashboard
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Footer / Controls Section - only show hang up if Zego hasn't rendered its own */}
            {status !== 'connected' && (
                 <div className="p-4 bg-black/30 flex justify-center">
                    <button
                        onClick={handleHangUp}
                        className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
                        aria-label="End Call"
                    >
                       <EndCallIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActiveCallScreen;