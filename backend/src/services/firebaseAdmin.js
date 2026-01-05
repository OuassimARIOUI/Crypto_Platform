import admin from "firebase-admin";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Allow disabling Firebase for CI/test environments
const isFirebaseDisabled = process.env.FIREBASE_DISABLED === "true";

if (isFirebaseDisabled) {
    console.log(" Firebase is DISABLED (FIREBASE_DISABLED=true). Auth features using Firebase will be mocked.");
} else {
    const defaultServiceAccountPath = fileURLToPath(
        new URL("../../firebase-service-account.json", import.meta.url)
    );

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : defaultServiceAccountPath;

    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
            `Firebase service account JSON not found at: ${serviceAccountPath}. ` +
                `Set FIREBASE_SERVICE_ACCOUNT_PATH to an absolute/relative path, or ensure firebase-service-account.json is present in the backend container at /app/firebase-service-account.json. ` +
                `Alternatively, set FIREBASE_DISABLED=true to disable Firebase.`
        );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Export a mock or real admin based on FIREBASE_DISABLED
const firebaseAdmin = isFirebaseDisabled
    ? {
          auth: () => ({
              verifyIdToken: async () => {
                  throw new Error("Firebase is disabled in test mode");
              },
              createUser: async () => {
                  throw new Error("Firebase is disabled in test mode");
              },
              deleteUser: async () => {
                  throw new Error("Firebase is disabled in test mode");
              },
          }),
          _isDisabled: true,
      }
    : admin;

export default firebaseAdmin;
