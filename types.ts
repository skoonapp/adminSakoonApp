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
  // FIX: Add notificationSettings to ListenerProfile to resolve type errors in ProfileScreen.tsx.
  notificationSettings?: {
    calls?: boolean;
    messages?: boolean;
  };
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

// Represents a record of an earning transaction for a listener
export interface EarningRecord {
  id: string; // The document ID from the earnings subcollection
  callId: string; // The ID of the call that generated this earning
  amount: number;
  timestamp: Timestamp;
  userId: string; // The user who was in the call
  userName: string;
}

// Data structure for listener earnings
export interface Earnings {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  last7Days: { date: string, amount: number }[];
}

// Data model for a post in the community feed
export interface CommunityPost {
  id: string; // The document ID
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  imageUrl?: string;
  timestamp: Timestamp;
  likeCount: number;
  commentCount: number;
}

// Represents a comment on a community post
export interface PostComment {
  id: string; // The document ID
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  timestamp: Timestamp;
}