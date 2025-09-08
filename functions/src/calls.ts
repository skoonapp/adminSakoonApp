import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "./utils/admin";

// Define necessary types locally to avoid external dependencies
type CallStatus = "completed" | "missed" | "rejected";
interface CallRecord {
  status: CallStatus;
  listenerId: string;
  durationSeconds?: number;
  userName?: string;
}
interface EarningRecord {
  amount: number;
  callId: string; // For calls, this is the callId. For messages, it's the chatId.
  timestamp: admin.firestore.FieldValue;
  userName: string;
  type: "call" | "message";
}

/**
 * Calculates earnings for a given session based on its type and duration/message count.
 * @param session An object describing the session.
 * @returns An object with listener, admin, and total earnings.
 */
function calculateEarnings(session: {
  type: "call" | "message",
  duration?: number,   // in minutes (for call)
  messages?: number    // count (for chat)
}) {
  let listenerEarning = 0;
  let adminEarning = 0;

  // Average User Price from provided logic
  const avgCallPrice = 9.4; // Rs per min
  const avgMsgPrice = 2.35; // Rs per msg

  // 📞 CALL CALCULATION
  if (session.type === "call" && session.duration) {
    const t = session.duration;

    // Progressive Listener Rate
    let rate = 0;
    if (t <= 5) rate = 2.0;
    else if (t <= 15) rate = 2.5;
    else if (t <= 30) rate = 3.0;
    else if (t <= 45) rate = 3.5;
    else rate = 3.6;

    listenerEarning = t * rate;
    const userPay = t * avgCallPrice;
    adminEarning = userPay - listenerEarning;
  }

  // 💬 MESSAGE CALCULATION
  if (session.type === "message" && session.messages) {
    listenerEarning = session.messages * 0.20;
    const userPay = session.messages * avgMsgPrice;
    adminEarning = userPay - listenerEarning;
  }

  // Return values rounded to 2 decimal places
  return {
    listenerEarning: parseFloat(listenerEarning.toFixed(2)),
    adminEarning: parseFloat(adminEarning.toFixed(2)),
    total: parseFloat((listenerEarning + adminEarning).toFixed(2)),
  };
}


/**
 * Triggered when a call document is updated.
 * Calculates and records earnings when a call's status changes to 'completed'.
 */
export const onCallComplete = functions
  .region("asia-south1")
  .firestore.document("calls/{callId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data() as CallRecord;
    const afterData = change.after.data() as CallRecord;

    // Proceed only if the call status has just changed to 'completed'
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      const { callId } = context.params;
      const { listenerId, durationSeconds, userName } = afterData;

      if (!listenerId || !durationSeconds || durationSeconds <= 0) {
        functions.logger.warn(`Call ${callId} missing listenerId or valid duration.`);
        return null;
      }

      const durationMinutes = durationSeconds / 60;

      const { listenerEarning, adminEarning, total } = calculateEarnings({
        type: "call",
        duration: durationMinutes,
      });

      if (listenerEarning <= 0) {
        functions.logger.info(`No earnings calculated for call ${callId}.`);
        return null;
      }

      const earningRecord: Omit<EarningRecord, "id"> = {
        amount: listenerEarning,
        callId: callId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userName: userName || "A User",
        type: "call",
      };

      const batch = db.batch();
      
      const listenerEarningsRef = db.collection("listeners").doc(listenerId).collection("earnings").doc(callId);
      batch.set(listenerEarningsRef, earningRecord);

      const callRef = db.collection("calls").doc(callId);
      batch.update(callRef, { earnings: listenerEarning });

      const adminEarningsRef = db.collection("adminAnalytics").doc("earnings").collection("records").doc(callId);
      batch.set(adminEarningsRef, {
        type: "call", callId, listenerId, listenerEarning, adminEarning, total,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      functions.logger.info(`Earnings for call ${callId} processed. Listener: ₹${listenerEarning}.`);
    }
    return null;
  });

/**
 * Triggered when a new message is created. Calculates earnings if the message is from a user.
 */
export const onNewMessage = functions
  .region("asia-south1")
  .firestore.document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const { chatId, messageId } = context.params;

    const chatSessionDoc = await db.collection("chats").doc(chatId).get();
    if (!chatSessionDoc.exists) {
      functions.logger.error(`Chat session ${chatId} not found for message ${messageId}.`);
      return null;
    }
    const { listenerId, userId, userName } = chatSessionDoc.data()!;

    if (messageData.senderId !== userId) {
      return null;
    }

    const { listenerEarning, adminEarning, total } = calculateEarnings({ type: "message", messages: 1 });

    if (listenerEarning <= 0) {
      return null;
    }

    const earningRecord: Omit<EarningRecord, "id"> = {
        amount: listenerEarning,
        callId: chatId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userName: userName || "A User",
        type: "message",
    };

    const batch = db.batch();
    
    const listenerEarningsRef = db.collection("listeners").doc(listenerId).collection("earnings").doc(messageId);
    batch.set(listenerEarningsRef, earningRecord);

    const adminEarningsRef = db.collection("adminAnalytics").doc("earnings").collection("records").doc(messageId);
    batch.set(adminEarningsRef, {
        type: "message", chatId, messageId, listenerId, listenerEarning, adminEarning, total,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    functions.logger.info(`Earnings for message ${messageId} processed. Listener: ₹${listenerEarning}.`);
    return null;
  });
