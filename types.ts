import type firebase from 'firebase/compat/app';

// The status of a listener, controlling their availability for calls.
export type ListenerStatus = 'Available' | 'Busy' | 'Offline' | 'Break';

// Represents the main profile document for a listener in Firestore.
export interface ListenerProfile {
  uid: string;
  displayName: string;
  status: ListenerStatus;
  // Notification preferences for the listener.
  notificationSettings?: {
    calls?: boolean;
    messages?: boolean;
  };
  // FCM tokens for push notifications.
  fcmTokens?: string[];
}

// Represents a single call record in the 'calls' collection.
export interface CallRecord {
  callId: string;
  listenerId: string;
  userId: string;
  userName: string;
  startTime: firebase.firestore.Timestamp;
  endTime?: firebase.firestore.Timestamp;
  durationSeconds?: number;
  status: 'completed' | 'missed' | 'rejected' | 'ongoing';
  earnings?: number;
}

// Represents a chat session between a listener and a user.
export interface ListenerChatSession {
  id: string; // Document ID
  listenerId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessageText: string;
  lastMessageTimestamp: firebase.firestore.Timestamp;
  unreadByListener: boolean;
}

// Represents a single earning transaction in the listener's subcollection.
export interface EarningRecord {
  id: string; // Document ID
  callId: string;
  amount: number;
  timestamp: firebase.firestore.Timestamp;
  userName: string; // User's name from the call for context
}

// Represents a single message within a chat session.
export interface ChatMessage {
    id: string;
    senderId: string; // 'listener' or the user's UID
    text: string;
    timestamp: firebase.firestore.Timestamp;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'audio';
    audioUrl?: string;
    duration?: number; // duration in seconds for audio messages
}
