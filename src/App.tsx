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
  NavigationTab
} from './types';

import { StorageService } from './services/storage';

// Views
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PropertiesRoomsView } from './components/PropertiesRoomsView';
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
import { LeadDetailModal } from './components/modals/LeadDetailModal';
import { ExportImportModal } from './components/modals/ExportImportModal';

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

  // Modal State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);

  // Work Order Modal
  const [isNewWorkOrderModalOpen, setIsNewWorkOrderModalOpen] = useState<boolean>(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [defaultRoomForWO, setDefaultRoomForWO] = useState<Room | null>(null);

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

  // Initial Load from localStorage
  const loadAllData = () => {
    setProperties(StorageService.getProperties());
    setRooms(StorageService.getRooms());
    setRenewals(StorageService.getLeaseRenewals());
    setWorkOrders(StorageService.getWorkOrders());
    setLeads(StorageService.getTenantLeads());
    setContacts(StorageService.getContacts());
    setActivityLogs(StorageService.getActivityLogs());
  };

  useEffect(() => {
    loadAllData();
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

    // Recalculate property totals
    const nextProperties = properties.map(p => {
      const propRooms = nextRooms.filter(r => r.propertyId === p.id);
      const occupied = propRooms.filter(r => r.status === 'Occupied').length;
      const totalRev = propRooms.reduce((sum, r) => sum + r.monthlyRent, 0);
      return {
        ...p,
        totalRooms: propRooms.length,
        occupiedRooms: occupied,
        monthlyRevenueEstimate: totalRev
      };
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

    // 2. Cascade remove all rooms belonging to this property
    const nextRooms = rooms.filter(r => r.propertyId !== propertyId);
    setRooms(nextRooms);
    StorageService.saveRooms(nextRooms);

    // 3. Remove associated work orders
    const nextWorkOrders = workOrders.filter(w => w.propertyId !== propertyId);
    setWorkOrders(nextWorkOrders);
    StorageService.saveWorkOrders(nextWorkOrders);

    // 4. Remove associated lease renewals
    const nextRenewals = renewals.filter(ren => ren.propertyId !== propertyId);
    setRenewals(nextRenewals);
    StorageService.saveLeaseRenewals(nextRenewals);

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

    // Recalculate property totals
    const nextProperties = properties.map(p => {
      const propRooms = nextRooms.filter(r => r.propertyId === p.id);
      const occupied = propRooms.filter(r => r.status === 'Occupied').length;
      const totalRev = propRooms.reduce((sum, r) => sum + r.monthlyRent, 0);
      return {
        ...p,
        totalRooms: propRooms.length,
        occupiedRooms: occupied,
        monthlyRevenueEstimate: totalRev
      };
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
    logActivity('Maintenance', `Work Order ${wo.ticketNumber}: ${wo.title} (${wo.status})`, wo.id);
    showToast(`Work order ${wo.ticketNumber} saved`);
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
    logActivity('Lead', `Tenant Lead ${lead.name}: Stage is ${lead.stage} (Score: ★${lead.score})`, lead.id);
    showToast(`Lead saved: ${lead.name}`);
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
    logActivity('System', `Contact Saved: ${contact.name} (${contact.type})`, contact.id);
    showToast(`Contact saved: ${contact.name}`);
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

  const handleResetDemoData = () => {
    StorageService.resetAll();
    loadAllData();
    showToast('Reset CRM to default demo data.');
  };

  // Urgent counts for header badges
  const urgentRenewalsCount = renewals.filter(
    r => r.daysUntilExpiration <= 30 && r.renewalStatus !== 'Renewed Signed' && r.renewalStatus !== 'Tenant Declined (Vacating)'
  ).length;

  const openWorkOrdersCount = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col lg:flex-row selection:bg-blue-500 selection:text-white">
      {/* Sidebar & Top Navigation Header */}
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
        onResetData={handleResetDemoData}
        onQuickNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-sm shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
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
            onOpenRenewalLetterModal={(renewal) => setSelectedRenewalForLetter(renewal)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
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
          />
        )}

        {/* Tab 5: Leads Pipeline */}
        {activeTab === 'leads' && (
          <LeadsPipelineView
            leads={leads}
            rooms={rooms}
            properties={properties}
            onUpdateLead={handleSaveLead}
            onOpenNewLeadModal={() => {
              setEditingLead(null);
              setIsNewLeadModalOpen(true);
            }}
            onOpenLeadDetailModal={(lead) => setSelectedLeadDetail(lead)}
            onOpenConvertLeadModal={(lead) => setSelectedLeadToConvert(lead)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
          />
        )}

        {/* Tab 6: Contacts Directory */}
        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            properties={properties}
            rooms={rooms}
            onUpdateContact={handleSaveContact}
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
        </main>
      </div>

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
      />

      {/* New / Edit Tenant Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => {
          setIsNewLeadModalOpen(false);
          setEditingLead(null);
        }}
        properties={properties}
        onSave={handleSaveLead}
        editingLead={editingLead}
      />

      {/* Lead Detail & Communication History Modal */}
      <LeadDetailModal
        isOpen={!!selectedLeadDetail}
        onClose={() => setSelectedLeadDetail(null)}
        lead={selectedLeadDetail}
        properties={properties}
        onUpdateLead={handleSaveLead}
        onConvertLead={(lead) => setSelectedLeadToConvert(lead)}
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
      />

      {/* Backup, Export & Import Data Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onDataReload={loadAllData}
      />
    </div>
  );
}
