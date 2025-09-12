import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../common/db";
import * as admin from "firebase-admin";

interface ApplicationData {
  fullName: string;
  displayName: string;
  phone: string;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
  profession: string;
  languages: string[];
}

/**
 * Handles the submission of a new listener application.
 * Validates data, checks for duplicates, and creates a new application document.
 */
export const submitListenerApplication = onCall(async (request) => {
  const data = request.data as ApplicationData;
  logger.info("Received listener application for phone:", data.phone);

  // 1. Basic Validation
  if (!data.phone || !/^\d{10}$/.test(data.phone.trim())) {
    throw new HttpsError("invalid-argument", "A valid 10-digit phone number is required.");
  }
  if (!data.fullName || !data.displayName || !data.profession || !data.languages || data.languages.length === 0) {
    throw new HttpsError("invalid-argument", "Missing required application fields.");
  }
  const hasBankDetails = data.bankAccount && data.ifsc && data.bankName;
  if (!hasBankDetails && !data.upiId) {
    throw new HttpsError("invalid-argument", "Either bank details or a UPI ID must be provided.");
  }

  // Use the full phone number with country code for consistency
  const phoneWithCountryCode = `+91${data.phone.trim()}`;

  try {
    // 2. Check for existing application or listener with this phone number
    const applicationsQuery = db.collection("applications").where("phone", "==", phoneWithCountryCode);
    const existingApplications = await applicationsQuery.get();
    if (!existingApplications.empty) {
      logger.warn("Duplicate application submission for phone:", phoneWithCountryCode);
      throw new HttpsError("already-exists", "An application with this phone number has already been submitted.");
    }

    const listenersQuery = db.collection("listeners").where("phone", "==", phoneWithCountryCode);
    const existingListeners = await listenersQuery.get();
    if (!existingListeners.empty) {
      logger.warn("Application submitted for an existing listener's phone:", phoneWithCountryCode);
      throw new HttpsError("already-exists", "An account with this phone number already exists.");
    }

    // 3. Create new application document
    const applicationPayload = {
      fullName: data.fullName.trim(),
      displayName: data.displayName.trim(),
      phone: phoneWithCountryCode,
      profession: data.profession,
      languages: data.languages,
      bankAccount: data.bankAccount || null,
      ifsc: data.ifsc || null,
      bankName: data.bankName || null,
      upiId: data.upiId || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("applications").add(applicationPayload);

    logger.info("Successfully created new application for phone:", phoneWithCountryCode);
    return { success: true, message: "Application submitted successfully." };
  } catch (error) {
    logger.error("Error submitting listener application:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred while submitting the application.");
  }
});
