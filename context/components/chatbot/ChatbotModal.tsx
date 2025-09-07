import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { CALL_RATE, CHAT_RATE, LISTENER_SHARE } from '../../../constants';

// --- Type Definitions ---
type MessageSender = 'user' | 'bot';
interface ChatMessage {
  id: number;
  text: string;
  sender: MessageSender;
  status: 'sent' | 'read';
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- SVG Icons ---
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91v.01c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.91-7.01A9.816 9.816 0 0 0 12.04 2z"/>
  </svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);
const SingleTickIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6L9 17l-5-5"/></svg>
);
const DoubleTickIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6L9 17l-5-5"/><path d="M15 6l-9 9"/></svg>
);

// --- AI Configuration ---
const listenerCallEarning = CALL_RATE * LISTENER_SHARE;
const listenerChatEarning = CHAT_RATE * LISTENER_SHARE;

const SYSTEM_INSTRUCTION = `You are a helpful and friendly AI admin assistant for SakoonApp. 
You are talking to a 'Listener' on the platform. Your goal is to answer their questions about the app.
Keep your answers concise and easy to understand.
Key information about listener earnings:
- For voice calls, a listener earns exactly ₹${listenerCallEarning.toFixed(2)} per minute.
- For chats, a listener earns exactly ₹${listenerChatEarning.toFixed(3)} per message they send.
When asked about earnings, ONLY state these final amounts. DO NOT mention gross rates, percentages, or how the earnings are calculated. Just give the final values.
For example, if a user asks "How much do I earn?", you should say "You earn ₹${listenerCallEarning.toFixed(2)} per minute for calls and ₹${listenerChatEarning.toFixed(3)} per message you send."
Do not mention you are an AI model. Behave like a knowledgeable admin.`;

let ai: GoogleGenAI | null = null;
try {
    const apiKey = process.env.API_KEY;
    // This check ensures that the key is not missing, empty, or the literal string "undefined".
    if (!apiKey || apiKey === "undefined" || apiKey.length < 30) {
        throw new Error("Gemini API Key is missing or invalid.");
    }
    ai = new GoogleGenAI({ apiKey });
} catch (e) {
    console.error("SakoonApp FATAL: Failed to initialize GoogleGenAI. Chatbot will be disabled.", e);
    ai = null;
}


// --- Main Component ---
const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<Chat | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (ai) {
        chatInstance.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { systemInstruction: SYSTEM_INSTRUCTION },
        });
        setMessages([
          { id: 1, text: "Hello! I'm the SakoonApp Admin assistant. How can I help you today?", sender: 'bot', status: 'read' }
        ]);
      } else {
        setMessages([
          { id: 1, text: "Sorry, the AI Support Chat is currently unavailable. Please contact support via WhatsApp.", sender: 'bot', status: 'read' }
        ]);
      }
    } else {
      chatInstance.current = null;
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input;
    const userMessage: ChatMessage = { id: Date.now(), text: userMessageText, sender: 'user', status: 'sent' };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (!ai || !chatInstance.current) {
      const errorMessage: ChatMessage = { id: Date.now() + 1, text: "I'm sorry, the support chat is currently offline. Please try again later.", sender: 'bot', status: 'read' };
      setMessages(prev => [...prev.map((m): ChatMessage => m.id === userMessage.id ? {...m, status: 'read'} : m), errorMessage]);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await chatInstance.current.sendMessage({ message: userMessageText });
      const botResponseText = response.text;
      const botMessage: ChatMessage = { id: Date.now() + 1, text: botResponseText, sender: 'bot', status: 'read' };
      
      setMessages(prev => {
        const updatedMessages = prev.map((msg): ChatMessage =>
          msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
        );
        return [...updatedMessages, botMessage];
      });

    } catch (error: any) {
      console.error("Gemini API error:", error);
      let errorMessageText = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      if (error?.message?.includes('API key not valid')) {
          errorMessageText = "It seems there's an issue with the API configuration. Please contact support.";
      }
      const errorMessage: ChatMessage = { id: Date.now() + 1, text: errorMessageText, sender: 'bot', status: 'read' };
      setMessages(prev => [...prev.map((m): ChatMessage => m.id === userMessage.id ? {...m, status: 'read'} : m), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="flex flex-col w-full h-full sm:w-[360px] sm:h-[90vh] sm:max-h-[700px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              <WhatsAppIcon className="w-6 h-6"/>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-200">SakoonApp Support</h2>
              <p className="text-xs text-green-600 dark:text-green-400">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            End chat
          </button>
        </header>

        {/* Chat Body */}
        <main className="flex-grow p-3 overflow-y-auto bg-slate-200/50 dark:bg-slate-800" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2.5 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-[#dcf8c6] dark:bg-green-900/80 text-slate-800 dark:text-slate-200 rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                   {msg.sender === 'user' && (
                     <div className="flex justify-end items-center mt-1 -mb-1">
                        <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">{new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.status === 'sent' ? <SingleTickIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <DoubleTickIcon className="w-4 h-4 text-blue-500" />}
                     </div>
                   )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm">
                      <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                      </div>
                  </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your query here.."
              className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full p-3 pl-4 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={!ai}
            />
            <button
              type="submit"
              className="w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors disabled:bg-slate-400"
              disabled={isLoading || !input.trim() || !ai}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatbotModal;