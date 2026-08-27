import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact, ActivityLog, LeadStage, RoomStatus } from '../types';
import {
  INITIAL_PROPERTIES,
  INITIAL_ROOMS,
  INITIAL_RENEWALS,
  INITIAL_WORK_ORDERS,
  INITIAL_LEADS,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';

const STORAGE_KEYS = {
  PROPERTIES: 'moyer_crm_properties_v2',
  ROOMS: 'moyer_crm_rooms_v2',
  RENEWALS: 'moyer_crm_renewals_v2',
  WORK_ORDERS: 'moyer_crm_workorders_v2',
  LEADS: 'moyer_crm_leads_v2',
  CONTACTS: 'moyer_crm_contacts_v2',
  ACTIVITY_LOGS: 'moyer_crm_activity_logs_v2'
};

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
    return getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
  },
  saveRooms(rooms: Room[]): void {
    setItem(STORAGE_KEYS.ROOMS, rooms);
  },

  // Renewals
  getRenewals(): LeaseRenewal[] {
    return getItem<LeaseRenewal[]>(STORAGE_KEYS.RENEWALS, INITIAL_RENEWALS);
  },
  getLeaseRenewals(): LeaseRenewal[] {
    return this.getRenewals();
  },
  saveRenewals(renewals: LeaseRenewal[]): void {
    setItem(STORAGE_KEYS.RENEWALS, renewals);
  },
  saveLeaseRenewals(renewals: LeaseRenewal[]): void {
    this.saveRenewals(renewals);
  },

  // Work Orders
  getWorkOrders(): WorkOrder[] {
    return getItem<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
  },
  saveWorkOrders(workOrders: WorkOrder[]): void {
    setItem(STORAGE_KEYS.WORK_ORDERS, workOrders);
  },

  // Leads
  getLeads(): TenantLead[] {
    return getItem<TenantLead[]>(STORAGE_KEYS.LEADS, INITIAL_LEADS);
  },
  getTenantLeads(): TenantLead[] {
    return this.getLeads();
  },
  saveLeads(leads: TenantLead[]): void {
    setItem(STORAGE_KEYS.LEADS, leads);
  },
  saveTenantLeads(leads: TenantLead[]): void {
    this.saveLeads(leads);
  },

  // Contacts
  getContacts(): Contact[] {
    return getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
  },
  saveContacts(contacts: Contact[]): void {
    setItem(STORAGE_KEYS.CONTACTS, contacts);
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

  // Reset to sample data
  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.RENEWALS);
    localStorage.removeItem(STORAGE_KEYS.WORK_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  },
  resetToSeedData(): void {
    this.resetAll();
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
      if (data.properties && data.rooms) {
        if (data.properties) this.saveProperties(data.properties);
        if (data.rooms) this.saveRooms(data.rooms);
        if (data.renewals) this.saveRenewals(data.renewals);
        if (data.workOrders) this.saveWorkOrders(data.workOrders);
        if (data.leads) this.saveLeads(data.leads);
        if (data.contacts) this.saveContacts(data.contacts);
        if (data.activityLogs) this.saveActivityLogs(data.activityLogs);
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
