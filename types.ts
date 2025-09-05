import { Timestamp } from 'firebase/firestore';

// Core data model for the logged-in Listener
export type ListenerStatus = 'Available' | 'Busy' | 'Break' | 'Offline';

export interface ListenerProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  age: number;
  bio: string;
  status: ListenerStatus;
  fcmTokens?: string[];
  createdAt: Timestamp;
}

// Represents the end-user who is calling/chatting
export interface Caller {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

// Represents a message within a chat session
export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    uid: string;
    name: string;
  };
  timestamp: number;
  status?: 'sent' | 'read';
}

// A record of a call, stored in Firestore
export interface CallRecord {
  callId: string;
  listenerId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationSeconds?: number;
  earnings?: number;
  userRating?: 1 | 2 | 3 | 4 | 5;
  status: 'initiated' | 'answered' | 'completed' | 'missed' | 'rejected';
}

// Represents a chat session from the listener's perspective, stored in Firestore
export interface ListenerChatSession {
  id: string; // The document ID
  listenerId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  lastMessageText: string;
  lastMessageTimestamp: Timestamp;
}


// Data structure for listener earnings
export interface Earnings {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  last7Days: { date: string, amount: number }[];
}
