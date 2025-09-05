import React, { useState, useEffect, useRef } from 'react';
import { useListener } from '../context/ListenerContext';
import { db, serverTimestamp } from '../utils/firebase';
import firebase from 'firebase/compat/app';

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  lastMessageText: string;
  lastMessageTimestamp: firebase.firestore.Timestamp;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: firebase.firestore.Timestamp;
}

const ChatScreen: React.FC = () => {
    const { profile } = useListener();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!profile) return;
        setLoadingSessions(true);
        const unsubscribe = db.collection('chats')
            .where('listenerId', '==', profile.uid)
            .orderBy('lastMessageTimestamp', 'desc')
            .onSnapshot(querySnapshot => {
                const sessionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
                setSessions(sessionsData);
                setLoadingSessions(false);
            }, () => setLoadingSessions(false));
        
        return () => unsubscribe();
    }, [profile]);

    useEffect(() => {
        if (!selectedSessionId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        const unsubscribe = db.collection('chats').doc(selectedSessionId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(querySnapshot => {
                const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                setMessages(messagesData);
                setLoadingMessages(false);
            }, () => setLoadingMessages(false));

        return () => unsubscribe();
    }, [selectedSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedSessionId || !profile) return;

        const messageText = newMessage;
        setNewMessage('');

        const messageData = {
            text: messageText,
            senderId: profile.uid,
            timestamp: serverTimestamp(),
        };

        const chatRef = db.collection('chats').doc(selectedSessionId);
        await chatRef.collection('messages').add(messageData);
        await chatRef.update({
            lastMessageText: messageText,
            lastMessageTimestamp: serverTimestamp(),
        });
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="flex h-full">
            {/* Session List */}
            <aside className="w-1/3 h-full border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Conversations</h1>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {loadingSessions ? <p className="p-4 text-slate-500">Loading...</p> :
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`p-4 cursor-pointer border-l-4 ${selectedSessionId === session.id ? 'border-primary-500 bg-slate-100 dark:bg-slate-700/50' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                            >
                                <p className="font-bold text-slate-800 dark:text-slate-200">{session.userName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{session.lastMessageText}</p>
                            </div>
                        ))
                    }
                </div>
            </aside>

            {/* Message View */}
            <main className="w-2/3 h-full flex flex-col">
                {selectedSessionId && selectedSession ? (
                    <>
                        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                            <div>
                                <h2 className="font-bold text-slate-800 dark:text-slate-200">{selectedSession.userName}</h2>
                            </div>
                        </header>
                        <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-transparent">
                           {loadingMessages ? <p className="text-center text-slate-500">Loading messages...</p> :
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex my-2 ${msg.senderId === profile?.uid ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.senderId === profile?.uid ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-600 rounded-bl-none'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                           }
                           <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-4 bg-white dark:bg-slate-900/80 dark:backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Send</button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500">
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatScreen;