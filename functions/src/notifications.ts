// This file will contain the logic for sending push notifications to listeners.
// The frontend service worker (sw.js) is already set up to receive these notifications.

/*
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "./utils/admin";

// Example function to send a notification when a call is created
export const sendCallNotification = functions.firestore
  .document("calls/{callId}")
  .onCreate(async (snap, context) => {
    const callData = snap.data();
    const { listenerId, userName, callId, userAvatar } = callData;

    // 1. Get the listener's FCM tokens
    const listenerDoc = await db.collection("listeners").doc(listenerId).get();
    const listenerData = listenerDoc.data();
    const tokens = listenerData?.fcmTokens;

    if (!tokens || tokens.length === 0) {
        console.log(`No FCM tokens found for listener ${listenerId}`);
        return null;
    }

    // 2. Construct the notification payload
    const payload = {
        notification: {
            title: "Incoming Call",
            body: `${userName || 'A user'} is calling!`,
            icon: userAvatar || "/icon-192.png",
        },
        data: {
            type: "incoming_call",
            callId: context.params.callId,
            userName: userName || 'A user',
            userAvatar: userAvatar || '',
            // Add a silent flag based on listener's settings
            silent: String(listenerData?.notificationSettings?.calls === false),
        },
    };

    // 3. Send the notification
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log("Notification sent successfully:", response);
    
    // Optional: Clean up invalid tokens
    // ...

    return null;
  });
*/
