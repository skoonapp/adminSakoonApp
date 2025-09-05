import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Use namespace import for react-router-dom to fix module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
import { db, serverTimestamp } from '../utils/firebase';
import { fetchZegoToken } from '../utils/zego';
import type { CallRecord } from '../types';

// ZegoUIKitPrebuilt is loaded from a script tag in index.html
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

// --- SVG Icons ---
const MicOnIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v.5a5.25 5.25 0 0010.5 0v-.5a.75.75 0 011.5 0v.5a6.75 6.75 0 01-13.5 0v-.5a.75.75 0 01.75-.75z" />
    </svg>
);

const MicOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.5 7.5a3.75 3.75 0 10-7.5 0v4.125c0 .359.043.71.124 1.052l-2.003-2.003a.75.75 0 00-1.06 1.06l10.5 10.5a.75.75 0 001.06-1.06L8.18 10.251A3.743 3.743 0 008.25 10V7.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v.5a5.25 5.25 0 004.426 5.176l-2.133-2.133a.75.75 0 00-1.061 1.06l3.36 3.359a.75.75 0 001.06 0l2.122-2.122a.75.75 0 00-1.06-1.061l-1.09.091a5.25 5.25 0 004.28-4.437v-.5a.75.75 0 011.5 0v.5a6.75 6.75 0 01-12.016-3.868l.016.002z" />
    </svg>
);

const EndCallIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);

