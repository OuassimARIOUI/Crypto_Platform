import admin from "firebase-admin";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultServiceAccountPath = fileURLToPath(
    new URL("../../firebase-service-account.json", import.meta.url)
);

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : defaultServiceAccountPath;

if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
        `Firebase service account JSON not found at: ${serviceAccountPath}. ` +
            `Set FIREBASE_SERVICE_ACCOUNT_PATH to an absolute/relative path, or ensure firebase-service-account.json is present in the backend container at /app/firebase-service-account.json.`
    );
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
