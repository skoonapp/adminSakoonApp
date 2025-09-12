import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export initialized services for use in this function file
const db = admin.firestore();
const auth = admin.auth();


// --- TYPES ---
interface ApplicationData {
  fullName: string;
  displayName: string;
  phone: string;
  profession: string;
  languages: string[];
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}


// --- ADMIN-ONLY FUNCTIONS ---

/**
 * Checks if the calling user is an admin by checking their custom claims.
 * Throws an error if not an admin.
 * @param {CallableRequest} request The context of the function call.
 */
const ensureIsAdmin = async (request: CallableRequest) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const user = await auth.getUser(uid);
  if (user.customClaims?.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "User must be an admin to perform this action."
    );
  }
};


/**
 * A secure Cloud Function for an admin to grant admin role to another user.
 */
export const setAdminRole = onCall(
  { region: "asia-south1" },
  async (request) => {
    await ensureIsAdmin(request);

    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'targetUid' string."
      );
    }

    try {
      await auth.setCustomUserClaims(targetUid, { admin: true });
      await db.collection("listeners").doc(targetUid).update({ isAdmin: true });
      return {
        success: true,
        message: `User ${targetUid} has been successfully made an admin.`,
      };
    } catch (error) {
      console.error(`Error setting admin role for ${targetUid}:`, error);
      throw new HttpsError("internal", "An unexpected error occurred.");
    }
  });


/**
 * Approves a listener application, creates an auth user and a listener profile atomically.
 */
export const approveApplication = onCall(
  { region: "asia-south1" },
  async (request) => {
    await ensureIsAdmin(request);

    const { applicationId } = request.data;
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "Missing 'applicationId'.");
    }

    const appRef = db.collection("applications").doc(applicationId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new HttpsError("not-found", `Application ${applicationId} not found.`);
    }
    const appData = appDoc.data()!;

    if (appData.status !== "pending") {
      throw new HttpsError("failed-precondition", "Application already processed.");
    }

    let userRecord;
    try {
      // Step 1: Create the authentication user. This cannot be in a batch.
      userRecord = await auth.createUser({
        phoneNumber: `+91${appData.phone}`,
        displayName: appData.displayName,
      });

      // Step 2: Prepare Firestore writes in a batch for atomicity.
      const listenerProfile = {
        uid: userRecord.uid,
        displayName: appData.displayName,
        realName: appData.fullName,
        phone: `+91${appData.phone}`,
        status: "onboarding_required",
        appStatus: "Offline",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        onboardingComplete: false,
        isAdmin: false,
        profession: appData.profession,
        languages: appData.languages,
        bankAccount: appData.bankAccount || null,
        ifsc: appData.ifsc || null,
        bankName: appData.bankName || null,
        upiId: appData.upiId || null,
      };

      const batch = db.batch();

      // Action A: Create the listener document.
      const listenerRef = db.collection("listeners").doc(userRecord.uid);
      batch.set(listenerRef, listenerProfile);

      // Action B: Update the application document.
      batch.update(appRef, { status: "approved", listenerUid: userRecord.uid });

      // Step 3: Commit the batch. Both actions will succeed or fail together.
      await batch.commit();

      return { success: true, uid: userRecord.uid };
    } catch (error: any) {
      // --- ROBUST ERROR HANDLING ---
      // If the auth user was created but the batch failed, we MUST delete it
      // to prevent an orphaned auth account that leads to "Access Denied".
      if (userRecord) {
        functions.logger.warn(`Cleaning up orphaned auth user ${userRecord.uid} due to a failed profile creation.`);
        await auth.deleteUser(userRecord.uid);
      }

      // Handle specific, known errors to give better feedback to the admin.
      if (error.code === "auth/phone-number-already-exists") {
        await appRef.update({ status: "rejected", reason: "Phone already exists in Auth" });
        throw new HttpsError("already-exists", "This phone number is already registered as a user.");
      }

      // For all other errors, log them and throw a generic error.
      functions.logger.error(`Critical error approving application ${applicationId}:`, error);
      throw new HttpsError("internal", "An error occurred while creating the listener. The operation was rolled back.", error.message);
    }
  }
);


/**
 * Rejects a listener application.
 */
export const rejectApplication = onCall(
  { region: "asia-south1" },
  async (request) => {
    await ensureIsAdmin(request);
    const { applicationId } = request.data;
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "Missing 'applicationId'.");
    }
    await db.collection("applications").doc(applicationId).update({ status: "rejected" });
    return { success: true };
  });


// --- PUBLIC-FACING FUNCTION ---

/**
 * Allows a new user to submit an application to become a listener.
 */
export const submitListenerApplication = onCall(
  { region: "asia-south1" },
  async (request: CallableRequest<ApplicationData>) => {
    const data = request.data;
    const { fullName, displayName, phone, profession, languages, bankAccount, ifsc, bankName, upiId } = data;

    // --- Validation ---
    if (!fullName || !displayName || !phone || !profession || !languages) {
      throw new HttpsError("invalid-argument", "कृपया सभी ज़रूरी फ़ील्ड्स भरें।");
    }
    if (!/^\d{10}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।");
    }
    if (!Array.isArray(languages) || languages.length === 0) {
      throw new HttpsError("invalid-argument", "कृपया कम से कम एक भाषा चुनें।");
    }
    const hasBankDetails = bankAccount && ifsc && bankName;
    const hasUpi = upiId;
    if (!hasBankDetails && !hasUpi) {
      throw new HttpsError("invalid-argument", "कृपया बैंक विवरण या UPI ID प्रदान करें।");
    }

    // --- Duplicate Check ---
    try {
      const appQuery = db.collection("applications").where("phone", "==", phone).where("status", "in", ["pending", "approved"]);
      const existingApps = await appQuery.get();
      if (!existingApps.empty) {
        throw new HttpsError("already-exists", "इस फ़ोन नंबर से पहले ही एक आवेदन किया जा चुका है।");
      }

      const listenerQuery = db.collection("listeners").where("phone", "==", `+91${phone}`);
      const existingListeners = await listenerQuery.get();
      if (!existingListeners.empty) {
        throw new HttpsError("already-exists", "यह फ़ोन नंबर पहले से एक Listener के रूप में रजिस्टर है।");
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      functions.logger.error("Error checking for duplicates:", error);
      throw new HttpsError("internal", "आवेदन की जाँच करते समय एक त्रुटि हुई।");
    }

    // --- Submission ---
    try {
      await db.collection("applications").add({
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        phone: phone.trim(),
        profession,
        languages,
        bankAccount: bankAccount || null,
        ifsc: ifsc || null,
        bankName: bankName || null,
        upiId: upiId || null,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "आपका आवेदन सफलतापूर्वक जमा हो गया है!" };
    } catch (error) {
      functions.logger.error("Error saving application to Firestore:", error);
      throw new HttpsError("internal", "आपका आवेदन जमा करने में विफल रहा। कृपया बाद में पुनः प्रयास करें।");
    }
  }
);