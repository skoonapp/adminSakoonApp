import React, { useState, useEffect, useRef } from 'react';
import { useListener } from '../context/ListenerContext';
import { db, storage, serverTimestamp } from '../utils/firebase';
import type { ListenerChatSession, ChatMessage } from '../types';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import { v4 as uuidv4 } from 'uuid';

// --- Icons ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;

const ChatScreen: React.FC = () => {
    const { profile } = useListener();
    const [sessions, setSessions] = useState<ListenerChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ListenerChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat sessions
    useEffect(() => {
        if (!profile?.uid) return;
        setLoadingSessions(true);
        const unsubscribe = db.collection('chats')
            .where('listenerId', '==', profile.uid)
            .orderBy('lastMessageTimestamp', 'desc')
            .onSnapshot(snapshot => {
                const sessionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ListenerChatSession[];
                setSessions(sessionsData);
                setLoadingSessions(false);
            }, () => setLoadingSessions(false));

        return () => unsubscribe();
    }, [profile?.uid]);

    // Fetch messages for active session
    useEffect(() => {
        if (!activeSession) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const unsubscribe = db.collection('chats').doc(activeSession.id).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const messagesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ChatMessage[];
                setMessages(messagesData);
                setLoadingMessages(false);
            });
        
        // Mark session as read
        db.collection('chats').doc(activeSession.id).update({ unreadByListener: false });

        return () => unsubscribe();
    }, [activeSession]);
    
    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!activeSession || !profile) return;
        const messageId = uuidv4();
        const newMessage: ChatMessage = {
            id: messageId,
            senderId: profile.uid,
            text,
            timestamp: serverTimestamp() as any, // Cast for local object
            status: 'sent',
            type: 'text'
        };
        
        const chatRef = db.collection('chats').doc(activeSession.id);
        
        await chatRef.collection('messages').doc(messageId).set(newMessage);
        await chatRef.update({
            lastMessageText: text,
            lastMessageTimestamp: serverTimestamp(),
            unreadByUser: true, // Assuming this field exists for user notifications
        });
    };

    const handleSendAudio = async (audioBlob: Blob, duration: number) => {
        if (!activeSession || !profile) return;
        const messageId = uuidv4();
        const audioRef = storage.ref(`chats/${activeSession.id}/${messageId}.webm`);
        await audioRef.put(audioBlob);
        const audioUrl = await audioRef.getDownloadURL();

        const newMessage: ChatMessage = {
            id: messageId,
            senderId: profile.uid,
            text: 'Voice message',
            timestamp: serverTimestamp() as any,
            status: 'sent',
            type: 'audio',
            audioUrl,
            duration: Math.round(duration)
        };
        
        const chatRef = db.collection('chats').doc(activeSession.id);
        
        await chatRef.collection('messages').doc(messageId).set(newMessage);
        await chatRef.update({
            lastMessageText: '🎤 Voice Message',
            lastMessageTimestamp: serverTimestamp(),
            unreadByUser: true,
        });
    };
    
    // --- Render Logic ---

    if (activeSession) {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
                {/* Header */}
                <header className="flex items-center p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm sticky top-16 z-10">
                    <button onClick={() => setActiveSession(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 mr-2"><BackIcon /></button>
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center mr-3"><UserIcon /></div>
                    <h2 className="font-bold text-slate-800 dark:text-slate-200">{activeSession.userName}</h2>
                </header>
                {/* Messages Area */}
                <main className="flex-grow p-3 overflow-y-auto">
                    {loadingMessages ? (
                        <div className="text-center p-10 text-slate-500">Loading messages...</div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === profile?.uid} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </main>
                {/* Input Area */}
                <footer className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    <ChatInput onSendText={handleSendMessage} onSendAudio={handleSendAudio} recentMessages={messages} />
                </footer>
            </div>
        );
    }
    
    return (
        <div className="p-4 space-y-4">
             <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Chats</h1>
                <p className="text-slate-500 dark:text-slate-400">Your recent conversations.</p>
            </header>
            {loadingSessions ? (
                 <div className="text-center py-10 text-slate-500">Loading chat sessions...</div>
            ) : sessions.length > 0 ? (
                <div className="space-y-2">
                    {sessions.map(session => (
                        <button key={session.id} onClick={() => setActiveSession(session)} className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                           <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center relative flex-shrink-0">
                               <UserIcon />
                               {session.unreadByListener && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-cyan-500 border-2 border-white dark:border-slate-800" />}
                           </div>
                           <div className="flex-grow overflow-hidden">
                                <p className={`font-bold text-slate-800 dark:text-slate-200 ${session.unreadByListener ? 'font-extrabold' : ''}`}>{session.userName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{session.lastMessageText}</p>
                           </div>
                        </button>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">No Chats Yet</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your chat history will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default ChatScreen;