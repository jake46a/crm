import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact, ActivityLog, Invoice } from '../types';
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
import { splitFullName, formatFullName } from '../utils/nameUtils';

const STORAGE_KEYS = {
  PROPERTIES: 'moyer_crm_properties_v3',
  ROOMS: 'moyer_crm_rooms_v3',
  RENEWALS: 'moyer_crm_renewals_v3',
  WORK_ORDERS: 'moyer_crm_workorders_v3',
  LEADS: 'moyer_crm_leads_v3',
  CONTACTS: 'moyer_crm_contacts_v3',
  INVOICES: 'moyer_crm_invoices_v3',
  ACTIVITY_LOGS: 'moyer_crm_activity_logs_v3'
};

const LEGACY_SAMPLE_LEAD_IDS = new Set([
  'lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5', 'lead-6', 'lead-7', 'lead-8'
]);

export const LEGACY_SAMPLE_PROPERTY_IDS = new Set(['prop-1', 'prop-2', 'prop-3']);

export const LEGACY_SAMPLE_ROOM_IDS = new Set([
  'room-101', 'room-102', 'room-103', 'room-104',
  'room-201', 'room-202', 'room-203', 'room-204',
  'room-301', 'room-302', 'room-303'
]);

export const LEGACY_SAMPLE_RENEWAL_IDS = new Set([
  'ren-001', 'ren-002', 'ren-003', 'ren-004', 'ren-005', 'ren-006', 'ren-007', 'ren-008'
]);

export const LEGACY_SAMPLE_WORK_ORDER_IDS = new Set(['wo-101', 'wo-102']);

export const LEGACY_SAMPLE_CONTACT_IDS = new Set(['cont-1', 'cont-2', 'cont-3']);

export const LEGACY_SAMPLE_ACTIVITY_LOG_IDS = new Set(['act-001', 'act-002', 'act-003', 'act-004']);

export const REJECTED_SAMPLE_TENANT_NAMES = new Set([
  'brandon hayes', 'sarah jenkins', 'david kim', 'lucas torres', 'emily watson', 'trevor nielsen',
  'marcus vance', 'elena rostova', 'sam chen', 'olivia hayes', 'liam o\'connor', 'tariq mansoor', 'lucas silva'
]);

export const REJECTED_SAMPLE_CONTACT_IDS = new Set([
  'cont-yank-1', 'cont-yank-2', 'cont-yank-3', 'cont-yank-4', 'cont-yank-5', 'cont-yank-6',
  'cont-1', 'cont-2', 'cont-3'
]);

