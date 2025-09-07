import React, { useState, useEffect, useRef } from 'react';
import { useListener } from '../context/ListenerContext';
import { db, storage, serverTimestamp } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { ListenerChatSession, ChatMessage } from '../types';
import ChatInput from '../context/components/chat/ChatInput';
import MessageBubble from '../context/components/chat/MessageBubble';
import { v4 as uuidv4 } from 'uuid'; // For unique message IDs

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-2.292.917a11.042 11.042 0 005.442 5.442l.917-2.292a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5h-1.5A11.5 11.5 0 013.5 6H5a1.5 1.5 0 011.5-1.5H2z" clipRule="evenodd" />
    </svg>
);

const ChatScreen: React.FC = () => {
    const { profile } = useListener();
    const [sessions, setSessions] = useState<ListenerChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Fetch chat sessions for the listener
    useEffect(() => {
        if (!profile) return;
        setLoadingSessions(true);
        const unsubscribe = db.collection('chats')
            .where('listenerId', '==', profile.uid)
            .orderBy('lastMessageTimestamp', 'desc')
            .onSnapshot(querySnapshot => {
                const sessionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ListenerChatSession));
                setSessions(sessionsData);
                setLoadingSessions(false);
            }, () => setLoadingSessions(false));
        
        return () => unsubscribe();
    }, [profile]);

    // Fetch messages for the selected session
    useEffect(() => {
        if (!selectedSessionId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const unsubscribe = db.collection('chats').doc(selectedSessionId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(querySnapshot => {
                const messagesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage));
                setMessages(messagesData);
                setLoadingMessages(false);

                // Mark messages from user as read
                if (profile) {
                    const batch = db.batch();
                    messagesData.forEach(msg => {
                        if (msg.senderId !== profile.uid && msg.status !== 'read') {
                            const msgRef = db.collection('chats').doc(selectedSessionId).collection('messages').doc(msg.id);
                            batch.update(msgRef, { status: 'read' });
                        }
                    });
                    batch.commit().catch(console.error);
                }
            }, () => setLoadingMessages(false));

        return () => unsubscribe();
    }, [selectedSessionId, profile]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Abstract message sending logic
    const sendMessage = async (messageData: Partial<ChatMessage>) => {
        if (!selectedSessionId || !profile) return;

        const messageId = uuidv4();
        const finalMessage: Omit<ChatMessage, 'id'> = {
            senderId: profile.uid,
            timestamp: serverTimestamp() as firebase.firestore.Timestamp,
            status: 'sent',
            text: messageData.text || '',
            type: messageData.type || 'text',
            ...messageData,
        };

        const chatRef = db.collection('chats').doc(selectedSessionId);
        const messageRef = chatRef.collection('messages').doc(messageId);

        await messageRef.set(finalMessage);
        await chatRef.update({
            lastMessageText: finalMessage.type === 'audio' ? '🎤 Voice Message' : finalMessage.text,
            lastMessageTimestamp: finalMessage.timestamp,
        });
    };

    const handleSendTextMessage = (text: string) => {
        sendMessage({ text, type: 'text' });
    };

    const handleSendAudioMessage = async (audioBlob: Blob, duration: number) => {
        if (!selectedSessionId) return;
        const filePath = `chats/${selectedSessionId}/${uuidv4()}.webm`;
        const fileRef = storage.ref(filePath);
        await fileRef.put(audioBlob);
        const audioUrl = await fileRef.getDownloadURL();
        sendMessage({ type: 'audio', audioUrl, duration });
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="flex h-full bg-white dark:bg-slate-900">
            {/* Session List */}
            <aside className="w-full md:w-1/3 h-full border-r border-slate-200 dark:border-slate-800 flex-col md:flex" style={{ display: selectedSessionId ? 'none' : 'flex' }}>
                <header className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Conversations</h1>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {loadingSessions ? <p className="p-4 text-slate-500">Loading...</p> :
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`flex items-center gap-3 p-3 cursor-pointer border-l-4 ${selectedSessionId === session.id ? 'border-cyan-500 bg-slate-100 dark:bg-slate-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <img src={session.userAvatar || `https://api.dicebear.com/8.x/initials/svg?seed=${session.userName}`} alt={session.userName} className="w-12 h-12 rounded-full"/>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{session.userName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{session.lastMessageText}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </aside>

            {/* Message View */}
            <main className="w-full md:w-2/3 h-full flex-col md:flex" style={{ display: selectedSessionId ? 'flex' : 'none' }}>
                {selectedSessionId && selectedSession ? (
                    <>
                        <header className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                             <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedSessionId(null)} className="md:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <img src={selectedSession.userAvatar || `https://api.dicebear.com/8.x/initials/svg?seed=${selectedSession.userName}`} alt={selectedSession.userName} className="w-10 h-10 rounded-full"/>
                                <div>
                                    <h2 className="font-bold text-slate-800 dark:text-slate-200">{selectedSession.userName}</h2>
                                </div>
                            </div>
                            <button className="p-2 rounded-full text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-slate-700">
                               <PhoneIcon className="w-6 h-6" />
                            </button>
                        </header>
                        
                        <div 
                           className="flex-grow p-4 overflow-y-auto bg-slate-100/50 dark:bg-slate-950"
                           style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="a" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40V0h40" fill="none" stroke="%23d1d5db" stroke-width=".5" opacity=".3"/></pattern></defs><rect width="400" height="400" fill="url(%23a)"/></svg>')`}}
                        >
                           {loadingMessages ? <p className="text-center text-slate-500">Loading messages...</p> :
                                messages.map(msg => (
                                    <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === profile?.uid} />
                                ))
                           }
                           <div ref={messagesEndRef} />
                        </div>
                        
                        <footer className="p-2 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                           <ChatInput onSendText={handleSendTextMessage} onSendAudio={handleSendAudioMessage} />
                        </footer>
                    </>
                ) : (
                    <div className="hidden md:flex flex-grow items-center justify-center text-slate-500">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="mt-4 text-lg">Select a conversation to start chatting.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatScreen;
