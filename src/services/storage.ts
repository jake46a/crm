import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact, ActivityLog } from '../types';
import {
  INITIAL_PROPERTIES,
  INITIAL_ROOMS,
  INITIAL_RENEWALS,
  INITIAL_WORK_ORDERS,
  INITIAL_LEADS,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';
import { splitFullName, formatFullName } from '../utils/nameUtils';

const STORAGE_KEYS = {
  PROPERTIES: 'moyer_crm_properties_v3',
  ROOMS: 'moyer_crm_rooms_v3',
  RENEWALS: 'moyer_crm_renewals_v3',
  WORK_ORDERS: 'moyer_crm_workorders_v3',
  LEADS: 'moyer_crm_leads_v3',
  CONTACTS: 'moyer_crm_contacts_v3',
  ACTIVITY_LOGS: 'moyer_crm_activity_logs_v3'
};

const LEGACY_SAMPLE_LEAD_IDS = new Set([
  'lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5', 'lead-6', 'lead-7', 'lead-8'
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
    return getItem<Property[]>(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
  },
  saveProperties(properties: Property[]): void {
    setItem(STORAGE_KEYS.PROPERTIES, properties);
  },
  
  // Rooms
  getRooms(): Room[] {
    const rooms = getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
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
    const renewals = getItem<LeaseRenewal[]>(STORAGE_KEYS.RENEWALS, INITIAL_RENEWALS);
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
    const workOrders = getItem<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
    return workOrders.map(wo => {
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
    const contacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
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

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
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
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
    try {
      localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.RENEWALS);
      localStorage.removeItem(STORAGE_KEYS.WORK_ORDERS);
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.CONTACTS);
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
  resetToSeedData(): void {
    this.saveProperties(INITIAL_PROPERTIES);
    this.saveRooms(INITIAL_ROOMS);
    this.saveRenewals(INITIAL_RENEWALS);
    this.saveWorkOrders(INITIAL_WORK_ORDERS);
    this.saveLeads(INITIAL_LEADS);
    this.saveContacts(INITIAL_CONTACTS);
    this.saveActivityLogs(INITIAL_ACTIVITY_LOGS);
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
