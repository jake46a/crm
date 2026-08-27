import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
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
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
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

// Firestore Database Mutation Service
export const FirebaseService = {
  async saveProperty(property: Property): Promise<void> {
    const docPath = `${COLLECTIONS.PROPERTIES}/${property.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, property.id), property, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), room, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.RENEWALS, renewal.id), renewal, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.WORK_ORDERS, workOrder.id), workOrder, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), lead, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.CONTACTS, contact.id), contact, { merge: true });
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
      await setDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  // Seed initial data into Firestore if empty
  async seedInitialDataIfEmpty(): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.PROPERTIES));
      if (snap.empty) {
        console.log("Seeding Firestore with initial Moyer CRM data...");
        const batch = writeBatch(db);

        INITIAL_PROPERTIES.forEach(p => {
          batch.set(doc(db, COLLECTIONS.PROPERTIES, p.id), p);
        });

        INITIAL_ROOMS.forEach(r => {
          batch.set(doc(db, COLLECTIONS.ROOMS, r.id), r);
        });

        INITIAL_RENEWALS.forEach(ren => {
          batch.set(doc(db, COLLECTIONS.RENEWALS, ren.id), ren);
        });

        INITIAL_WORK_ORDERS.forEach(wo => {
          batch.set(doc(db, COLLECTIONS.WORK_ORDERS, wo.id), wo);
        });

        INITIAL_LEADS.forEach(l => {
          batch.set(doc(db, COLLECTIONS.LEADS, l.id), l);
        });

        INITIAL_CONTACTS.forEach(c => {
          batch.set(doc(db, COLLECTIONS.CONTACTS, c.id), c);
        });

        INITIAL_ACTIVITY_LOGS.forEach(log => {
          batch.set(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), log);
        });

        await batch.commit();
        console.log("Firestore seeding complete!");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Could not check/seed Firestore (offline or rules check):", error);
      return false;
    }
  },

  // Reset Firestore to initial dataset
  async resetToSeedData(): Promise<void> {
    const batch = writeBatch(db);

    INITIAL_PROPERTIES.forEach(p => {
      batch.set(doc(db, COLLECTIONS.PROPERTIES, p.id), p);
    });

    INITIAL_ROOMS.forEach(r => {
      batch.set(doc(db, COLLECTIONS.ROOMS, r.id), r);
    });

    INITIAL_RENEWALS.forEach(ren => {
      batch.set(doc(db, COLLECTIONS.RENEWALS, ren.id), ren);
    });

    INITIAL_WORK_ORDERS.forEach(wo => {
      batch.set(doc(db, COLLECTIONS.WORK_ORDERS, wo.id), wo);
    });

    INITIAL_LEADS.forEach(l => {
      batch.set(doc(db, COLLECTIONS.LEADS, l.id), l);
    });

    INITIAL_CONTACTS.forEach(c => {
      batch.set(doc(db, COLLECTIONS.CONTACTS, c.id), c);
    });

    INITIAL_ACTIVITY_LOGS.forEach(log => {
      batch.set(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), log);
    });

    await batch.commit();
  }
};
