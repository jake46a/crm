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
  initializeFirestore,
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocs, 
  getDocFromServer,
  writeBatch,
  updateDoc
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Property, 
  Room, 
  LeaseRenewal, 
  WorkOrder, 
  TenantLead, 
  Contact, 
  ActivityLog,
  Invoice
} from '../types';
import {
  INITIAL_PROPERTIES,
  INITIAL_ROOMS,
  INITIAL_RENEWALS,
  INITIAL_WORK_ORDERS,
  INITIAL_LEADS,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITY_LOGS,
  DEMO_DATASET
} from '../data/initialData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with auto-detect long polling so that WebSocket drops
// or iframe sandbox proxy restrictions gracefully fall back to HTTP long polling.
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    }, customDbId);
  } catch {
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
})();
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
    try {
      await setDoc(doc(db, 'test', 'connection'), {
        connectedAt: new Date().toISOString(),
        status: 'active'
      }, { merge: true });
      return true;
    } catch (writeErr) {
      console.warn("Firestore connection test error:", writeErr);
      return false;
    }
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
  INVOICES: 'invoices',
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

export function subscribeToInvoices(
  onData: (data: Invoice[]) => void,
  onError?: (err: Error) => void
) {
  const colPath = COLLECTIONS.INVOICES;
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Invoice);
      // Sort newest created first
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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

  async saveInvoice(invoice: Invoice): Promise<void> {
    const docPath = `${COLLECTIONS.INVOICES}/${invoice.id}`;
    try {
      const sanitized = sanitizeForFirestore(invoice);
      await setDoc(doc(db, COLLECTIONS.INVOICES, invoice.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async saveInvoicesBatch(invoices: Invoice[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      invoices.forEach(inv => {
        const sanitized = sanitizeForFirestore(inv);
        batch.set(doc(db, COLLECTIONS.INVOICES, inv.id), sanitized, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.INVOICES);
    }
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    const docPath = `${COLLECTIONS.INVOICES}/${invoiceId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.INVOICES, invoiceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  async updateInvoiceStatus(
    invoiceId: string, 
    status: Invoice['status'], 
    details?: Partial<Invoice>
  ): Promise<void> {
    const docPath = `${COLLECTIONS.INVOICES}/${invoiceId}`;
    try {
      const payload: any = { status, ...(details || {}) };
      const sanitized = sanitizeForFirestore(payload);
      await updateDoc(doc(db, COLLECTIONS.INVOICES, invoiceId), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
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

  async deleteActivityLog(logId: string): Promise<void> {
    const docPath = `${COLLECTIONS.ACTIVITY_LOGS}/${logId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, logId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
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
    await this.resetToCleanSlate();
  },

  async resetToCleanSlate(): Promise<void> {
    await this.clearAllData();
    await this.seedInitialData();
  },

  async resetToDemoDataset(): Promise<void> {
    await this.clearAllData();
    const batch = writeBatch(db);

    DEMO_DATASET.properties.forEach(p => {
      batch.set(doc(db, COLLECTIONS.PROPERTIES, p.id), sanitizeForFirestore(p));
    });

    DEMO_DATASET.rooms.forEach(r => {
      batch.set(doc(db, COLLECTIONS.ROOMS, r.id), sanitizeForFirestore(r));
    });

    DEMO_DATASET.renewals.forEach(ren => {
      batch.set(doc(db, COLLECTIONS.RENEWALS, ren.id), sanitizeForFirestore(ren));
    });

    DEMO_DATASET.workOrders.forEach(wo => {
      batch.set(doc(db, COLLECTIONS.WORK_ORDERS, wo.id), sanitizeForFirestore(wo));
    });

    DEMO_DATASET.leads.forEach(l => {
      batch.set(doc(db, COLLECTIONS.LEADS, l.id), sanitizeForFirestore(l));
    });

    DEMO_DATASET.contacts.forEach(c => {
      batch.set(doc(db, COLLECTIONS.CONTACTS, c.id), sanitizeForFirestore(c));
    });

    DEMO_DATASET.activityLogs.forEach(act => {
      batch.set(doc(db, COLLECTIONS.ACTIVITY_LOGS, act.id), sanitizeForFirestore(act));
    });

    await batch.commit();
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
  },

  /**
   * Pushes all local in-memory/localStorage data directly to Cloud Firestore.
   * Ensures every property, room, renewal, work order, lead, contact, and invoice is backed up.
   */
  async syncAllLocalToFirestore(data: {
    properties: Property[];
    rooms: Room[];
    renewals: LeaseRenewal[];
    workOrders: WorkOrder[];
    leads: TenantLead[];
    contacts: Contact[];
    invoices?: Invoice[];
    activityLogs?: ActivityLog[];
  }): Promise<{ success: boolean; counts: Record<string, number> }> {
    const counts = {
      properties: 0,
      rooms: 0,
      renewals: 0,
      workOrders: 0,
      leads: 0,
      contacts: 0,
      invoices: 0,
      activityLogs: 0
    };

    const batchWrite = async <T extends { id: string }>(col: string, items: T[]) => {
      if (!items || items.length === 0) return 0;
      for (let i = 0; i < items.length; i += 300) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + 300);
        chunk.forEach(item => {
          const sanitized = sanitizeForFirestore(item);
          batch.set(doc(db, col, item.id), sanitized, { merge: true });
        });
        try {
          await batch.commit();
        } catch (batchErr: any) {
          console.error(`Batch commit failed for collection "${col}":`, batchErr);
          throw new Error(`Sync failed on collection "${col}": ${batchErr?.message || batchErr}`);
        }
      }
      return items.length;
    };

    if (data.properties?.length) counts.properties = await batchWrite(COLLECTIONS.PROPERTIES, data.properties);
    if (data.rooms?.length) counts.rooms = await batchWrite(COLLECTIONS.ROOMS, data.rooms);
    if (data.renewals?.length) counts.renewals = await batchWrite(COLLECTIONS.RENEWALS, data.renewals);
    if (data.workOrders?.length) counts.workOrders = await batchWrite(COLLECTIONS.WORK_ORDERS, data.workOrders);
    if (data.leads?.length) counts.leads = await batchWrite(COLLECTIONS.LEADS, data.leads);
    if (data.contacts?.length) counts.contacts = await batchWrite(COLLECTIONS.CONTACTS, data.contacts);
    if (data.invoices?.length) counts.invoices = await batchWrite(COLLECTIONS.INVOICES, data.invoices);
    if (data.activityLogs?.length) counts.activityLogs = await batchWrite(COLLECTIONS.ACTIVITY_LOGS, data.activityLogs.slice(0, 100));

    return { success: true, counts };
  },

  /**
   * Pulls all collections from Cloud Firestore into memory.
   */
  async pullAllFromFirestore(): Promise<{
    properties: Property[];
    rooms: Room[];
    renewals: LeaseRenewal[];
    workOrders: WorkOrder[];
    leads: TenantLead[];
    contacts: Contact[];
    invoices: Invoice[];
  }> {
    const [pSnap, rSnap, renSnap, woSnap, lSnap, cSnap, iSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.PROPERTIES)),
      getDocs(collection(db, COLLECTIONS.ROOMS)),
      getDocs(collection(db, COLLECTIONS.RENEWALS)),
      getDocs(collection(db, COLLECTIONS.WORK_ORDERS)),
      getDocs(collection(db, COLLECTIONS.LEADS)),
      getDocs(collection(db, COLLECTIONS.CONTACTS)),
      getDocs(collection(db, COLLECTIONS.INVOICES))
    ]);

    return {
      properties: pSnap.docs.map(d => d.data() as Property),
      rooms: rSnap.docs.map(d => d.data() as Room),
      renewals: renSnap.docs.map(d => d.data() as LeaseRenewal),
      workOrders: woSnap.docs.map(d => d.data() as WorkOrder),
      leads: lSnap.docs.map(d => d.data() as TenantLead),
      contacts: cSnap.docs.map(d => d.data() as Contact),
      invoices: iSnap.docs.map(d => d.data() as Invoice)
    };
  }
};
