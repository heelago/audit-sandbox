import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let cachedApp: App | null = null;

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error('Missing required keys in FIREBASE_SERVICE_ACCOUNT_JSON.');
    }
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  } catch (error) {
    throw new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`
    );
  }
}

export function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const serviceAccount = getServiceAccount();
  cachedApp = serviceAccount
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : initializeApp();
  return cachedApp;
}

export function getFirebaseAdminFirestore() {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}