const PlaceholderAvatar: React.FC<{className?: string}> = ({className}) => (
    <div className={`flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3/5 h-3/5 text-slate-400 dark:text-slate-500">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    </div>
);

const NetworkQualityIndicator: React.FC<{ quality: number }> = ({ quality }) => {
    const getQualityInfo = () => {
        switch (quality) {
            case 0: return { text: 'Unknown', color: 'bg-slate-500', textColor: 'text-slate-300', bars: 0 };
            case 1: return { text: 'Excellent', color: 'bg-green-500', textColor: 'text-green-300', bars: 4 };
            case 2: return { text: 'Good', color: 'bg-green-400', textColor: 'text-green-300', bars: 3 };
            case 3: return { text: 'Average', color: 'bg-yellow-500', textColor: 'text-yellow-300', bars: 2 };
            case 4: return { text: 'Poor', color: 'bg-red-500', textColor: 'text-red-400', bars: 1 };
            case 5: return { text: 'Very Poor', color: 'bg-red-500', textColor: 'text-red-400', bars: 1 };
            default: return { text: 'Connecting...', color: 'bg-slate-500', textColor: 'text-slate-300', bars: 0 };
        }
    };

    const { text, color, textColor, bars } = getQualityInfo();

    return (
        <div className="bg-black/25 backdrop-blur-sm flex items-center gap-3 px-4 py-2 rounded-full border border-white/10" title={`Network: ${text}`}>
            <div className="flex items-end h-5 w-5 gap-1">
                <span className={`h-2 w-1 rounded-sm transition-all duration-300 ${bars >= 1 ? color : 'bg-slate-600'}`}></span>
                <span className={`h-3 w-1 rounded-sm transition-all duration-300 ${bars >= 2 ? color : 'bg-slate-600'}`}></span>
                <span className={`h-4 w-1 rounded-sm transition-all duration-300 ${bars >= 3 ? color : 'bg-slate-600'}`}></span>
                <span className={`h-5 w-1 rounded-sm transition-all duration-300 ${bars >= 4 ? color : 'bg-slate-600'}`}></span>
            </div>
            <span className={`text-sm font-bold ${textColor}`}>{text}</span>
        </div>
    );
};

const ActiveCallScreen: React.FC = () => {
    const { callId } = ReactRouterDOM.useParams<{ callId: string }>();
    const navigate = ReactRouterDOM.useNavigate();
    const zpInstanceRef = useRef<any>(null);
    const hasLeftRef = useRef(false);

    const [callData, setCallData] = useState<CallRecord | null>(null);
    const [status, setStatus] = useState<'loading' | 'connecting' | 'connected' | 'error' | 'ended'>('loading');
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [networkQuality, setNetworkQuality] = useState(-1); // -1 for initial state

    const handleLeave = useCallback(async () => {
        if (hasLeftRef.current || !callId) return;
        hasLeftRef.current = true;
        setStatus('ended');

        try {
            const callRef = db.collection('calls').doc(callId);
            await callRef.update({
                status: 'completed',
                endTime: serverTimestamp(),
                durationSeconds: callDuration
            });
        } catch (error) {
            console.error("Failed to update call document on leave:", error);
        } finally {
            navigate('/dashboard');
        }
    }, [callId, callDuration, navigate]);

    const endCall = useCallback(() => {
        if (zpInstanceRef.current) {
            zpInstanceRef.current.destroy();
        } else {
            handleLeave();
        }
    }, [handleLeave]);

    useEffect(() => {
        if (!callId) {
            setStatus('error');
            return;
        }
        const callRef = db.collection('calls').doc(callId);
        const unsubscribe = callRef.onSnapshot(async (doc) => {
            if (doc.exists) {
                const data = doc.data() as CallRecord;
                setCallData(data);
                if (data.status === 'initiated') {
                    await callRef.update({ status: 'answered' });
                }
            } else {
                setStatus('error');
            }
        }, () => setStatus('error'));

        return () => unsubscribe();
    }, [callId]);
    
    useEffect(() => {
        let timerInterval: number;
        if (status === 'connected') {
            timerInterval = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => window.clearInterval(timerInterval);
    }, [status]);
    
    useEffect(() => {
        if (!callData || !callId || status !== 'loading') return;

        let isMounted = true;
        const initZego = async () => {
            if (!isMounted) return;
            setStatus('connecting');
            try {
                const kitToken = await fetchZegoToken(callId);
                if (!isMounted) return;
                const zp = window.ZegoUIKitPrebuilt.create(kitToken);
                zpInstanceRef.current = zp;

                zp.joinRoom({
                    container: document.createElement('div'),
                    scenario: { mode: window.ZegoUIKitPrebuilt.VoiceCall },
                    showPreJoinView: false,
                    showScreenSharingButton: false,
                    showMyCameraToggleButton: false,
                    onLeaveRoom: handleLeave,
                    onUserJoin: () => { if (isMounted) setStatus('connected'); },
                    onUserLeave: () => { if (isMounted) endCall(); },
                    onNetworkQuality: (_roomID: string, stats: { downlinkQualityLevel: number }) => {
                        if (isMounted) {
                           setNetworkQuality(stats.downlinkQualityLevel);
                        }
                    },
                });
                if (isMounted && zp.getRemoteUsers().length > 0) {
                    setStatus('connected');
                }
            } catch (error) {
                console.error("Zego initialization failed", error);
                if (isMounted) setStatus('error');
            }
        };
        initZego();

        return () => {
            isMounted = false;
            if (zpInstanceRef.current) {
                zpInstanceRef.current.destroy();
                zpInstanceRef.current = null;
            }
        };
    }, [callData, callId, status, handleLeave, endCall]);

    const toggleMute = () => {
        if (!zpInstanceRef.current) return;
        const newMutedState = !isMuted;
        zpInstanceRef.current.muteMicrophone(newMutedState);
        setIsMuted(newMutedState);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const getStatusText = () => {
        switch(status) {
            case 'loading': return 'Loading call...';
            case 'connecting': return 'Connecting...';
            case 'connected': return formatTime(callDuration);
            case 'error': return 'Connection Failed';
            case 'ended': return 'Call Ended';
        }
    };

    if (status === 'loading' || !callData) {
        return <div className="fixed inset-0 bg-slate-900 text-white flex items-center justify-center"><p>Loading Call...</p></div>
    }

    return (
        <div 
            className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-between p-8 z-50"
            style={{
                backgroundImage: `url(${callData.userAvatar || ''})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center flex-grow">
                <div className="relative mb-6">
                    {(status === 'connecting') && <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse-ring"></div>}
                    {callData.userAvatar ? 
                        <img src={callData.userAvatar} alt={callData.userName} className="w-40 h-40 rounded-full object-cover shadow-2xl border-4 border-white/20"/> :
                        <PlaceholderAvatar className="w-40 h-40 shadow-2xl border-4 border-white/20" />
                    }
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>{callData.userName || 'User'}</h1>
                 <div className="flex flex-col items-center gap-4 mt-4">
                    <p className="text-5xl text-white transition-opacity duration-300 font-mono tracking-wider" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                        {getStatusText()}
                    </p>
                    {status === 'connected' && <NetworkQualityIndicator quality={networkQuality} />}
                </div>
            </div>
            <div className="relative z-10 w-full max-w-sm flex justify-around items-center mb-4">
                 <button 
                    onClick={toggleMute}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white text-slate-800' : 'bg-white/20 text-white'}`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOffIcon className="w-8 h-8"/> : <MicOnIcon className="w-8 h-8"/>}
                </button>
                <button 
                    onClick={endCall}
                    disabled={status === 'ended'}
                    className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center"
                    aria-label="End Call"
                >
                    <EndCallIcon className="w-10 h-10" />
                </button>
                <div className="w-20 h-20"></div>
            </div>
        </div>
    );
};

export default ActiveCallScreen;
