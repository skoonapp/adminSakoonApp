import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db, auth } from "../common/db";

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


export const getAdminDashboardStats = onCall({ region: "asia-south1" }, async (request) => {
  await ensureIsAdmin(request.auth?.uid);

  try {
    // In the future, this function will calculate real data.
    // For now, it returns placeholder data as per the user's guide.

    const activeListenersSnap = await db.collection("listeners").where("status", "==", "active").get();

    // NOTE: This is all placeholder data for the UI.
    const placeholderData = {
      totalRevenue: 63730,
      totalProfit: 44870,
      totalPaidToListeners: 18860,
      totalTransactions: 1080,
      totalCalls: 710,
      totalChats: 370,
      dailyRevenue: 2340,
      dailyProfit: 1590,
      dailyTransactions: 42,
      dailyCalls: 28,
      dailyChats: 14,
      averageProfitPercentage: 68,
      averageVoiceRate: 9.40,
      averageChatRate: 2.36,
      activeListeners: activeListenersSnap.size, // This one is real
      date: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString(),
    };

    return placeholderData;
  } catch (error) {
    logger.error("Error fetching admin dashboard stats:", error);
    throw new HttpsError("internal", "Could not fetch dashboard statistics.");
  }
});