import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  FileText, 
  Wrench, 
  Users2, 
  Contact as ContactIcon, 
  Sparkles,
  Database
} from 'lucide-react';

import { 
  Property, 
  Room, 
  LeaseRenewal, 
  WorkOrder, 
  TenantLead, 
  Contact, 
  ActivityLog,
  NavigationTab,
  Invoice
} from './types';

import { StorageService } from './services/storage';
import { 
  FirebaseService,
  subscribeToProperties,
  subscribeToRooms,
  subscribeToRenewals,
  subscribeToWorkOrders,
  subscribeToLeads,
  subscribeToContacts,
  subscribeToActivityLogs,
  subscribeToInvoices
} from './services/firebase';
import { useFirebase } from './context/FirebaseContext';

// Views
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PropertiesRoomsView } from './components/PropertiesRoomsView';
import { InvoicingView } from './components/invoicing/InvoicingView';
import { LeaseRenewalsView } from './components/LeaseRenewalsView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { LeadsPipelineView } from './components/LeadsPipelineView';
import { ContactsView } from './components/ContactsView';

// Modals
import { AiAssistantModal } from './components/AiAssistantModal';
import { NewWorkOrderModal } from './components/modals/NewWorkOrderModal';
import { NewLeadModal } from './components/modals/NewLeadModal';
import { NewRenewalModal } from './components/modals/NewRenewalModal';
import { NewPropertyModal } from './components/modals/NewPropertyModal';
import { DeletePropertyModal } from './components/modals/DeletePropertyModal';
import { NewRoomModal } from './components/modals/NewRoomModal';
import { NewContactModal } from './components/modals/NewContactModal';
import { ConvertLeadModal } from './components/modals/ConvertLeadModal';
import { RenewalNoticeLetterModal } from './components/modals/RenewalNoticeLetterModal';
import { PrintWorkOrderModal } from './components/modals/PrintWorkOrderModal';
import { LeadDetailModal } from './components/modals/LeadDetailModal';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { PrintSchemaModal } from './components/modals/PrintSchemaModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Core Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [renewals, setRenewals] = useState<LeaseRenewal[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [leads, setLeads] = useState<TenantLead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modal State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);
  const [isPrintSchemaOpen, setIsPrintSchemaOpen] = useState<boolean>(false);

  // Work Order Modal & Print
  const [isNewWorkOrderModalOpen, setIsNewWorkOrderModalOpen] = useState<boolean>(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [defaultRoomForWO, setDefaultRoomForWO] = useState<Room | null>(null);
  const [selectedWorkOrderForPrint, setSelectedWorkOrderForPrint] = useState<WorkOrder | null>(null);

  // Lead Modal & Detail
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<TenantLead | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<TenantLead | null>(null);
  const [selectedLeadToConvert, setSelectedLeadToConvert] = useState<TenantLead | null>(null);

  // Renewal Modal & Letter
  const [isNewRenewalModalOpen, setIsNewRenewalModalOpen] = useState<boolean>(false);
  const [editingRenewal, setEditingRenewal] = useState<LeaseRenewal | null>(null);
  const [selectedRenewalForLetter, setSelectedRenewalForLetter] = useState<LeaseRenewal | null>(null);

  // Property & Room Modals
  const [isNewPropertyModalOpen, setIsNewPropertyModalOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeletePropertyModalOpen, setIsDeletePropertyModalOpen] = useState<boolean>(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [defaultPropertyIdForRoom, setDefaultPropertyIdForRoom] = useState<string | undefined>(undefined);

  // Contact Modal
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initial Load from localStorage & Firebase Listeners
  const loadAllData = () => {
    setProperties(StorageService.getProperties());
    setRooms(StorageService.getRooms());
    setRenewals(StorageService.getLeaseRenewals());
    setWorkOrders(StorageService.getWorkOrders());
    setLeads(StorageService.getTenantLeads());
    setContacts(StorageService.getContacts());
    setActivityLogs(StorageService.getActivityLogs());
    setInvoices(StorageService.getInvoices());
  };

  useEffect(() => {
    // 1. Instant local cache load
    loadAllData();

    // 2. Ensure initial seed if Firestore empty
    FirebaseService.seedInitialDataIfEmpty().catch(() => {});

    // 3. Real-time Firebase Sync Listeners
    const unsubProperties = subscribeToProperties((liveProps) => {
      if (liveProps) {
        setProperties(liveProps);
        StorageService.saveProperties(liveProps);
      }
    });

    const unsubRooms = subscribeToRooms((liveRooms) => {
      if (liveRooms) {
        setRooms(liveRooms);
        StorageService.saveRooms(liveRooms);
      }
    });

    const unsubRenewals = subscribeToRenewals((liveRenewals) => {
      if (liveRenewals) {
        setRenewals(liveRenewals);
        StorageService.saveLeaseRenewals(liveRenewals);
      }
    });

    const unsubWorkOrders = subscribeToWorkOrders((liveWOs) => {
      if (liveWOs) {
        setWorkOrders(liveWOs);
        StorageService.saveWorkOrders(liveWOs);
      }
    });

    const unsubLeads = subscribeToLeads((liveLeads) => {
      if (liveLeads) {
        const legacyMockIds = new Set(['lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5', 'lead-6', 'lead-7', 'lead-8']);
        const cleaned = liveLeads.filter(l => !legacyMockIds.has(l.id));
        // Delete any legacy demo leads from Firestore if they were previously seeded
        liveLeads.forEach(l => {
          if (legacyMockIds.has(l.id)) {
            FirebaseService.deleteLead(l.id).catch(() => {});
          }
        });
        setLeads(cleaned);
        StorageService.saveTenantLeads(cleaned);
      }
    });

    const unsubContacts = subscribeToContacts((liveContacts) => {
      if (liveContacts) {
        setContacts(liveContacts);
        StorageService.saveContacts(liveContacts);
      }
    });

    const unsubLogs = subscribeToActivityLogs((liveLogs) => {
      if (liveLogs) {
        setActivityLogs(liveLogs);
        StorageService.saveActivityLogs(liveLogs);
      }
    });

    const unsubInvoices = subscribeToInvoices((liveInvoices) => {
      if (liveInvoices) {
        setInvoices(liveInvoices);
        StorageService.saveInvoices(liveInvoices);
      }
    });

    return () => {
      unsubProperties();
      unsubRooms();
      unsubRenewals();
      unsubWorkOrders();
      unsubLeads();
      unsubContacts();
      unsubLogs();
      unsubInvoices();
    };
  }, []);

  // Helper to log actions
  const logActivity = (category: ActivityLog['category'], message: string, entityId?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      category,
      message,
      user: 'Jake Moyer',
      entityId
    };
    StorageService.addActivityLog(newLog);
    FirebaseService.addActivityLog(newLog).catch(err => console.warn("Firestore log sync err:", err));
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // ===================== CRUD HANDLERS =====================

  // Room Update & Recalculate Property Stats
  const handleSaveRoom = (updatedRoom: Room) => {
    const isExisting = rooms.some(r => r.id === updatedRoom.id);
    let nextRooms: Room[];
    if (isExisting) {
      nextRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    } else {
      nextRooms = [...rooms, updatedRoom];
    }
    setRooms(nextRooms);
    StorageService.saveRooms(nextRooms);
    FirebaseService.saveRoom(updatedRoom).catch(err => console.warn("Firestore save room err:", err));

    // Recalculate property totals
    const nextProperties = properties.map(p => {
      const propRooms = nextRooms.filter(r => r.propertyId === p.id);
      const occupied = propRooms.filter(r => r.status === 'Occupied').length;
      const totalRev = propRooms.reduce((sum, r) => sum + r.monthlyRent, 0);
      const updatedP = {
        ...p,
        totalRooms: propRooms.length,
        occupiedRooms: occupied,
        monthlyRevenueEstimate: totalRev
      };
      if (p.id === updatedRoom.propertyId) {
        FirebaseService.saveProperty(updatedP).catch(err => console.warn("Firestore save prop err:", err));
      }
      return updatedP;
    });
    setProperties(nextProperties);
    StorageService.saveProperties(nextProperties);

    logActivity('Room', `Room ${updatedRoom.name} status is now ${updatedRoom.status} at $${updatedRoom.monthlyRent}/mo`, updatedRoom.id);
    showToast(`Saved room: ${updatedRoom.name}`);
  };

  // Property Save
  const handleSaveProperty = (prop: Property) => {
    const isExisting = properties.some(p => p.id === prop.id);
    let nextProps: Property[];
    if (isExisting) {
      nextProps = properties.map(p => p.id === prop.id ? prop : p);
    } else {
      nextProps = [...properties, prop];
    }
    setProperties(nextProps);
    StorageService.saveProperties(nextProps);
    FirebaseService.saveProperty(prop).catch(err => console.warn("Firestore save prop err:", err));
    logActivity('System', `Property Saved: ${prop.name} (${prop.address}, ${prop.city})`, prop.id);
    showToast(`Saved property: ${prop.name}`);
  };

  // Property Deletion (Cascading: deletes property and all associated rooms)
  const handleDeleteProperty = (propertyId: string) => {
    const targetProp = properties.find(p => p.id === propertyId);
    const propName = targetProp?.name || 'Property';
    const associatedRooms = rooms.filter(r => r.propertyId === propertyId);

    // 1. Remove property
    const nextProperties = properties.filter(p => p.id !== propertyId);
    setProperties(nextProperties);
    StorageService.saveProperties(nextProperties);
    FirebaseService.deleteProperty(propertyId).catch(err => console.warn("Firestore delete prop err:", err));

    // 2. Cascade remove all rooms belonging to this property
    const nextRooms = rooms.filter(r => r.propertyId !== propertyId);
    setRooms(nextRooms);
    StorageService.saveRooms(nextRooms);
    associatedRooms.forEach(r => {
      FirebaseService.deleteRoom(r.id).catch(err => console.warn("Firestore delete room err:", err));
    });

    // 3. Remove associated work orders
    const associatedWOs = workOrders.filter(w => w.propertyId === propertyId);
    const nextWorkOrders = workOrders.filter(w => w.propertyId !== propertyId);
    setWorkOrders(nextWorkOrders);
    StorageService.saveWorkOrders(nextWorkOrders);
    associatedWOs.forEach(w => {
      FirebaseService.deleteWorkOrder(w.id).catch(err => console.warn("Firestore delete wo err:", err));
    });

    // 4. Remove associated lease renewals
    const associatedRenewals = renewals.filter(ren => ren.propertyId === propertyId);
    const nextRenewals = renewals.filter(ren => ren.propertyId !== propertyId);
    setRenewals(nextRenewals);
    StorageService.saveLeaseRenewals(nextRenewals);
    associatedRenewals.forEach(ren => {
      FirebaseService.deleteRenewal(ren.id).catch(err => console.warn("Firestore delete renewal err:", err));
    });

    logActivity('System', `Property Deleted: ${propName} and ${associatedRooms.length} room(s) removed`, propertyId);
    showToast(`Deleted ${propName} & ${associatedRooms.length} associated room(s)`);
  };

  // Room Deletion
  const handleDeleteRoom = (roomId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const nextRooms = rooms.filter(r => r.id !== roomId);
    setRooms(nextRooms);
    StorageService.saveRooms(nextRooms);
    FirebaseService.deleteRoom(roomId).catch(err => console.warn("Firestore delete room err:", err));

    // Recalculate property totals
    const nextProperties = properties.map(p => {
      const propRooms = nextRooms.filter(r => r.propertyId === p.id);
      const occupied = propRooms.filter(r => r.status === 'Occupied').length;
      const totalRev = propRooms.reduce((sum, r) => sum + r.monthlyRent, 0);
      const updatedP = {
        ...p,
        totalRooms: propRooms.length,
        occupiedRooms: occupied,
        monthlyRevenueEstimate: totalRev
      };
      if (p.id === targetRoom.propertyId) {
        FirebaseService.saveProperty(updatedP).catch(err => console.warn("Firestore save prop stats err:", err));
      }
      return updatedP;
    });
    setProperties(nextProperties);
    StorageService.saveProperties(nextProperties);

    logActivity('Room', `Deleted Room: ${targetRoom.name} (${targetRoom.propertyName})`, roomId);
    showToast(`Deleted room: ${targetRoom.name}`);
  };

  // Lease Renewal Save / Update
  const handleSaveRenewal = (ren: LeaseRenewal) => {
    const isExisting = renewals.some(r => r.id === ren.id);
    let nextRenewals: LeaseRenewal[];
    if (isExisting) {
      nextRenewals = renewals.map(r => r.id === ren.id ? ren : r);
    } else {
      nextRenewals = [ren, ...renewals];
    }
    setRenewals(nextRenewals);
    StorageService.saveLeaseRenewals(nextRenewals);
    FirebaseService.saveRenewal(ren).catch(err => console.warn("Firestore save renewal err:", err));

    // If accepted / signed, also update room rent & lease end date
    if (ren.renewalStatus === 'Tenant Accepted' || ren.renewalStatus === 'Renewed Signed') {
      const targetRoom = rooms.find(r => r.id === ren.roomId);
      if (targetRoom) {
        const nextEndDate = new Date(ren.currentLeaseEndDate);
        nextEndDate.setMonth(nextEndDate.getMonth() + ren.proposedTermMonths);
        const updatedRoom: Room = {
          ...targetRoom,
          monthlyRent: ren.proposedMonthlyRent,
          leaseEndDate: nextEndDate.toISOString().split('T')[0]
        };
        handleSaveRoom(updatedRoom);
      }
    }

    logActivity('Lease', `Lease Renewal for ${ren.tenantName}: Status is ${ren.renewalStatus} ($${ren.proposedMonthlyRent}/mo)`, ren.id);
    showToast(`Updated renewal for ${ren.tenantName}`);
  };

  // Lease Renewal Deletion
  const handleDeleteRenewal = (renewalId: string) => {
    const target = renewals.find(r => r.id === renewalId);
    const name = target?.tenantName || 'Lease';
    const nextRenewals = renewals.filter(r => r.id !== renewalId);
    setRenewals(nextRenewals);
    StorageService.saveLeaseRenewals(nextRenewals);
    FirebaseService.deleteRenewal(renewalId).catch(err => console.warn("Firestore delete renewal err:", err));
    logActivity('Lease', `Deleted Lease Renewal Card for: ${name}`, renewalId);
    showToast(`Deleted renewal card for ${name}`);
  };

  // Lease Renewal Deduplication Bulk Deletion
  const handleDeleteDuplicateRenewals = (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    const idSet = new Set(idsToDelete);
    const nextRenewals = renewals.filter(r => !idSet.has(r.id));
    setRenewals(nextRenewals);
    StorageService.saveLeaseRenewals(nextRenewals);
    idsToDelete.forEach(id => {
      FirebaseService.deleteRenewal(id).catch(err => console.warn("Firestore delete duplicate renewal err:", err));
    });
    logActivity('Lease', `Cleaned ${idsToDelete.length} duplicate lease cards`, 'system');
    showToast(`Successfully deleted ${idsToDelete.length} duplicate lease card${idsToDelete.length === 1 ? '' : 's'}.`);
  };

  // Work Order Save / Update
  const handleSaveWorkOrder = (wo: WorkOrder) => {
    const isExisting = workOrders.some(w => w.id === wo.id);
    let nextWorkOrders: WorkOrder[];
    if (isExisting) {
      nextWorkOrders = workOrders.map(w => w.id === wo.id ? wo : w);
    } else {
      nextWorkOrders = [wo, ...workOrders];
    }
    setWorkOrders(nextWorkOrders);
    StorageService.saveWorkOrders(nextWorkOrders);
    FirebaseService.saveWorkOrder(wo).catch(err => console.warn("Firestore save work order err:", err));
    logActivity('Maintenance', `Work Order ${wo.ticketNumber}: ${wo.title} (${wo.status})`, wo.id);
    showToast(`Work order ${wo.ticketNumber} saved`);
  };

  // Work Order Deletion
  const handleDeleteWorkOrder = (workOrderId: string) => {
    const target = workOrders.find(w => w.id === workOrderId);
    const title = target?.title || 'Work Order';
    const nextWorkOrders = workOrders.filter(w => w.id !== workOrderId);
    setWorkOrders(nextWorkOrders);
    StorageService.saveWorkOrders(nextWorkOrders);
    FirebaseService.deleteWorkOrder(workOrderId).catch(err => console.warn("Firestore delete work order err:", err));
    logActivity('Maintenance', `Deleted Work Order: ${title}`, workOrderId);
    showToast(`Deleted work order: ${title}`);
  };

  // Tenant Lead Save / Update
  const handleSaveLead = (lead: TenantLead) => {
    const isExisting = leads.some(l => l.id === lead.id);
    let nextLeads: TenantLead[];
    if (isExisting) {
      nextLeads = leads.map(l => l.id === lead.id ? lead : l);
      if (selectedLeadDetail?.id === lead.id) {
        setSelectedLeadDetail(lead);
      }
    } else {
      nextLeads = [lead, ...leads];
    }
    setLeads(nextLeads);
    StorageService.saveTenantLeads(nextLeads);
    FirebaseService.saveLead(lead).catch(err => console.warn("Firestore save lead err:", err));
    logActivity('Lead', `Tenant Lead ${lead.name}: Stage is ${lead.stage} (Score: ★${lead.score})`, lead.id);
    showToast(`Lead saved: ${lead.name}`);
  };

  // Tenant Lead Deletion
  const handleDeleteLead = (leadId: string) => {
    const targetLead = leads.find(l => l.id === leadId);
    const leadName = targetLead?.name || 'Lead';
    const nextLeads = leads.filter(l => l.id !== leadId);
    setLeads(nextLeads);
    StorageService.saveTenantLeads(nextLeads);
    FirebaseService.deleteLead(leadId).catch(err => console.warn("Firestore delete lead err:", err));
    if (selectedLeadDetail?.id === leadId) {
      setSelectedLeadDetail(null);
    }
    logActivity('Lead', `Deleted Tenant Lead: ${leadName}`, leadId);
    showToast(`Deleted lead: ${leadName}`);
  };

  // Clear All Leads
  const handleClearAllLeads = async () => {
    StorageService.clearLeads();
    setLeads([]);
    try {
      await FirebaseService.clearLeads();
    } catch (err) {
      console.warn("Firestore clear leads err:", err);
    }
    if (selectedLeadDetail) {
      setSelectedLeadDetail(null);
    }
    logActivity('Lead', `Cleared all tenant leads`, 'system');
    showToast('All tenant leads cleared.');
  };

  // Contact Save / Update
  const handleSaveContact = (contact: Contact) => {
    const isExisting = contacts.some(c => c.id === contact.id);
    let nextContacts: Contact[];
    if (isExisting) {
      nextContacts = contacts.map(c => c.id === contact.id ? contact : c);
    } else {
      nextContacts = [contact, ...contacts];
    }
    setContacts(nextContacts);
    StorageService.saveContacts(nextContacts);
    FirebaseService.saveContact(contact).catch(err => console.warn("Firestore save contact err:", err));
    logActivity('System', `Contact Saved: ${contact.name} (${contact.type})`, contact.id);
    showToast(`Contact saved: ${contact.name}`);
  };

  // Contact Delete
  const handleDeleteContact = (contactId: string) => {
    const targetContact = contacts.find(c => c.id === contactId);
    const contactName = targetContact?.name || 'Contact';
    const nextContacts = contacts.filter(c => c.id !== contactId);
    setContacts(nextContacts);
    StorageService.deleteContact(contactId);
    FirebaseService.deleteContact(contactId).catch(err => console.warn("Firestore delete contact err:", err));
    logActivity('System', `Deleted Contact: ${contactName}`, contactId);
    showToast(`Deleted contact: ${contactName}`);
  };

  // Convert Lead to Resident
  const handleConvertLead = (
    lead: TenantLead,
    selectedRoom: Room,
    leaseStartDate: string,
    leaseEndDate: string,
    agreedRent: number,
    securityDeposit: number
  ) => {
    // 1. Update Room
    const updatedRoom: Room = {
      ...selectedRoom,
      status: 'Occupied',
      currentTenantId: `tenant-${Date.now()}`,
      currentTenantName: lead.name,
      currentTenantPhone: lead.phone,
      leaseStartDate,
      leaseEndDate,
      monthlyRent: agreedRent,
      securityDeposit
    };
    handleSaveRoom(updatedRoom);

    // 2. Update Lead
    const updatedLead: TenantLead = {
      ...lead,
      stage: 'Signed / Converted',
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'stage_change',
          title: 'Converted to Tenant',
          content: `Assigned to ${selectedRoom.propertyName} (${selectedRoom.name}) at $${agreedRent}/mo from ${leaseStartDate} to ${leaseEndDate}.`,
          agent: 'Jake Moyer'
        },
        ...lead.activityHistory
      ]
    };
    handleSaveLead(updatedLead);

    // 3. Add to Contacts
    const newContact: Contact = {
      id: `con-${Date.now()}`,
      name: lead.name,
      type: 'Tenant',
      status: 'Active',
      email: lead.email,
      phone: lead.phone,
      propertyId: selectedRoom.propertyId,
      propertyName: selectedRoom.propertyName,
      roomName: selectedRoom.name,
      notes: `Converted from lead pipeline. Occupation: ${lead.occupation}`,
      avatarBg: 'bg-emerald-600'
    };
    handleSaveContact(newContact);

    // 4. Create Lease Renewal Tracking Record
    const end = new Date(leaseEndDate).getTime();
    const today = new Date().getTime();
    const daysUntil = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));

    const newRenewal: LeaseRenewal = {
      id: `ren-${Date.now()}`,
      tenantId: updatedRoom.currentTenantId!,
      tenantName: lead.name,
      tenantEmail: lead.email,
      tenantPhone: lead.phone,
      propertyId: selectedRoom.propertyId,
      propertyName: selectedRoom.propertyName,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      leaseStartDate,
      currentLeaseEndDate: leaseEndDate,
      daysUntilExpiration: daysUntil,
      currentMonthlyRent: agreedRent,
      proposedMonthlyRent: Math.round(agreedRent * 1.04),
      renewalStatus: 'Review Pending',
      renewalTermMonths: 12,
      proposedTermMonths: 12,
      decisionDeadline: new Date(end - 30 * 86400000).toISOString().split('T')[0],
      internalNotes: 'Initial lease signed after screening conversion'
    };
    handleSaveRenewal(newRenewal);

    logActivity('Lease', `New Resident Lease signed: ${lead.name} assigned to ${selectedRoom.name} at ${selectedRoom.propertyName}`, updatedRoom.id);
    showToast(`🎉 Converted ${lead.name} to active tenant in ${selectedRoom.name}!`);
  };

  const handleResetToChangedLogic = async () => {
    StorageService.resetToSeedData();
    try {
      await FirebaseService.resetToSeedData();
    } catch (err) {
      console.warn("Could not reset Firebase directly, updated localStorage:", err);
    }
    loadAllData();
    showToast('⚡ Reset portfolio with coliving month-to-month and 21-day notice test data!');
  };

  const handleResetDemoData = async () => {
    StorageService.clearAll();
    try {
      await FirebaseService.clearAllData();
    } catch (err) {
      console.warn("Could not clear Firebase directly, clearing local storage:", err);
    }
    setProperties([]);
    setRooms([]);
    setRenewals([]);
    setWorkOrders([]);
    setLeads([]);
    setContacts([]);
    setActivityLogs([]);
    setInvoices([]);
    showToast('All sample data deleted successfully.');
  };

  const handleSaveInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    StorageService.saveInvoices(newInvoices);
    logActivity('Invoicing', `Updated Square invoices records (${newInvoices.length} total)`);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status'], details?: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status, ...details } : inv));
    const current = StorageService.getInvoices();
    const updated = current.map(inv => inv.id === invoiceId ? { ...inv, status, ...details } : inv);
    StorageService.saveInvoices(updated);
  };

  // Urgent counts for header badges
  const urgentRenewalsCount = renewals.filter(
    r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)'
  ).length;

  const openWorkOrdersCount = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;

  return (
    <>
      {/* Sidebar & Top Navigation Layout Shell with Full Screen Content */}
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        renewals={renewals}
        workOrders={workOrders}
        leads={leads}
        rooms={rooms}
        properties={properties}
        contacts={contacts}
        onOpenNewWorkOrder={() => {
          setEditingWorkOrder(null);
          setDefaultRoomForWO(null);
          setIsNewWorkOrderModalOpen(true);
        }}
        onOpenNewLead={() => {
          setEditingLead(null);
          setIsNewLeadModalOpen(true);
        }}
        onOpenNewRenewal={() => {
          setEditingRenewal(null);
          setIsNewRenewalModalOpen(true);
        }}
        onOpenNewRoom={() => {
          setEditingRoom(null);
          setDefaultPropertyIdForRoom(undefined);
          setIsNewRoomModalOpen(true);
        }}
        onOpenNewContact={() => {
          setEditingContact(null);
          setIsNewContactModalOpen(true);
        }}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenPrintSchema={() => setIsPrintSchemaOpen(true)}
        onResetData={handleResetDemoData}
        onQuickNavigate={(tab) => setActiveTab(tab)}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-sm shadow-xl border border-zinc-750 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            properties={properties}
            rooms={rooms}
            renewals={renewals}
            workOrders={workOrders}
            leads={leads}
            activityLogs={activityLogs}
            onSelectTab={setActiveTab}
            onOpenRenewalLetterModal={(renewal) => setSelectedRenewalForLetter(renewal)}
            onOpenWorkOrderModal={(wo) => {
              setEditingWorkOrder(wo);
              setIsNewWorkOrderModalOpen(true);
            }}
            onOpenNewLeadModal={() => {
              setEditingLead(null);
              setIsNewLeadModalOpen(true);
            }}
            onOpenNewWorkOrderModal={() => {
              setEditingWorkOrder(null);
              setIsNewWorkOrderModalOpen(true);
            }}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onPrintWorkOrder={(wo) => setSelectedWorkOrderForPrint(wo)}
          />
        )}

        {/* Tab 2: Properties & Rooms */}
        {activeTab === 'properties' && (
          <PropertiesRoomsView
            properties={properties}
            rooms={rooms}
            leads={leads}
            onUpdateRoom={handleSaveRoom}
            onOpenNewRoomModal={(defaultPropId) => {
              setEditingRoom(null);
              setDefaultPropertyIdForRoom(defaultPropId);
              setIsNewRoomModalOpen(true);
            }}
            onOpenNewPropertyModal={() => {
              setEditingProperty(null);
              setIsNewPropertyModalOpen(true);
            }}
            onOpenDeletePropertyModal={(property) => {
              setPropertyToDelete(property || null);
              setIsDeletePropertyModalOpen(true);
            }}
            onOpenWorkOrderForRoom={(room) => {
              setEditingWorkOrder(null);
              setDefaultRoomForWO(room);
              setIsNewWorkOrderModalOpen(true);
            }}
            onOpenAssignLeadModal={(room) => {
              // Open convert modal with first qualified lead
              const qualifiedLead = leads.find(l => l.stage !== 'Signed / Converted') || leads[0];
              if (qualifiedLead) {
                setSelectedLeadToConvert(qualifiedLead);
              } else {
                setEditingLead(null);
                setIsNewLeadModalOpen(true);
              }
            }}
            onOpenEditRoomModal={(room) => {
              setEditingRoom(room);
              setIsNewRoomModalOpen(true);
            }}
            onOpenEditPropertyModal={(prop) => {
              setEditingProperty(prop);
              setIsNewPropertyModalOpen(true);
            }}
            onDeleteRoom={handleDeleteRoom}
          />
        )}

        {/* Tab: Square Invoicing & Payment Processing */}
        {activeTab === 'invoicing' && (
          <InvoicingView
            properties={properties}
            rooms={rooms}
            contacts={contacts}
            invoices={invoices}
            onSaveInvoices={handleSaveInvoices}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          />
        )}

        {/* Tab 3: Lease Renewals */}
        {activeTab === 'renewals' && (
          <LeaseRenewalsView
            renewals={renewals}
            rooms={rooms}
            properties={properties}
            onUpdateRenewal={handleSaveRenewal}
            onOpenNewRenewalModal={() => {
              setEditingRenewal(null);
              setIsNewRenewalModalOpen(true);
            }}
            onOpenEditRenewalModal={(renewal) => {
              setEditingRenewal(renewal);
              setIsNewRenewalModalOpen(true);
            }}
            onDeleteRenewal={handleDeleteRenewal}
            onDeleteDuplicateRenewals={handleDeleteDuplicateRenewals}
            onOpenRenewalLetterModal={(renewal) => setSelectedRenewalForLetter(renewal)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onResetToChangedLogic={handleResetToChangedLogic}
          />
        )}

        {/* Tab 4: Work Orders */}
        {activeTab === 'workorders' && (
          <WorkOrdersView
            workOrders={workOrders}
            properties={properties}
            rooms={rooms}
            contacts={contacts}
            onUpdateWorkOrder={handleSaveWorkOrder}
            onOpenNewWorkOrderModal={(defaultRoom) => {
              setEditingWorkOrder(null);
              setDefaultRoomForWO(defaultRoom || null);
              setIsNewWorkOrderModalOpen(true);
            }}
            onOpenEditWorkOrderModal={(wo) => {
              setEditingWorkOrder(wo);
              setIsNewWorkOrderModalOpen(true);
            }}
            onPrintWorkOrder={(wo) => setSelectedWorkOrderForPrint(wo)}
          />
        )}

        {/* Tab 5: Leads Pipeline */}
        {activeTab === 'leads' && (
          <LeadsPipelineView
            leads={leads}
            rooms={rooms}
            properties={properties}
            contacts={contacts}
            onUpdateLead={handleSaveLead}
            onOpenNewLeadModal={() => {
              setEditingLead(null);
              setIsNewLeadModalOpen(true);
            }}
            onOpenLeadDetailModal={(lead) => setSelectedLeadDetail(lead)}
            onOpenConvertLeadModal={(lead) => setSelectedLeadToConvert(lead)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onDeleteLead={handleDeleteLead}
            onClearAllLeads={handleClearAllLeads}
          />
        )}

        {/* Tab 6: Contacts Directory */}
        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            properties={properties}
            rooms={rooms}
            onUpdateContact={handleSaveContact}
            onDeleteContact={handleDeleteContact}
            onOpenNewContactModal={() => {
              setEditingContact(null);
              setIsNewContactModalOpen(true);
            }}
            onOpenEditContactModal={(contact) => {
              setEditingContact(contact);
              setIsNewContactModalOpen(true);
            }}
          />
        )}
      </Header>

      {/* ===================== ALL APPLICATION MODALS ===================== */}

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        properties={properties}
        rooms={rooms}
        renewals={renewals}
        workOrders={workOrders}
        leads={leads}
        contacts={contacts}
      />

      {/* New / Edit Work Order Modal */}
      <NewWorkOrderModal
        isOpen={isNewWorkOrderModalOpen}
        onClose={() => {
          setIsNewWorkOrderModalOpen(false);
          setEditingWorkOrder(null);
          setDefaultRoomForWO(null);
        }}
        properties={properties}
        rooms={rooms}
        contacts={contacts}
        onSave={handleSaveWorkOrder}
        editingWorkOrder={editingWorkOrder}
        defaultRoom={defaultRoomForWO}
        onDelete={handleDeleteWorkOrder}
        onPrint={(wo) => setSelectedWorkOrderForPrint(wo)}
      />

      {/* Print Work Order Slip Modal */}
      <PrintWorkOrderModal
        isOpen={!!selectedWorkOrderForPrint}
        onClose={() => setSelectedWorkOrderForPrint(null)}
        workOrder={selectedWorkOrderForPrint}
        properties={properties}
        rooms={rooms}
        contacts={contacts}
      />

      {/* New / Edit Tenant Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => {
          setIsNewLeadModalOpen(false);
          setEditingLead(null);
        }}
        properties={properties}
        contacts={contacts}
        onSave={handleSaveLead}
        editingLead={editingLead}
        onDeleteLead={handleDeleteLead}
      />

      {/* Lead Detail & Communication History Modal */}
      <LeadDetailModal
        isOpen={!!selectedLeadDetail}
        onClose={() => setSelectedLeadDetail(null)}
        lead={selectedLeadDetail}
        properties={properties}
        contacts={contacts}
        onUpdateLead={handleSaveLead}
        onConvertLead={(lead) => setSelectedLeadToConvert(lead)}
        onDeleteLead={handleDeleteLead}
      />

      {/* Convert Lead to Tenant Modal */}
      <ConvertLeadModal
        isOpen={!!selectedLeadToConvert}
        onClose={() => setSelectedLeadToConvert(null)}
        lead={selectedLeadToConvert}
        rooms={rooms}
        properties={properties}
        onConvert={handleConvertLead}
      />

      {/* New / Edit Lease Renewal Modal */}
      <NewRenewalModal
        isOpen={isNewRenewalModalOpen}
        onClose={() => {
          setIsNewRenewalModalOpen(false);
          setEditingRenewal(null);
        }}
        properties={properties}
        rooms={rooms}
        onSave={handleSaveRenewal}
        editingRenewal={editingRenewal}
        onDelete={handleDeleteRenewal}
      />

      {/* Renewal Formal Notice Letter Generator */}
      <RenewalNoticeLetterModal
        isOpen={!!selectedRenewalForLetter}
        onClose={() => setSelectedRenewalForLetter(null)}
        renewal={selectedRenewalForLetter}
        properties={properties}
        rooms={rooms}
        onMarkNoticeSent={(ren) => {
          handleSaveRenewal({
            ...ren,
            renewalStatus: 'Notice Sent',
            lastContactDate: new Date().toISOString().split('T')[0]
          });
        }}
      />

      {/* New / Edit Property Modal */}
      <NewPropertyModal
        isOpen={isNewPropertyModalOpen}
        onClose={() => {
          setIsNewPropertyModalOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        editingProperty={editingProperty}
        onDeleteProperty={handleDeleteProperty}
        onDeletePropertyRequest={(prop) => {
          setIsNewPropertyModalOpen(false);
          setEditingProperty(null);
          setPropertyToDelete(prop);
          setIsDeletePropertyModalOpen(true);
        }}
      />

      {/* Delete Property Modal (Cascade deletes property and all its rooms) */}
      <DeletePropertyModal
        isOpen={isDeletePropertyModalOpen}
        onClose={() => {
          setIsDeletePropertyModalOpen(false);
          setPropertyToDelete(null);
        }}
        properties={properties}
        rooms={rooms}
        onDeleteProperty={handleDeleteProperty}
        initialPropertyId={propertyToDelete?.id}
      />

      {/* New / Edit Room Modal */}
      <NewRoomModal
        isOpen={isNewRoomModalOpen}
        onClose={() => {
          setIsNewRoomModalOpen(false);
          setEditingRoom(null);
          setDefaultPropertyIdForRoom(undefined);
        }}
        properties={properties}
        onSave={handleSaveRoom}
        editingRoom={editingRoom}
        defaultPropertyId={defaultPropertyIdForRoom}
        onDeleteRoom={handleDeleteRoom}
        onOpenNewPropertyModal={() => setIsNewPropertyModalOpen(true)}
      />

      {/* New / Edit Contact Modal */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => {
          setIsNewContactModalOpen(false);
          setEditingContact(null);
        }}
        properties={properties}
        onSave={handleSaveContact}
        editingContact={editingContact}
        onDeleteContact={handleDeleteContact}
      />

      {/* Backup, Export & Import Data Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onDataReload={loadAllData}
        onOpenPrintSchema={() => setIsPrintSchemaOpen(true)}
      />

      {/* Printable Firestore Schema & Field Reference Modal */}
      <PrintSchemaModal
        isOpen={isPrintSchemaOpen}
        onClose={() => setIsPrintSchemaOpen(false)}
      />
    </>
  );
}
