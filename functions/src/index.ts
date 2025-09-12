/**
 * Main entry point for all Firebase Functions.
 * This file should re-export all functions from other files.
 */

// Note: admin.initializeApp() is called in other files like zego.ts and listenerApply.ts
// with a guard to prevent re-initialization. This is sufficient.

export * from "./listenerApply";
export * from "./zego";
// export * from "./calls"; // This file is empty for now.
// export * from "./notifications"; // This file contains commented-out example code.
