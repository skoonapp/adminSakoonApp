

// FIX: Migrated from Functions v1 to v2 and corrected imports to resolve type errors.
import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { RtcTokenBuilder, RtcRole } from "zegocloud-server-sdk";
// FIX: Using namespace import for express to avoid type conflicts.
import * as express from "express";
import cors from "cors";


// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// IMPORTANT: Set these in your Firebase environment configuration by running:
// firebase functions:config:set zego.appid="YOUR_ZEGO_APP_ID"
// firebase functions:config:set zego.secret="YOUR_ZEGO_SERVER_SECRET"
const ZEGO_APP_ID = parseInt(functions.config().zego.appid || "0", 10);
const ZEGO_SERVER_SECRET = functions.config().zego.secret || "";

const app = express();
app.use(cors({ origin: true }));

/**
 * A simple hash function to convert a string UID to a 32-bit integer.
 * This is necessary because Zego RTC tokens require a numeric user ID.
 * @param str The string to hash.
 * @returns A 32-bit unsigned integer.
 */
function sdbmHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash >>> 0;
}

// Middleware to verify Firebase Auth token
// FIX: Using fully qualified types from the express namespace to resolve type errors.
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        return res.status(403).send("Unauthorized: No token provided.");
    }
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        (req as any).user = decodedIdToken;
        return next();
    } catch (e) {
        return res.status(403).send("Unauthorized: Invalid token.");
    }
};

// FIX: Removed explicit types from the route handler to allow for correct type inference by Express.
app.post("/generateZegoToken", authenticate, (req, res) => {
    const { roomId } = req.body;
    if (!roomId || typeof roomId !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'roomId'." });
    }

    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
        functions.logger.error("Zego App ID or Server Secret is not configured.");
        return res.status(500).json({ error: "Service is not configured correctly." });
    }
    
    const uid = (req as any).user.uid;
    const zegoUid = sdbmHash(uid);
    
    const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
    const role = RtcRole.PUBLISHER;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            ZEGO_APP_ID,
            ZEGO_SERVER_SECRET,
            roomId,
            zegoUid,
            role,
            effectiveTimeInSeconds
        );
        
        functions.logger.info(`Token generated for user ${uid} (Zego UID: ${zegoUid}) for room ${roomId}.`);
        return res.status(200).json({ token });
    } catch (error) {
        functions.logger.error("Error generating Zego token:", error);
        return res.status(500).json({ error: "Failed to generate a secure token." });
    }
});

// Exposes the Express app as a single Cloud Function named 'api'
export const api = onRequest({ region: "asia-south1" }, app);