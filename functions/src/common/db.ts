import * as admin from "firebase-admin";

// Initialize the app once for the entire functions runtime
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export initialized services for use in other functions
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