export const REJECTED_SAMPLE_RENEWAL_IDS = new Set([
  'ren-yank-1', 'ren-yank-2', 'ren-yank-3',
  'ren-001', 'ren-002', 'ren-003', 'ren-004', 'ren-005', 'ren-006', 'ren-007', 'ren-008'
]);

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to localStorage key ${key}:`, err);
  }
}

export const StorageService = {
  // Properties
  getProperties(): Property[] {
    const raw = getItem<Property[]>(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
    const filtered = raw.filter(p => !LEGACY_SAMPLE_PROPERTY_IDS.has(p.id) && !p.name.includes('Speer') && !p.name.includes('Capitol Hill') && !p.name.includes('Highlands'));
    if (filtered.length !== raw.length) {
      this.saveProperties(filtered);
    }
    // Guarantee 1070 Yank St is present as flagship property
    const has1070 = filtered.some(p => p.id === 'prop-1070-yank' || p.name.includes('1070 Yank'));
    if (!has1070 && INITIAL_PROPERTIES.length > 0) {
      const yankProp = INITIAL_PROPERTIES.find(p => p.id === 'prop-1070-yank') || INITIAL_PROPERTIES[0];
      const updated = [yankProp, ...filtered];
      this.saveProperties(updated);
      return updated;
    }
    return filtered;
  },
  saveProperties(properties: Property[]): void {
    setItem(STORAGE_KEYS.PROPERTIES, properties);
  },
  
  // Rooms
  getRooms(): Room[] {
    const raw = getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const filtered = raw.filter(r => !LEGACY_SAMPLE_ROOM_IDS.has(r.id) && r.propertyId !== 'prop-1' && r.propertyId !== 'prop-2' && r.propertyId !== 'prop-3');
    let rooms = filtered;
    // Guarantee 1070 Yank St rooms exist
    const hasYankRooms = rooms.some(r => r.propertyId === 'prop-1070-yank' || r.propertyName?.includes('1070 Yank'));
    if (!hasYankRooms) {
      const yankRooms = INITIAL_ROOMS.filter(r => r.propertyId === 'prop-1070-yank');
      if (yankRooms.length > 0) {
        rooms = [...yankRooms, ...rooms];
      }
    }

    // Ensure Room 1 is named Bedroom suite, and strip any rejected sample tenant names
    rooms = rooms.map(room => {
      if (room.id === 'room-yank-1' || room.roomNumber === '1') {
        return {
          ...room,
          id: 'room-yank-1',
          name: 'Bedroom suite'
        };
      }
      if (room.currentTenantName && typeof room.currentTenantName === 'string' && REJECTED_SAMPLE_TENANT_NAMES.has(room.currentTenantName.toLowerCase().trim())) {
        return {
          ...room,
          status: 'Available',
          currentTenantId: undefined,
          currentTenantFirstName: undefined,
          currentTenantLastName: undefined,
          currentTenantName: undefined,
          currentTenantEmail: undefined,
          currentTenantPhone: undefined,
          squareCustomerId: undefined,
          leaseStartDate: undefined,
          leaseEndDate: undefined
        };
      }
      return room;
    });

    if (JSON.stringify(rooms) !== JSON.stringify(raw)) {
      this.saveRooms(rooms);
    }

    return rooms.map(room => {
      let fName = room.currentTenantFirstName;
      let lName = room.currentTenantLastName;
      if (!fName && !lName && room.currentTenantName) {
        const split = splitFullName(room.currentTenantName);
        fName = split.firstName;
        lName = split.lastName;
      }
      const fullName = formatFullName(fName, lName, room.currentTenantName || '');
      return {
        ...room,
        currentTenantFirstName: fName,
        currentTenantLastName: lName,
        currentTenantName: fullName || undefined
      };
    });
  },
  saveRooms(rooms: Room[]): void {
    const normalized = rooms.map(room => {
      const fullName = formatFullName(room.currentTenantFirstName, room.currentTenantLastName, room.currentTenantName || '');
      return {
        ...room,
        currentTenantName: fullName || undefined
      };
    });
    setItem(STORAGE_KEYS.ROOMS, normalized);
  },

  // Renewals
  getRenewals(): LeaseRenewal[] {
    const raw = getItem<LeaseRenewal[]>(STORAGE_KEYS.RENEWALS, INITIAL_RENEWALS);
    const filtered = raw.filter(ren => 
      !LEGACY_SAMPLE_RENEWAL_IDS.has(ren.id) && 
      !REJECTED_SAMPLE_RENEWAL_IDS.has(ren.id) &&
      !REJECTED_SAMPLE_TENANT_NAMES.has(typeof ren.tenantName === 'string' ? ren.tenantName.toLowerCase().trim() : '') &&
      ren.propertyId !== 'prop-1' && ren.propertyId !== 'prop-2' && ren.propertyId !== 'prop-3'
    );
    let renewals = filtered;
    if (renewals.length !== raw.length) {
      this.saveRenewals(renewals);
    }
    return renewals.map(renewal => {
      let fName = renewal.tenantFirstName;
      let lName = renewal.tenantLastName;
      if (!fName && !lName && renewal.tenantName) {
        const split = splitFullName(renewal.tenantName);
        fName = split.firstName;
        lName = split.lastName;
      }
      const fullName = formatFullName(fName, lName, renewal.tenantName);
      return {
        ...renewal,
        tenantFirstName: fName,
        tenantLastName: lName,
        tenantName: fullName
      };
    });
  },
  getLeaseRenewals(): LeaseRenewal[] {
    return this.getRenewals();
  },
  saveRenewals(renewals: LeaseRenewal[]): void {
    const normalized = renewals.map(renewal => {
      const fullName = formatFullName(renewal.tenantFirstName, renewal.tenantLastName, renewal.tenantName);
      return {
        ...renewal,
        tenantName: fullName
      };
    });
    setItem(STORAGE_KEYS.RENEWALS, normalized);
  },
  saveLeaseRenewals(renewals: LeaseRenewal[]): void {
    this.saveRenewals(renewals);
  },

  // Work Orders
  getWorkOrders(): WorkOrder[] {
    const raw = getItem<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
    const filtered = raw.filter(wo => !LEGACY_SAMPLE_WORK_ORDER_IDS.has(wo.id) && wo.propertyId !== 'prop-1' && wo.propertyId !== 'prop-2' && wo.propertyId !== 'prop-3');
    if (filtered.length !== raw.length) {
      this.saveWorkOrders(filtered);
    }
    return filtered.map(wo => {
      let fName = wo.reportedByFirstName;
      let lName = wo.reportedByLastName;
      if (!fName && !lName && wo.reportedByName) {
        const split = splitFullName(wo.reportedByName);
        fName = split.firstName;
        lName = split.lastName;
      }
      const fullName = formatFullName(fName, lName, wo.reportedByName);
      return {
        ...wo,
        reportedByFirstName: fName,
        reportedByLastName: lName,
        reportedByName: fullName
      };
    });
  },
  saveWorkOrders(workOrders: WorkOrder[]): void {
    const normalized = workOrders.map(wo => {
      const fullName = formatFullName(wo.reportedByFirstName, wo.reportedByLastName, wo.reportedByName);
      return {
        ...wo,
        reportedByName: fullName
      };
    });
    setItem(STORAGE_KEYS.WORK_ORDERS, normalized);
  },

  // Leads
  getLeads(): TenantLead[] {
    const raw = getItem<TenantLead[]>(STORAGE_KEYS.LEADS, INITIAL_LEADS);
    // Filter out any legacy sample IDs
    const filtered = raw.filter(l => !LEGACY_SAMPLE_LEAD_IDS.has(l.id));
    if (filtered.length !== raw.length) {
      this.saveLeads(filtered);
    }
    return filtered.map(lead => {
      let fName = lead.firstName;
      let lName = lead.lastName;
      if (!fName && !lName && lead.name) {
        const split = splitFullName(lead.name);
        fName = split.firstName;
        lName = split.lastName;
      }
      const fullName = formatFullName(fName, lName, lead.name);
      return {
        ...lead,
        firstName: fName,
        lastName: lName,
        name: fullName
      };
    });
  },
  getTenantLeads(): TenantLead[] {
    return this.getLeads();
  },
  saveLeads(leads: TenantLead[]): void {
    const normalized = leads.map(lead => {
      const fullName = formatFullName(lead.firstName, lead.lastName, lead.name);
      return {
        ...lead,
        name: fullName
      };
    });
    setItem(STORAGE_KEYS.LEADS, normalized);
  },
  saveTenantLeads(leads: TenantLead[]): void {
    this.saveLeads(leads);
  },
  deleteLead(leadId: string): void {
    const nextLeads = this.getLeads().filter(l => l.id !== leadId);
    this.saveLeads(nextLeads);
  },
  clearLeads(): void {
    this.saveLeads([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem('moyer_crm_leads');
      localStorage.removeItem('moyer_leads');
      localStorage.removeItem('crm_leads');
      localStorage.removeItem('leads');
    } catch (e) {
      console.error('Error clearing leads from localStorage:', e);
    }
  },

  // Contacts
  getContacts(): Contact[] {
    const raw = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
    const filtered = raw.filter(c => 
      !LEGACY_SAMPLE_CONTACT_IDS.has(c.id) && 
      !REJECTED_SAMPLE_CONTACT_IDS.has(c.id) &&
      !REJECTED_SAMPLE_TENANT_NAMES.has(typeof c.name === 'string' ? c.name.toLowerCase().trim() : '') &&
      c.propertyId !== 'prop-1' && c.propertyId !== 'prop-2' && c.propertyId !== 'prop-3'
    );
    let contacts = filtered;
    if (contacts.length !== raw.length) {
      this.saveContacts(contacts);
    }
    return contacts.map(contact => {
      let fName = contact.firstName;
      let lName = contact.lastName;
      if (!fName && !lName && contact.name) {
        const split = splitFullName(contact.name);
        fName = split.firstName;
        lName = split.lastName;
      }
      const fullName = formatFullName(fName, lName, contact.name);
      return {
        ...contact,
        firstName: fName,
        lastName: lName,
        name: fullName
      };
    });
  },
  saveContacts(contacts: Contact[]): void {
    const normalized = contacts.map(contact => {
      const fullName = formatFullName(contact.firstName, contact.lastName, contact.name);
      return {
        ...contact,
        name: fullName
      };
    });
    setItem(STORAGE_KEYS.CONTACTS, normalized);
  },
  deleteContact(contactId: string): void {
    const nextContacts = this.getContacts().filter(c => c.id !== contactId);
    this.saveContacts(nextContacts);
  },

  // Invoices
  getInvoices(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  },
  saveInvoices(invoices: Invoice[]): void {
    setItem(STORAGE_KEYS.INVOICES, invoices);
  },
  deleteInvoice(invoiceId: string): void {
    const next = this.getInvoices().filter(inv => inv.id !== invoiceId);
    this.saveInvoices(next);
  },

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    const raw = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    const filtered = raw.filter(a => !LEGACY_SAMPLE_ACTIVITY_LOG_IDS.has(a.id) && !a.message?.includes('Chloe Davenport') && !a.message?.includes('Liam O\'Connor') && !a.message?.includes('Highlands') && !a.message?.includes('Speer'));
    if (filtered.length !== raw.length) {
      this.saveActivityLogs(filtered);
    }
    return filtered;
  },
  saveActivityLogs(logs: ActivityLog[]): void {
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },
  addActivityLog(log: ActivityLog): void {
    const current = this.getActivityLogs();
    this.saveActivityLogs([log, ...current]);
  },

  // Clear all data
  clearAll(): void {
    setItem(STORAGE_KEYS.PROPERTIES, []);
    setItem(STORAGE_KEYS.ROOMS, []);
    setItem(STORAGE_KEYS.RENEWALS, []);
    setItem(STORAGE_KEYS.WORK_ORDERS, []);
    setItem(STORAGE_KEYS.LEADS, []);
    setItem(STORAGE_KEYS.CONTACTS, []);
    setItem(STORAGE_KEYS.INVOICES, []);
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
    try {
      localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.RENEWALS);
      localStorage.removeItem(STORAGE_KEYS.WORK_ORDERS);
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.CONTACTS);
      localStorage.removeItem(STORAGE_KEYS.INVOICES);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
      localStorage.removeItem('moyer_crm_leads');
      localStorage.removeItem('moyer_leads');
      localStorage.removeItem('crm_leads');
      localStorage.removeItem('leads');
    } catch (e) {
      console.error('Error clearing localStorage keys:', e);
    }
  },
  resetAll(): void {
    this.clearAll();
  },
  resetToCleanSlate(): void {
    this.saveProperties(INITIAL_PROPERTIES);
    this.saveRooms(INITIAL_ROOMS);
    this.saveRenewals(INITIAL_RENEWALS);
    this.saveWorkOrders(INITIAL_WORK_ORDERS);
    this.saveLeads(INITIAL_LEADS);
    this.saveContacts(INITIAL_CONTACTS);
    this.saveInvoices([]);
    this.saveActivityLogs(INITIAL_ACTIVITY_LOGS);
  },
  resetToDemoData(): void {
    this.saveProperties(DEMO_DATASET.properties);
    this.saveRooms(DEMO_DATASET.rooms);
    this.saveRenewals(DEMO_DATASET.renewals);
    this.saveWorkOrders(DEMO_DATASET.workOrders);
    this.saveLeads(DEMO_DATASET.leads);
    this.saveContacts(DEMO_DATASET.contacts);
    this.saveInvoices([]);
    this.saveActivityLogs(DEMO_DATASET.activityLogs);
  },
  resetToSeedData(): void {
    this.resetToCleanSlate();
  },

  // Export full CRM database state
  exportDatabaseJSON(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      properties: this.getProperties(),
      rooms: this.getRooms(),
      renewals: this.getRenewals(),
      workOrders: this.getWorkOrders(),
      leads: this.getLeads(),
      contacts: this.getContacts(),
      invoices: this.getInvoices(),
      activityLogs: this.getActivityLogs()
    };
    return JSON.stringify(backup, null, 2);
  },
  exportAllData(): string {
    return this.exportDatabaseJSON();
  },

  // Import CRM database state
  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && typeof data === 'object') {
        this.saveProperties(data.properties || []);
        this.saveRooms(data.rooms || []);
        this.saveRenewals(data.renewals || []);
        this.saveWorkOrders(data.workOrders || []);
        this.saveLeads(data.leads || []);
        this.saveContacts(data.contacts || []);
        if (data.invoices) this.saveInvoices(data.invoices);
        this.saveActivityLogs(data.activityLogs || []);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  importData(jsonStr: string): boolean {
    return this.importDatabaseJSON(jsonStr);
  }
};
