import type firebase from 'firebase/compat/app';

// Fix: Define all application-wide TypeScript types in this file to resolve module errors.

// Status for the listener's application/account, managed by admins.
export type ListenerAccountStatus = 'pending' | 'active' | 'suspended' | 'rejected' | 'onboarding_required';

// Status for the listener's availability in the app, controlled by the listener.
export type ListenerAppStatus = 'Available' | 'Busy' | 'Offline' | 'Break';

export interface ListenerProfile {
  uid: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string; // Made optional for onboarding
  city?: string; // Made optional, will be set during onboarding
  age?: number; // Made optional, will be set during onboarding
  status: ListenerAccountStatus;
  appStatus: ListenerAppStatus;
  onboardingComplete: boolean;
  createdAt: firebase.firestore.FieldValue | firebase.firestore.Timestamp;
  isAdmin?: boolean;
  fcmTokens?: string[];
  notificationSettings?: {
    calls: boolean;
    messages: boolean;
  };
  // Fields from application form
  realName?: string;
  profession?: string;
  languages?: string[];
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

export interface UnverifiedListener {
    realName: string;
    bankAccount: string;
    upiId: string;
}

export type CallStatus = 'completed' | 'missed' | 'rejected';

export interface CallRecord {
  callId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  listenerId: string;
  startTime: firebase.firestore.Timestamp;
  endTime?: firebase.firestore.Timestamp;
  durationSeconds?: number;
  status: CallStatus;
  earnings?: number;
}

export interface ListenerChatSession {
  id: string; // doc id
  userId: string;
  userName: string;
  userAvatar?: string;
  listenerId: string;
  lastMessageText: string;
  lastMessageTimestamp: firebase.firestore.Timestamp;
  unreadByUser: boolean;
  unreadByListener: boolean;
}

export type MessageType = 'text' | 'audio';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
    id: string; // doc id
    senderId: string; // either user or listener uid
    text: string;
    timestamp: firebase.firestore.FieldValue | firebase.firestore.Timestamp;
    type: MessageType;
    status: MessageStatus;
    audioUrl?: string;
    duration?: number; // for audio messages, in seconds
}

export interface EarningRecord {
    id: string; // doc id
    amount: number;
    callId: string;
    timestamp: firebase.firestore.Timestamp;
    userName: string; // user from the call
}

export interface Application {
    id: string;
    fullName: string;
    displayName: string;
    phone: string;
    profession: string;
    languages: string[];
    bankAccount?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: firebase.firestore.Timestamp;
}