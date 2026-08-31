import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocs, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Property, 
  Room, 
  LeaseRenewal, 
  WorkOrder, 
  TenantLead, 
  Contact, 
  ActivityLog 
} from '../types';
import {
  INITIAL_PROPERTIES,
  INITIAL_ROOMS,
  INITIAL_RENEWALS,
  INITIAL_WORK_ORDERS,
  INITIAL_LEADS,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: The app will break without specifying the custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Checking network/rules...");
    }
    return false;
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    // If popup was blocked by browser or COOP headers, fall back to redirect if appropriate
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect sign in error:', redirectErr);
        throw redirectErr;
      }
    }
    throw error;
  }
}

export async function loginWithGoogleRedirect(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}

export async function checkRedirectAuthResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error('Error checking redirect auth result:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Collection Names
export const COLLECTIONS = {
  PROPERTIES: 'properties',
  ROOMS: 'rooms',
  RENEWALS: 'renewals',
  WORK_ORDERS: 'workorders',
  LEADS: 'leads',
  CONTACTS: 'contacts',
  ACTIVITY_LOGS: 'activityLogs',
};

// Real-time Listeners
export function subscribeToProperties(
  onData: (data: Property[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.PROPERTIES;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Property);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToRooms(
  onData: (data: Room[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.ROOMS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Room);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToRenewals(
  onData: (data: LeaseRenewal[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.RENEWALS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as LeaseRenewal);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToWorkOrders(
  onData: (data: WorkOrder[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.WORK_ORDERS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as WorkOrder);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToLeads(
  onData: (data: TenantLead[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.LEADS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as TenantLead);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToContacts(
  onData: (data: Contact[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.CONTACTS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Contact);
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export function subscribeToActivityLogs(
  onData: (data: ActivityLog[]) => void, 
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.ACTIVITY_LOGS;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as ActivityLog);
      // Sort newest first
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

/**
 * Recursively removes all keys with `undefined` values so Firestore setDoc / updateDoc does not reject payloads.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Firestore Database Mutation Service
export const FirebaseService = {
  async saveProperty(property: Property): Promise<void> {
    const docPath = `${COLLECTIONS.PROPERTIES}/${property.id}`;
    try {
      const sanitized = sanitizeForFirestore(property);
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, property.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteProperty(propertyId: string): Promise<void> {
    const docPath = `${COLLECTIONS.PROPERTIES}/${propertyId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async saveRoom(room: Room): Promise<void> {
    const docPath = `${COLLECTIONS.ROOMS}/${room.id}`;
    try {
      const sanitized = sanitizeForFirestore(room);
      await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteRoom(roomId: string): Promise<void> {
    const docPath = `${COLLECTIONS.ROOMS}/${roomId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.ROOMS, roomId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async saveRenewal(renewal: LeaseRenewal): Promise<void> {
    const docPath = `${COLLECTIONS.RENEWALS}/${renewal.id}`;
    try {
      const sanitized = sanitizeForFirestore(renewal);
      await setDoc(doc(db, COLLECTIONS.RENEWALS, renewal.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteRenewal(renewalId: string): Promise<void> {
    const docPath = `${COLLECTIONS.RENEWALS}/${renewalId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.RENEWALS, renewalId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async saveWorkOrder(workOrder: WorkOrder): Promise<void> {
    const docPath = `${COLLECTIONS.WORK_ORDERS}/${workOrder.id}`;
    try {
      const sanitized = sanitizeForFirestore(workOrder);
      await setDoc(doc(db, COLLECTIONS.WORK_ORDERS, workOrder.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteWorkOrder(workOrderId: string): Promise<void> {
    const docPath = `${COLLECTIONS.WORK_ORDERS}/${workOrderId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.WORK_ORDERS, workOrderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async saveLead(lead: TenantLead): Promise<void> {
    const docPath = `${COLLECTIONS.LEADS}/${lead.id}`;
    try {
      const sanitized = sanitizeForFirestore(lead);
      await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    const docPath = `${COLLECTIONS.LEADS}/${leadId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.LEADS, leadId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async saveContact(contact: Contact): Promise<void> {
    const docPath = `${COLLECTIONS.CONTACTS}/${contact.id}`;
    try {
      const sanitized = sanitizeForFirestore(contact);
      await setDoc(doc(db, COLLECTIONS.CONTACTS, contact.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteContact(contactId: string): Promise<void> {
    const docPath = `${COLLECTIONS.CONTACTS}/${contactId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CONTACTS, contactId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async addActivityLog(log: ActivityLog): Promise<void> {
    const docPath = `${COLLECTIONS.ACTIVITY_LOGS}/${log.id}`;
    try {
      const sanitized = sanitizeForFirestore(log);
      await setDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  // Clear only leads collection
  async clearLeads(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.LEADS));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Error deleting leads collection docs:', err);
    }
  },

  // Delete all data from Firestore across all collections
  async clearAllData(): Promise<void> {
    const allCollections = Object.values(COLLECTIONS);
    for (const colName of allCollections) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 400);
            chunk.forEach(d => {
              batch.delete(d.ref);
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Error deleting documents from collection ${colName}:`, err);
      }
    }
  },

  async deleteAllData(): Promise<void> {
    await this.clearAllData();
  },

  async seedInitialData(): Promise<void> {
    const batch = writeBatch(db);

    INITIAL_PROPERTIES.forEach(p => {
      batch.set(doc(db, COLLECTIONS.PROPERTIES, p.id), sanitizeForFirestore(p));
    });

    INITIAL_ROOMS.forEach(r => {
      batch.set(doc(db, COLLECTIONS.ROOMS, r.id), sanitizeForFirestore(r));
    });

    INITIAL_RENEWALS.forEach(ren => {
      batch.set(doc(db, COLLECTIONS.RENEWALS, ren.id), sanitizeForFirestore(ren));
    });

    INITIAL_WORK_ORDERS.forEach(wo => {
      batch.set(doc(db, COLLECTIONS.WORK_ORDERS, wo.id), sanitizeForFirestore(wo));
    });

    INITIAL_LEADS.forEach(l => {
      batch.set(doc(db, COLLECTIONS.LEADS, l.id), sanitizeForFirestore(l));
    });

    INITIAL_CONTACTS.forEach(c => {
      batch.set(doc(db, COLLECTIONS.CONTACTS, c.id), sanitizeForFirestore(c));
    });

    INITIAL_ACTIVITY_LOGS.forEach(act => {
      batch.set(doc(db, COLLECTIONS.ACTIVITY_LOGS, act.id), sanitizeForFirestore(act));
    });

    await batch.commit();
  },

  async resetToSeedData(): Promise<void> {
    await this.clearAllData();
    await this.seedInitialData();
  },

  async seedInitialDataIfEmpty(): Promise<boolean> {
    try {
      const propSnap = await getDocs(collection(db, COLLECTIONS.PROPERTIES));
      if (propSnap.empty) {
        await this.seedInitialData();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Could not auto-check seed data:', e);
      return false;
    }
  }
};
