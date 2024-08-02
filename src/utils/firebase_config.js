import admin from "firebase-admin";
import serviceAccount from "../../firebase_storage.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "social-media-8eab2.appspot.com",
});

export { admin };
