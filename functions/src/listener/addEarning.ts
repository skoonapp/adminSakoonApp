import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "../common/db";
import * as admin from "firebase-admin";

const LISTENER_RATE_PER_MINUTE = 2.0; // ₹2 per minute

export const calculateCallEarning = onDocumentUpdated(
  "calls/{callId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.info("No data found in call update event.");
      return;
    }

    // Trigger only when a call status changes to 'completed'
    const wasInProgress = beforeData.status !== "completed";
    const isNowCompleted = afterData.status === "completed";

    if (wasInProgress && isNowCompleted) {
      const callId = event.params.callId;
      const { listenerId, userId, userName, startTime, endTime } = afterData;

      if (!startTime || !endTime || !listenerId || !userId) {
        logger.error(`Call ${callId} is missing critical data for earning calculation.`);
        return;
      }

      // 1. Calculate Duration and Earnings
      const startTimeMs = startTime.toMillis();
      const endTimeMs = endTime.toMillis();
      const durationSeconds = Math.round((endTimeMs - startTimeMs) / 1000);
      const durationMinutes = durationSeconds / 60;
      const calculatedEarning = parseFloat((durationMinutes * LISTENER_RATE_PER_MINUTE).toFixed(2));

      if (durationSeconds <= 0) {
        logger.info(`Call ${callId} had zero or negative duration. No earning record created.`);
        // Still update the call doc with zero values for history
        await event.data?.after.ref.update({
          durationSeconds: 0,
          earnings: 0,
        });
        return;
      }

      logger.info(`Processing earning for call ${callId}. Duration: ${durationSeconds}s, Earning: ₹${calculatedEarning}`);

      const listenerRef = db.collection("listeners").doc(listenerId);
      const earningsRef = listenerRef.collection("earnings").doc(callId);

      // 2. Create a batch write for atomicity
      const batch = db.batch();

      // a. Update the original call document
      batch.update(event.data?.after.ref, {
        durationSeconds: durationSeconds,
        earnings: calculatedEarning,
      });

      // b. Create a new record in the earnings subcollection
      const earningRecord = {
        amount: calculatedEarning,
        timestamp: endTime, // Use endTime for the transaction time
        type: "call",
        sourceId: callId,
        userId: userId,
        userName: userName || "Unknown User",
      };
      batch.set(earningsRef, earningRecord);

      // c. Increment total earnings and call count on the listener's main profile
      batch.update(listenerRef, {
        totalEarnings: admin.firestore.FieldValue.increment(calculatedEarning),
        totalCalls: admin.firestore.FieldValue.increment(1),
      });

      // 3. Commit the batch
      try {
        await batch.commit();
        logger.info(`Successfully created earning record and updated stats for call ${callId}.`);
      } catch (error) {
        logger.error(`Failed to commit batch for call ${callId}:`, error);
      }
    }
  }
);
