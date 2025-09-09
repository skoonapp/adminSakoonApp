import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, auth } from "./utils/admin";

/**
 * Checks if the calling user is an admin. Throws an error if not.
 * @param {functions.https.CallableContext} context The context of the function call.
 */
const ensureIsAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const adminUser = await auth.getUser(context.auth.uid);
  if (adminUser.customClaims?.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User must be an admin to perform this action."
    );
  }
};


export const approveApplication = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    await ensureIsAdmin(context);

    const { applicationId } = data;
    if (!applicationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with an 'applicationId'."
      );
    }

    const appRef = db.collection("applications").doc(applicationId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Application with ID ${applicationId} not found.`
      );
    }
    const appData = appDoc.data()!;

    if (appData.status !== "pending") {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "This application has already been processed."
        );
    }

    let userRecord;
    try {
      userRecord = await auth.createUser({
        phoneNumber: `+91${appData.phone}`,
        displayName: appData.displayName,
      });
    } catch (error: any) {
      if (error.code === "auth/phone-number-already-exists") {
        await appRef.update({ status: "rejected", reason: "Phone already exists" });
        throw new functions.https.HttpsError(
          "already-exists",
          "This phone number is already registered."
        );
      }
      throw new functions.https.HttpsError("internal", "Error creating user account.", error);
    }

    const listenerProfile = {
      uid: userRecord.uid,
      displayName: appData.displayName,
      realName: appData.fullName,
      phone: `+91${appData.phone}`,
      status: "onboarding_required",
      appStatus: "Offline",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      onboardingComplete: false,
      profession: appData.profession,
      languages: appData.languages,
      bankAccount: appData.bankAccount || null,
      ifsc: appData.ifsc || null,
      bankName: appData.bankName || null,
      upiId: appData.upiId || null,
    };
    await db.collection("listeners").doc(userRecord.uid).set(listenerProfile);

    await appRef.update({ status: "approved", listenerUid: userRecord.uid });

    return { success: true, uid: userRecord.uid };
  });


export const rejectApplication = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { applicationId } = data;
    if (!applicationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with an 'applicationId'."
      );
    }
    await db.collection("applications").doc(applicationId).update({ status: "rejected" });
    return { success: true };
  });