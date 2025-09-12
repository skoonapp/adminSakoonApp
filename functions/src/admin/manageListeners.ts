import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db, auth } from "../common/db";
import * as admin from "firebase-admin";

/**
 * Checks if the calling user has an 'admin' custom claim.
 * @param {string | undefined} uid The UID of the user.
 * @throws {HttpsError} Throws 'unauthenticated' if no UID, 'permission-denied' if not an admin.
 */
const ensureIsAdmin = async (uid: string | undefined) => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const user = await auth.getUser(uid);
  if (user.customClaims?.admin !== true) {
    logger.warn(`Non-admin user ${uid} attempted to call an admin function.`);
    throw new HttpsError("permission-denied", "The function must be called by an admin.");
  }
};

/**
 * Approves a listener application.
 * 1. Checks if a user exists with the phone number, creates one if not.
 * 2. Creates a 'listener' document with status 'onboarding_required'.
 * 3. Updates the 'application' document to 'approved'.
 * This is all done within a transaction to ensure data integrity.
 */
export const approveApplication = onCall({ region: "asia-south1" }, async (request) => {
  await ensureIsAdmin(request.auth?.uid);

  const { applicationId } = request.data;
  if (!applicationId) {
    throw new HttpsError("invalid-argument", "The function must be called with an 'applicationId'.");
  }

  const applicationRef = db.collection("applications").doc(applicationId);

  try {
    let listenerUid: string;

    const newListenerData = await db.runTransaction(async (transaction) => {
      const appDoc = await transaction.get(applicationRef);
      if (!appDoc.exists) {
        throw new HttpsError("not-found", `Application with ID ${applicationId} not found.`);
      }

      const appData = appDoc.data();
      if (!appData || appData.status !== "pending") {
        throw new HttpsError("failed-precondition", "Application is not in a pending state.");
      }

      // Check if a user account already exists with the phone number
      try {
        const userRecord = await auth.getUserByPhoneNumber(appData.phone);
        listenerUid = userRecord.uid;
        logger.info(`User with phone ${appData.phone} already exists. UID: ${listenerUid}`);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // If user doesn't exist, create a new one
          const newUser = await auth.createUser({
            phoneNumber: appData.phone,
            displayName: appData.displayName,
          });
          listenerUid = newUser.uid;
          logger.info(`Created new user for phone ${appData.phone}. UID: ${listenerUid}`);
        } else {
          // For other auth errors (e.g., malformed phone number), rethrow
          logger.error("Auth error during user lookup:", error);
          throw new HttpsError("internal", "An error occurred with Firebase Authentication.");
        }
      }

      // Prepare and create the new listener document
      const listenerRef = db.collection("listeners").doc(listenerUid);
      const listenerPayload = {
        uid: listenerUid,
        displayName: appData.displayName,
        realName: appData.fullName,
        phone: appData.phone,
        status: "onboarding_required", // Set status to require listener to complete profile
        appStatus: "Offline",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        onboardingComplete: false,
        isAdmin: false,
        profession: appData.profession,
        languages: appData.languages,
        avatarUrl: "", // To be set during listener onboarding
        city: "",      // To be set during listener onboarding
        age: 0,        // To be set during listener onboarding
        bankAccount: appData.bankAccount || null,
        ifsc: appData.ifsc || null,
        bankName: appData.bankName || null,
        upiId: appData.upiId || null,
      };
      
      transaction.set(listenerRef, listenerPayload);
      transaction.update(applicationRef, { status: "approved", listenerUid: listenerUid });
      
      return listenerPayload;
    });

    logger.info(`Application ${applicationId} approved. Listener UID: ${listenerUid!}`);
    return { success: true, message: "Application approved successfully.", listener: newListenerData };

  } catch (error) {
    logger.error(`Error approving application ${applicationId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // This will result in the 'internal' error on the client for unexpected issues
    throw new HttpsError("internal", "An unexpected error occurred while approving the application.");
  }
});


/**
 * Rejects a listener application by updating its status.
 */
export const rejectApplication = onCall({ region: "asia-south1" }, async (request) => {
    await ensureIsAdmin(request.auth?.uid);

    const { applicationId, reason } = request.data;
    if (!applicationId) {
        throw new HttpsError("invalid-argument", "The function must be called with an 'applicationId'.");
    }

    try {
        const applicationRef = db.collection("applications").doc(applicationId);
        const appDoc = await applicationRef.get();

        if (!appDoc.exists || appDoc.data()?.status !== "pending") {
            throw new HttpsError("failed-precondition", "Application is not in a pending state and cannot be rejected.");
        }

        await applicationRef.update({
            status: "rejected",
            reason: reason || "Application did not meet requirements.",
        });

        logger.info(`Application ${applicationId} was rejected.`);
        return { success: true, message: "Application rejected successfully." };
    } catch (error) {
        logger.error(`Error rejecting application ${applicationId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An unexpected error occurred while rejecting the application.");
    }
});
