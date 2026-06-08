import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import {
  firebaseConfig,
  getMissingFirebaseConfigKeys,
  logFirebaseEnvStatus,
} from "@/lib/firebase";

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let firebaseClient: FirebaseClient | null = null;

export function getFirebaseClient(): FirebaseClient {
  if (firebaseClient) {
    return firebaseClient;
  }

  logFirebaseEnvStatus();

  const missingKeys = getMissingFirebaseConfigKeys();

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase client environment variables: ${missingKeys.join(", ")}`,
    );
  }

  const app = getApps()[0] ?? initializeApp(firebaseConfig);

  firebaseClient = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };

  return firebaseClient;
}
