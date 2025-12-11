import admin from "firebase-admin";
import * as fs from "node:fs";

const serviceAccount = JSON.parse(
    fs.readFileSync("../../firebase-service-account.json", "utf8")
);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
