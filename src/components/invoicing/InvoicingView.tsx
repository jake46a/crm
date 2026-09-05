import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Calendar, 
  Building2, 
  User, 
  Printer, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Zap, 
  Sparkles, 
  Sliders, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Search,
  Filter,
  Check,
  Plus,
  Mail,
  Edit2,
  X,
  Loader2,
  Cloud
} from 'lucide-react';
import { Property, Room, Contact, Invoice, InvoicingSubtask, InvoiceStatus, LeaseRenewal } from '../../types';
import { splitFullName, formatFullName } from '../../utils/nameUtils';
import { SquareService, SquareStatusResponse } from '../../services/squareService';
import { FirebaseService } from '../../services/firebase';
import { INITIAL_ROOMS } from '../../data/initialData';
import { CloudflareSecretsModal } from '../modals/CloudflareSecretsModal';

interface InvoicingViewProps {
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
  invoices: Invoice[];
  renewals?: LeaseRenewal[];
  onSaveInvoices: (invoices: Invoice[]) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: Invoice['status'], details?: Partial<Invoice>) => void;
  onUpdateRoom?: (room: Room) => void;
  onUpdateContact?: (contact: Contact) => void;
}

// Robust similarity and fuzzy matching helper
function getSimilarityScore(str1?: string | null, str2?: string | null): number {
  const s1 = (str1 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const s2 = (str2 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance
  const m = s1.length, n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const dist = dp[m][n];
  const maxLen = Math.max(m, n);
  return 1 - dist / maxLen;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const InvoicingView: React.FC<InvoicingViewProps> = ({
  properties,
  rooms,
  contacts,
  invoices,
  renewals,
  onSaveInvoices,
  onUpdateInvoiceStatus,
  onUpdateRoom,
  onUpdateContact
}) => {
  // Current active subtask
  const [activeSubtask, setActiveSubtask] = useState<InvoicingSubtask>('rent');

  // Common Selection: Property, Month, Year
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Square API Status
  const [squareStatus, setSquareStatus] = useState<SquareStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState<boolean>(false);

  // Rental Invoicing state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<{ count: number; message: string; success: boolean } | null>(null);
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Utility Invoicing state
  const [electricAmount, setElectricAmount] = useState<number>(140);
  const [gasAmount, setGasAmount] = useState<number>(85);
  const [waterAmount, setWaterAmount] = useState<number>(65);
  const [internetAmount, setInternetAmount] = useState<number>(90);
  const [utilityNotes, setUtilityNotes] = useState<string>('Monthly high-speed fiber & shared utilities split');

  // Common Supplies Invoicing state
  const [suppliesAmount, setSuppliesAmount] = useState<number>(120);
  const [suppliesCategory, setSuppliesCategory] = useState<string>('Bi-Weekly House Consumables');
  const [suppliesNotes, setSuppliesNotes] = useState<string>('Paper towels, commercial dish detergent, trash liners & laundry pods');

  // Special Invoicing state
  const [specialContactId, setSpecialContactId] = useState<string>('');
  const [specialAmount, setSpecialAmount] = useState<number>(75);
  const [specialReason, setSpecialReason] = useState<string>('Replacement Electronic Keypad Fob');
  const [specialNotes, setSpecialNotes] = useState<string>('Replacement key fob encoded and dispatched');

  // Late Fee state
  const [isApplyingLateFees, setIsApplyingLateFees] = useState<boolean>(false);
  const [lateFeeResult, setLateFeeResult] = useState<string | null>(null);

  // Syncing individual invoice
  const [syncingInvoiceId, setSyncingInvoiceId] = useState<string | null>(null);

  // Load Square Status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const status = await SquareService.getStatus();
        setSquareStatus(status);
      } catch (err) {
        console.warn('Could not retrieve Square status:', err);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    checkStatus();
  }, []);

  const handleToggleSquareMode = async (targetMode: 'production' | 'sandbox') => {
    setIsLoadingStatus(true);
    try {
      const res = await SquareService.setMode(targetMode);
      setSquareStatus(res);
    } catch (err) {
      console.warn('Could not switch Square mode:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Update selected property if properties change and current selection is invalid
  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Get occupied bedrooms for selected property
  const propertyRooms = rooms.filter(r => r.propertyId === selectedPropertyId);
  const occupiedRooms = propertyRooms.filter(r => r.status === 'Occupied' && (r.currentTenantId || r.currentTenantName));

  // Quick Email & Rent Modal State
  const [editingEmailItem, setEditingEmailItem] = useState<{
    room: Room;
    contact?: Contact;
    tenantName: string;
    currentEmail: string;
    currentPhone: string;
    currentRent?: number;
  } | null>(null);
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalRent, setModalRent] = useState<number>(0);
  const [isSavingEmailModal, setIsSavingEmailModal] = useState<boolean>(false);
  const [emailModalError, setEmailModalError] = useState<string>('');
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string>('');

  // Selected room IDs to invoice under "Do Monthly Rent"
  const [selectedRoomIdsForInvoice, setSelectedRoomIdsForInvoice] = useState<string[]>([]);
  // Custom rent amount overrides for the current session/order
  const [customRentOverrides, setCustomRentOverrides] = useState<Record<string, number>>({});

  // Auto-sync selected room IDs when occupied rooms change or property changes
  useEffect(() => {
    if (occupiedRooms.length > 0) {
      setSelectedRoomIdsForInvoice(prev => {
        const validExisting = prev.filter(id => occupiedRooms.some(r => r.id === id));
        return validExisting.length > 0 ? validExisting : occupiedRooms.map(r => r.id);
      });
    } else {
      setSelectedRoomIdsForInvoice([]);
    }
  }, [selectedPropertyId, occupiedRooms.length]);

  const handleOpenEmailModal = (item: {
    room: Room;
    contact?: Contact;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string;
    rent?: number;
  }) => {
    setEditingEmailItem({
      room: item.room,
      contact: item.contact,
      tenantName: item.tenantName,
      currentEmail: item.tenantEmail,
      currentPhone: item.tenantPhone,
      currentRent: item.rent || Number(item.room.monthlyRent) || 895
    });
    setModalEmail(item.tenantEmail || '');
    setModalPhone(item.tenantPhone || '');
    setModalRent(item.rent || Number(item.room.monthlyRent) || 895);
    setEmailModalError('');
  };

  const handleSaveTenantEmail = async () => {
    if (!editingEmailItem) return;
    const cleanEmail = modalEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailModalError('Please enter a valid email address.');
      return;
    }

    setIsSavingEmailModal(true);
    setEmailModalError('');

    try {
      const cleanPhone = modalPhone.trim();
      const targetRoom = editingEmailItem.room;
      const cleanRent = modalRent > 0 ? modalRent : (Number(targetRoom.monthlyRent) || 895);

      // 1. Update Room with email, phone, and current rent
      const updatedRoom: Room = {
        ...targetRoom,
        currentTenantEmail: cleanEmail,
        currentTenantPhone: cleanPhone || targetRoom.currentTenantPhone,
        monthlyRent: cleanRent
      };

      // Also set local override
      setCustomRentOverrides(prev => ({ ...prev, [targetRoom.id]: cleanRent }));

      // 2. Update or create Contact
      let updatedContact: Contact;
      if (editingEmailItem.contact) {
        updatedContact = {
          ...editingEmailItem.contact,
          email: cleanEmail,
          phone: cleanPhone || editingEmailItem.contact.phone,
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          propertyId: selectedProperty?.id || editingEmailItem.contact.propertyId,
          propertyName: selectedProperty?.name || editingEmailItem.contact.propertyName
        };
      } else {
        const split = splitFullName(editingEmailItem.tenantName);
        updatedContact = {
          id: targetRoom.currentTenantId || `contact-${Date.now()}`,
          type: 'Tenant',
          firstName: targetRoom.currentTenantFirstName || split.firstName,
          lastName: targetRoom.currentTenantLastName || split.lastName,
          name: editingEmailItem.tenantName,
          email: cleanEmail,
          phone: cleanPhone || targetRoom.currentTenantPhone || '',
          propertyId: selectedProperty?.id || targetRoom.propertyId,
          propertyName: selectedProperty?.name || targetRoom.propertyName,
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          status: 'Active',
          paymentStatus: 'Current / Paid',
          notes: `Resident of ${targetRoom.name}`,
          avatarBg: 'bg-indigo-600'
        };
      }

      // 3. Save to Firebase
      await Promise.all([
        FirebaseService.saveRoom(updatedRoom).catch(e => console.warn("Firestore save room err:", e)),
        FirebaseService.saveContact(updatedContact).catch(e => console.warn("Firestore save contact err:", e))
      ]);

      // 4. Propagate to parent state
      onUpdateRoom?.(updatedRoom);
      onUpdateContact?.(updatedContact);

      setEmailSuccessMsg(`Details saved for ${editingEmailItem.tenantName} ($${cleanRent}/mo)`);
      setTimeout(() => setEmailSuccessMsg(''), 4000);
      setEditingEmailItem(null);
    } catch (err: any) {
      console.error('Error saving tenant email:', err);
      setEmailModalError(err?.message || 'Failed to save email. Please try again.');
    } finally {
      setIsSavingEmailModal(false);
    }
  };

  // Match occupied rooms with Contact records and robust email resolution
  const resolveTenantForRoom = (room: Room) => {
    const rawName = room.currentTenantName || `${room.currentTenantFirstName || ''} ${room.currentTenantLastName || ''}`.trim() || 'Occupied Resident';
    
    // 1. Find matching contact
    let matchedContact: Contact | undefined = undefined;

    // Direct ID match
    if (room.currentTenantId) {
      matchedContact = contacts.find(c => c.id === room.currentTenantId);
    }
    // Room ID match
    if (!matchedContact) {
      matchedContact = contacts.find(c => c.roomId === room.id);
    }
    // Direct email match with room.currentTenantEmail
    if (!matchedContact && room.currentTenantEmail) {
      matchedContact = contacts.find(c => c.email && c.email.toLowerCase() === room.currentTenantEmail?.toLowerCase());
    }
    // Exact name match
    if (!matchedContact && rawName) {
      matchedContact = contacts.find(c => {
        const cName = (c.name || `${c.firstName || ''} ${c.lastName || ''}`).trim().toLowerCase();
        return cName === rawName.toLowerCase();
      });
    }
    // Fuzzy name match (e.g. Daniel Oliveria vs Daniel Oliveira)
    if (!matchedContact && rawName) {
      let bestScore = 0;
      let bestContact: Contact | undefined = undefined;
      for (const c of contacts) {
        const cName = (c.name || `${c.firstName || ''} ${c.lastName || ''}`).trim().toLowerCase();
        const score = getSimilarityScore(cName, rawName);
        if (score > bestScore && score >= 0.75) {
          bestScore = score;
          bestContact = c;
        }
      }
      matchedContact = bestContact;
    }
    // Property and first name match
    if (!matchedContact && room.propertyId) {
      const fName = room.currentTenantFirstName || rawName.split(' ')[0] || '';
      if (fName.length > 2) {
        matchedContact = contacts.find(c => 
          c.propertyId === room.propertyId && 
          c.type === 'Tenant' && 
          ((c.firstName && c.firstName.toLowerCase() === fName.toLowerCase()) || 
           (c.name && c.name.toLowerCase().startsWith(fName.toLowerCase())))
        );
      }
    }

    // 2. Resolve Tenant Email
    let resolvedEmail = room.currentTenantEmail?.trim() || matchedContact?.email?.trim() || '';

    // Check renewals
    if (!resolvedEmail && renewals && renewals.length > 0) {
      const renewal = renewals.find(r => 
        r.roomId === room.id || 
        getSimilarityScore(r.tenantName || `${r.tenantFirstName || ''} ${r.tenantLastName || ''}`, rawName) >= 0.75
      );
      if (renewal?.tenantEmail) {
        resolvedEmail = renewal.tenantEmail.trim();
      }
    }

    // Check existing invoices
    if (!resolvedEmail && invoices && invoices.length > 0) {
      const inv = invoices.find(i => 
        i.tenantEmail && 
        (i.roomId === room.id || getSimilarityScore(i.tenantName, rawName) >= 0.75)
      );
      if (inv?.tenantEmail) {
        resolvedEmail = inv.tenantEmail.trim();
      }
    }

    // Check any contact with similar name that has an email
    if (!resolvedEmail) {
      const cWithEmail = contacts.find(c => 
        c.email && getSimilarityScore(c.name || `${c.firstName || ''} ${c.lastName || ''}`, rawName) >= 0.7
      );
      if (cWithEmail?.email) {
        resolvedEmail = cWithEmail.email.trim();
      }
    }

    // 3. Resolve Tenant Phone
    const resolvedPhone = matchedContact?.phone?.trim() || room.currentTenantPhone?.trim() || '';

    // 4. Square customer ID
    const squareCustomerId = matchedContact?.squareCustomerId || '';

    // 5. Monthly rent: resolve current rent accurately
    let rent: number | undefined = customRentOverrides[room.id];
    if (rent === undefined || rent === null || isNaN(rent) || rent <= 0) {
      if (renewals && renewals.length > 0) {
        const renewal = renewals.find(r => 
          r.roomId === room.id || 
          getSimilarityScore(r.tenantName || `${r.tenantFirstName || ''} ${r.tenantLastName || ''}`, rawName) >= 0.75
        );
        if (renewal && typeof renewal.currentMonthlyRent === 'number' && renewal.currentMonthlyRent > 0) {
          rent = renewal.currentMonthlyRent;
        }
      }
    }
    if (rent === undefined || rent === null || isNaN(rent) || rent <= 0) {
      const parsedRoomRent = Number(room.monthlyRent);
      if (!isNaN(parsedRoomRent) && parsedRoomRent > 0) {
        rent = parsedRoomRent;
      }
    }
    if (rent === undefined || rent === null || isNaN(rent) || rent <= 0) {
      const initialMatch = INITIAL_ROOMS.find(r => r.id === room.id || r.name === room.name);
      if (initialMatch && typeof initialMatch.monthlyRent === 'number' && initialMatch.monthlyRent > 0) {
        rent = initialMatch.monthlyRent;
      }
    }
    if (rent === undefined || rent === null || isNaN(rent) || rent <= 0) {
      const parsedAlt = Number((room as any).rent);
      if (!isNaN(parsedAlt) && parsedAlt > 0) {
        rent = parsedAlt;
      } else {
        rent = 895;
      }
    }

    return {
      room,
      contact: matchedContact,
      tenantName: rawName,
      tenantEmail: resolvedEmail,
      tenantPhone: resolvedPhone,
      squareCustomerId,
      rent
    };
  };

  // Match occupied rooms with Contact records to ensure Square Customer ID exists
  const occupiedBedroomsWithTenants = occupiedRooms.map(room => resolveTenantForRoom(room));

  // Invoicing selection helpers
  const itemsToInvoice = occupiedBedroomsWithTenants.filter(item => 
    selectedRoomIdsForInvoice.includes(item.room.id)
  );

  const totalOccupiedRent = occupiedBedroomsWithTenants.reduce((acc, item) => acc + item.rent, 0);
  const totalSelectedRent = itemsToInvoice.reduce((acc, item) => acc + item.rent, 0);

  const isAllSelected = occupiedBedroomsWithTenants.length > 0 && 
    occupiedBedroomsWithTenants.every(item => selectedRoomIdsForInvoice.includes(item.room.id));

  const isSomeSelected = occupiedBedroomsWithTenants.some(item => selectedRoomIdsForInvoice.includes(item.room.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRoomIdsForInvoice([]);
    } else {
      setSelectedRoomIdsForInvoice(occupiedBedroomsWithTenants.map(item => item.room.id));
    }
  };

  const handleToggleRoomSelect = (roomId: string) => {
    setSelectedRoomIdsForInvoice(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  // Helper to calculate Due Date (1st of the specified month/year)
  const getDueDate = (month: string, year: number) => {
    const monthIndex = MONTHS.indexOf(month);
    const date = new Date(year, monthIndex, 1);
    return date.toISOString().split('T')[0];
  };

  // 1. PRINT ORDER HANDLER
  const handlePrintOrder = () => {
    window.print();
  };

  // 2. CREATE / MAIL RENT INVOICES (Square createOrder + createInvoice)
  const handleCreateAndMailRentInvoices = async () => {
    if (!selectedProperty) return;

    if (!selectedProperty.squareLocationId) {
      alert(`Selected property "${selectedProperty.name}" does not have a Square Location ID set. Please edit the property to configure SquareLocationID first.`);
      return;
    }

    if (occupiedBedroomsWithTenants.length === 0) {
      alert('No occupied bedrooms found for this property.');
      return;
    }

    if (itemsToInvoice.length === 0) {
      alert('Please check at least one resident checkbox in the list to create and mail an invoice.');
      return;
    }

    setIsGenerating(true);
    setBatchResult(null);

    try {
      const invoicesToCreate: Partial<Invoice>[] = [];
      const dueDate = getDueDate(selectedMonth, selectedYear);

      for (const item of itemsToInvoice) {
        // Fallback or auto-generate Square Customer ID if not assigned
        let customerId = item.squareCustomerId;
        if (!customerId && item.tenantEmail) {
          try {
            const customerRes = await SquareService.searchOrCreateCustomer({
              email: item.tenantEmail,
              firstName: item.contact?.firstName || item.tenantName.split(' ')[0],
              lastName: item.contact?.lastName || item.tenantName.split(' ').slice(1).join(' '),
              phone: item.tenantPhone,
              note: `Coliving Tenant at ${selectedProperty.name} - Room ${item.room.name}`
            });
            customerId = customerRes.customerId;
            if (item.contact) {
              await FirebaseService.saveContact({
                ...item.contact,
                squareCustomerId: customerId
              });
            }
          } catch (e) {
            console.warn(`Customer lookup failed for ${item.tenantEmail}:`, e);
          }
        }

        const invoiceId = `inv-rent-${selectedProperty.id}-${item.room.id}-${selectedYear}-${MONTHS.indexOf(selectedMonth) + 1}`;
        const invoiceNum = `INV-RENT-${selectedYear}-${String(MONTHS.indexOf(selectedMonth) + 1).padStart(2, '0')}-${String(invoicesToCreate.length + 101)}`;

        invoicesToCreate.push({
          id: invoiceId,
          invoiceNumber: invoiceNum,
          invoiceType: 'Rental',
          subtask: 'monthly-rental',
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.name,
          roomId: item.room.id,
          roomName: item.room.name,
          tenantId: item.contact?.id || item.room.currentTenantId || '',
          tenantName: item.tenantName,
          tenantEmail: item.tenantEmail,
          tenantPhone: item.tenantPhone,
          squareLocationId: selectedProperty.squareLocationId,
          squareCustomerId: customerId || `CUST_SANDBOX_${item.room.id}`,
          month: selectedMonth,
          year: selectedYear,
          billingMonth: selectedMonth,
          billingYear: selectedYear,
          amount: item.rent,
          rentAmount: item.rent,
          utilityAmount: 0,
          suppliesAmount: 0,
          lateFeeAmount: 0,
          specialAmount: 0,
          totalAmount: item.rent,
          dueDate,
          createdAt: new Date().toISOString(),
          description: `Monthly Coliving Room Rent - ${item.room.name} (${selectedMonth} ${selectedYear})`,
          allowPartialPayments: false,
          status: 'SENT' as InvoiceStatus
        });
      }

      // Call Square backend service
      const squareBatchRes = await SquareService.createInvoiceBatch(invoicesToCreate);

      // Map results and prepare full Invoice models
      const finalInvoices: Invoice[] = invoicesToCreate.map((inv, idx) => {
        const sqRes = squareBatchRes.results?.[idx];
        const paymentUrl = sqRes?.paymentUrl || `https://square.link/u/moyer-pm-${inv.id}`;
        return {
          ...inv,
          squareOrderId: sqRes?.squareOrderId || `sq-order-${Date.now()}-${idx}`,
          squareInvoiceId: sqRes?.squareInvoiceId || `sq-inv-${Date.now()}-${idx}`,
          paymentUrl,
          squarePaymentUrl: paymentUrl,
          viewUrl: sqRes?.viewUrl || paymentUrl,
          status: 'SENT' as InvoiceStatus
        } as unknown as Invoice;
      });

      // Save to Firebase / storage
      await FirebaseService.saveInvoicesBatch(finalInvoices);
      onSaveInvoices([...invoices.filter(i => !finalInvoices.some(fi => fi.id === i.id)), ...finalInvoices]);

      setBatchResult({
        success: true,
        count: finalInvoices.length,
        message: `Successfully generated and emailed ${finalInvoices.length} Square rental invoices for ${selectedProperty.name} (${selectedMonth} ${selectedYear}). Partial payments are strictly disabled per policy.`
      });
    } catch (err: any) {
      setBatchResult({
        success: false,
        count: 0,
        message: err.message || 'Error generating Square invoices.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. CREATE UTILITY INVOICES (Split equally among occupied rooms)
  const handleCreateUtilityInvoices = async () => {
    if (!selectedProperty || !selectedProperty.squareLocationId) {
      alert('Selected property must have a Square Location ID set.');
      return;
    }
    if (occupiedBedroomsWithTenants.length === 0) {
      alert('No occupied bedrooms to split utilities with.');
      return;
    }

    const totalBill = electricAmount + gasAmount + waterAmount + internetAmount;
    if (totalBill <= 0) {
      alert('Please enter utility bill totals greater than $0.');
      return;
    }

    setIsGenerating(true);
    setBatchResult(null);

    const sharePerResident = Math.round((totalBill / occupiedBedroomsWithTenants.length) * 100) / 100;
    const dueDate = getDueDate(selectedMonth, selectedYear);

    try {
      const utilityInvoices: Partial<Invoice>[] = occupiedBedroomsWithTenants.map((item, idx) => {
        const invoiceNum = `INV-UTIL-${selectedYear}-${String(MONTHS.indexOf(selectedMonth) + 1).padStart(2, '0')}-${String(idx + 101)}`;
        return {
          id: `inv-util-${selectedProperty.id}-${item.room.id}-${selectedYear}-${MONTHS.indexOf(selectedMonth) + 1}`,
          invoiceNumber: invoiceNum,
          invoiceType: 'Utility',
          subtask: 'utility',
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.name,
          roomId: item.room.id,
          roomName: item.room.name,
          tenantId: item.contact?.id || item.room.currentTenantId || '',
          tenantName: item.tenantName,
          tenantEmail: item.tenantEmail,
          tenantPhone: item.tenantPhone,
          squareLocationId: selectedProperty.squareLocationId!,
          squareCustomerId: item.squareCustomerId || `CUST_SANDBOX_${item.room.id}`,
          month: selectedMonth,
          year: selectedYear,
          billingMonth: selectedMonth,
          billingYear: selectedYear,
          amount: sharePerResident,
          rentAmount: 0,
          utilityAmount: sharePerResident,
          suppliesAmount: 0,
          lateFeeAmount: 0,
          specialAmount: 0,
          totalAmount: sharePerResident,
          dueDate,
          createdAt: new Date().toISOString(),
          description: `Shared Utilities Split (${selectedMonth} ${selectedYear}): Electric ($${electricAmount}) + Gas ($${gasAmount}) + Water/Trash ($${waterAmount}) + Fiber Internet ($${internetAmount}) / ${occupiedBedroomsWithTenants.length} rooms`,
          allowPartialPayments: false,
          status: 'SENT' as InvoiceStatus
        };
      });

      const res = await SquareService.createInvoiceBatch(utilityInvoices);
      const savedInvoices: Invoice[] = utilityInvoices.map((inv, idx) => {
        const paymentUrl = res.results?.[idx]?.paymentUrl || `https://square.link/u/moyer-pm-${inv.id}`;
        return {
          ...inv,
          squareOrderId: res.results?.[idx]?.squareOrderId || `sq-order-util-${Date.now()}-${idx}`,
          squareInvoiceId: res.results?.[idx]?.squareInvoiceId || `sq-inv-util-${Date.now()}-${idx}`,
          paymentUrl,
          squarePaymentUrl: paymentUrl,
          viewUrl: res.results?.[idx]?.viewUrl || paymentUrl,
          status: 'SENT' as InvoiceStatus
        } as unknown as Invoice;
      });

      await FirebaseService.saveInvoicesBatch(savedInvoices);
      onSaveInvoices([...invoices.filter(i => !savedInvoices.some(si => si.id === i.id)), ...savedInvoices]);

      setBatchResult({
        success: true,
        count: savedInvoices.length,
        message: `Successfully split $${totalBill.toFixed(2)} total utilities across ${savedInvoices.length} occupied rooms ($${sharePerResident.toFixed(2)}/resident). Invoices emailed via Square.`
      });
    } catch (err: any) {
      setBatchResult({
        success: false,
        count: 0,
        message: err.message || 'Error creating utility invoices.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. CREATE COMMON SUPPLIES INVOICING
  const handleCreateSuppliesInvoices = async () => {
    if (!selectedProperty || !selectedProperty.squareLocationId) {
      alert('Selected property must have a Square Location ID set.');
      return;
    }
    if (occupiedBedroomsWithTenants.length === 0) {
      alert('No occupied bedrooms to split supplies with.');
      return;
    }
    if (suppliesAmount <= 0) {
      alert('Please enter a supplies amount greater than $0.');
      return;
    }

    setIsGenerating(true);
    setBatchResult(null);

    const sharePerResident = Math.round((suppliesAmount / occupiedBedroomsWithTenants.length) * 100) / 100;
    const dueDate = getDueDate(selectedMonth, selectedYear);

    try {
      const suppliesInvoices: Partial<Invoice>[] = occupiedBedroomsWithTenants.map((item, idx) => {
        const invoiceNum = `INV-SUP-${selectedYear}-${String(MONTHS.indexOf(selectedMonth) + 1).padStart(2, '0')}-${String(idx + 101)}`;
        return {
          id: `inv-supplies-${selectedProperty.id}-${item.room.id}-${selectedYear}-${MONTHS.indexOf(selectedMonth) + 1}`,
          invoiceNumber: invoiceNum,
          invoiceType: 'Supplies',
          subtask: 'supplies',
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.name,
          roomId: item.room.id,
          roomName: item.room.name,
          tenantId: item.contact?.id || item.room.currentTenantId || '',
          tenantName: item.tenantName,
          tenantEmail: item.tenantEmail,
          tenantPhone: item.tenantPhone,
          squareLocationId: selectedProperty.squareLocationId!,
          squareCustomerId: item.squareCustomerId || `CUST_SANDBOX_${item.room.id}`,
          month: selectedMonth,
          year: selectedYear,
          billingMonth: selectedMonth,
          billingYear: selectedYear,
          amount: sharePerResident,
          rentAmount: 0,
          utilityAmount: 0,
          suppliesAmount: sharePerResident,
          lateFeeAmount: 0,
          specialAmount: 0,
          totalAmount: sharePerResident,
          dueDate,
          createdAt: new Date().toISOString(),
          description: `Common House Supplies: ${suppliesCategory} (${selectedMonth} ${selectedYear}) - $${suppliesAmount.toFixed(2)} total / ${occupiedBedroomsWithTenants.length} residents`,
          allowPartialPayments: false,
          status: 'SENT' as InvoiceStatus
        };
      });

      const res = await SquareService.createInvoiceBatch(suppliesInvoices);
      const savedInvoices: Invoice[] = suppliesInvoices.map((inv, idx) => {
        const paymentUrl = res.results?.[idx]?.paymentUrl || `https://square.link/u/moyer-pm-${inv.id}`;
        return {
          ...inv,
          squareOrderId: res.results?.[idx]?.squareOrderId || `sq-order-supplies-${Date.now()}-${idx}`,
          squareInvoiceId: res.results?.[idx]?.squareInvoiceId || `sq-inv-supplies-${Date.now()}-${idx}`,
          paymentUrl,
          squarePaymentUrl: paymentUrl,
          viewUrl: res.results?.[idx]?.viewUrl || paymentUrl,
          status: 'SENT' as InvoiceStatus
        } as unknown as Invoice;
      });

      await FirebaseService.saveInvoicesBatch(savedInvoices);
      onSaveInvoices([...invoices.filter(i => !savedInvoices.some(si => si.id === i.id)), ...savedInvoices]);

      setBatchResult({
        success: true,
        count: savedInvoices.length,
        message: `Successfully split $${suppliesAmount.toFixed(2)} in common supplies ($${sharePerResident.toFixed(2)}/resident). Invoices emailed via Square.`
      });
    } catch (err: any) {
      setBatchResult({
        success: false,
        count: 0,
        message: err.message || 'Error creating common supplies invoices.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. CREATE SPECIAL INVOICE (One-off fee)
  const handleCreateSpecialInvoice = async () => {
    if (!selectedProperty || !selectedProperty.squareLocationId) {
      alert('Selected property must have a Square Location ID set.');
      return;
    }
    const tenant = contacts.find(c => c.id === specialContactId);
    if (!tenant) {
      alert('Please select a resident to bill.');
      return;
    }
    if (specialAmount <= 0) {
      alert('Please enter a valid charge amount.');
      return;
    }

    setIsGenerating(true);
    setBatchResult(null);

    try {
      const invoiceNum = `INV-SPEC-${selectedYear}-${Date.now().toString().slice(-4)}`;
      const specialInv: Partial<Invoice> = {
        id: `inv-spec-${Date.now()}`,
        invoiceNumber: invoiceNum,
        invoiceType: 'Special',
        subtask: 'special',
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        roomId: '',
        roomName: 'Special Incident Charge',
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        tenantPhone: tenant.phone,
        squareLocationId: selectedProperty.squareLocationId,
        squareCustomerId: tenant.squareCustomerId || `CUST_SPECIAL_${tenant.id}`,
        month: selectedMonth,
        year: selectedYear,
        billingMonth: selectedMonth,
        billingYear: selectedYear,
        amount: Number(specialAmount),
        rentAmount: 0,
        utilityAmount: 0,
        suppliesAmount: 0,
        lateFeeAmount: 0,
        specialAmount: Number(specialAmount),
        totalAmount: Number(specialAmount),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        description: `Special Charge: ${specialReason} - ${specialNotes}`,
        allowPartialPayments: false,
        status: 'SENT' as InvoiceStatus
      };

      const res = await SquareService.createInvoiceBatch([specialInv]);
      const paymentUrl = res.results?.[0]?.paymentUrl || `https://square.link/u/moyer-spec-${specialInv.id}`;
      const saved: Invoice = {
        ...specialInv,
        squareOrderId: res.results?.[0]?.squareOrderId || `sq-order-spec-${Date.now()}`,
        squareInvoiceId: res.results?.[0]?.squareInvoiceId || `sq-inv-spec-${Date.now()}`,
        paymentUrl,
        squarePaymentUrl: paymentUrl,
        viewUrl: res.results?.[0]?.viewUrl || paymentUrl,
        status: 'SENT' as InvoiceStatus
      } as unknown as Invoice;

      await FirebaseService.saveInvoice(saved);
      onSaveInvoices([saved, ...invoices]);

      setBatchResult({
        success: true,
        count: 1,
        message: `Special invoice for $${specialAmount.toFixed(2)} dispatched to ${tenant.name} (${specialReason}).`
      });
    } catch (err: any) {
      setBatchResult({
        success: false,
        count: 0,
        message: err.message || 'Failed to dispatch special invoice.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. APPLY LATE FEES (Past due rent: 5% or $50, whichever is greater)
  const handleApplyLateFees = async () => {
    setIsApplyingLateFees(true);
    setLateFeeResult(null);

    try {
      // Find invoices eligible for late fee:
      // status !== 'PAID' and subtask === 'rent'
      const rentInvoices = invoices.filter(i => 
        i.subtask === 'rent' && 
        i.status !== 'PAID' &&
        (!selectedPropertyId || i.propertyId === selectedPropertyId)
      );

      if (rentInvoices.length === 0) {
        setLateFeeResult('No overdue or unpaid rental invoices found eligible for late fees.');
        setIsApplyingLateFees(false);
        return;
      }

      let updatedCount = 0;
      const updatedList: Invoice[] = [...invoices];

      for (const inv of rentInvoices) {
        const calculatedFee = Math.max(inv.rentAmount * 0.05, 50);
        if (inv.lateFeeAmount !== calculatedFee) {
          // Call Square service to update order and invoice
          const squareResult = await SquareService.applyLateFee({
            invoiceId: inv.squareInvoiceId || inv.id,
            orderId: inv.squareOrderId,
            rentAmount: inv.rentAmount,
            currentLateFee: inv.lateFeeAmount || 0
          });

          const newTotal = inv.rentAmount + calculatedFee;
          const updatedInv: Invoice = {
            ...inv,
            lateFeeAmount: calculatedFee,
            totalAmount: newTotal,
            squarePaymentUrl: squareResult.paymentUrl || inv.squarePaymentUrl,
            description: `${inv.description} + [Late Fee: $${calculatedFee.toFixed(2)} applied]`
          };

          await FirebaseService.saveInvoice(updatedInv);
          const idx = updatedList.findIndex(i => i.id === inv.id);
          if (idx >= 0) updatedList[idx] = updatedInv;
          updatedCount++;
        }
      }

      onSaveInvoices(updatedList);
      setLateFeeResult(
        `Late fee check complete: Evaluated ${rentInvoices.length} unpaid invoices. Successfully updated ${updatedCount} Square invoice orders with late fee line items (5% or $50 minimum).`
      );
    } catch (err: any) {
      setLateFeeResult(err.message || 'Error processing late fees.');
    } finally {
      setIsApplyingLateFees(false);
    }
  };

  // 7. SYNC INVOICE STATUS
  const handleSyncInvoiceStatus = async (invoice: Invoice) => {
    if (!invoice.squareInvoiceId) return;
    setSyncingInvoiceId(invoice.id);

    try {
      const syncRes = await SquareService.syncInvoiceStatus(invoice.squareInvoiceId);
      const newStatus = syncRes.status as Invoice['status'];
      await FirebaseService.updateInvoiceStatus(invoice.id, newStatus, {
        paidAt: syncRes.paidAt || undefined,
        paymentMethod: syncRes.paymentMethod || undefined
      });
      onUpdateInvoiceStatus(invoice.id, newStatus, {
        paidAt: syncRes.paidAt || undefined,
        paymentMethod: syncRes.paymentMethod || undefined
      });
    } catch (err) {
      console.warn('Sync invoice failed:', err);
    } finally {
      setSyncingInvoiceId(null);
    }
  };

  // 8. SIMULATE PAYMENT (For sandbox testing)
  const handleSimulatePayment = async (invoice: Invoice) => {
    try {
      await SquareService.simulateSandboxPayment(invoice.squareInvoiceId || invoice.id, 'Square Pay / ACH');
      const paidDate = new Date().toISOString();
      await FirebaseService.updateInvoiceStatus(invoice.id, 'PAID', {
        paidAt: paidDate,
        paymentMethod: 'Square ACH / Card'
      });
      onUpdateInvoiceStatus(invoice.id, 'PAID', {
        paidAt: paidDate,
        paymentMethod: 'Square ACH / Card'
      });
    } catch (err) {
      console.warn('Simulate payment failed:', err);
    }
  };

  // Filtered Invoices List
  const filteredInvoices = invoices.filter(inv => {
    if (filterInvoiceStatus !== 'all' && inv.status !== filterInvoiceStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        inv.propertyName.toLowerCase().includes(q) ||
        inv.tenantName.toLowerCase().includes(q) ||
        inv.roomName.toLowerCase().includes(q) ||
        (inv.squareInvoiceId && inv.squareInvoiceId.toLowerCase().includes(q)) ||
        (inv.squareOrderId && inv.squareOrderId.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  const tenantContacts = contacts.filter(c => c.type === 'Tenant');

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner & Square Payment Processing Gateway Status */}
      <div className="bg-zinc-950 text-white rounded-lg p-5 border border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Square Invoicing & Payments</h1>
              <span className="text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
                Square API v2025-02-20
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automated Square Orders & Invoices pipeline with strict partial-payment controls, late fee rules, and tenant syncing.
            </p>
          </div>
        </div>

        {/* Square Status Indicator & Mode Switcher */}
        <div className="flex items-center gap-3 text-xs bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-md shadow-sm">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                squareStatus?.environment === 'production'
                  ? 'bg-emerald-400 ring-4 ring-emerald-950/60 animate-pulse'
                  : 'bg-amber-400 ring-4 ring-amber-950/60'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-zinc-100">
                  {squareStatus?.environment === 'production' ? 'Square: Production (Live)' : 'Square: Sandbox Mode'}
                </p>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wide ${
                    squareStatus?.environment === 'production'
                      ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60'
                      : 'bg-amber-900/80 text-amber-200 border border-amber-700/60'
                  }`}
                >
                  {squareStatus?.environment === 'production' ? 'PRODUCTION' : 'SANDBOX'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                {squareStatus?.baseUrl ? squareStatus.baseUrl.replace('https://', '') : 'connect.squareup.com'} •{' '}
                {squareStatus?.hasToken ? 'Live Token Configured' : 'No Token (Mock Mode)'}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Cloudflare Pages Secrets Setup Button */}
          <button
            onClick={() => setIsCloudflareModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors whitespace-nowrap"
            title="View instructions for passing Square production secrets to Cloudflare Pages"
          >
            <Cloud className="w-3.5 h-3.5 text-orange-400" />
            <span>Cloudflare Secrets Guide</span>
          </button>

          {/* Mode Switcher Button */}
          <button
            onClick={() => handleToggleSquareMode(squareStatus?.environment === 'production' ? 'sandbox' : 'production')}
            disabled={isLoadingStatus}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
              squareStatus?.environment === 'production'
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm'
            }`}
            title={
              squareStatus?.environment === 'production'
                ? 'Switch back to Sandbox test mode'
                : 'Switch to Live Production Square mode'
            }
          >
            {squareStatus?.environment === 'production' ? 'Switch to Sandbox' : 'Switch to Production'}
          </button>
        </div>
      </div>

      {/* Subtask Tabs Navigation */}
      <div className="flex items-center border-b border-zinc-200 bg-white rounded-t-lg px-2 pt-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubtask('rent')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeSubtask === 'rent'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Do Monthly Rental Invoices</span>
        </button>

        <button
          onClick={() => setActiveSubtask('utility')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeSubtask === 'utility'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Do Utility Invoices</span>
        </button>

        <button
          onClick={() => setActiveSubtask('supplies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeSubtask === 'supplies'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Do Common Supplies Invoicing</span>
        </button>

        <button
          onClick={() => setActiveSubtask('late_fee')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeSubtask === 'late_fee'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Do Late Fee Invoicing</span>
        </button>

        <button
          onClick={() => setActiveSubtask('special')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeSubtask === 'special'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Do Special Invoicing</span>
        </button>
      </div>

      {/* Primary Workspace Panel */}
      <div className="bg-white rounded-b-lg border border-t-0 border-zinc-200 p-6 shadow-xs space-y-6">
        {/* Global Controls Bar: Property, Month, Year */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Property Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Select Property *</span>
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.squareLocationId ? `[Location: ${p.squareLocationId}]` : '[No Square Location]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Billing Month *</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Billing Year *</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Property Square Location Status Warning/Info */}
          <div className="shrink-0 md:text-right border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0 md:pl-4">
            <p className="text-[11px] font-semibold text-zinc-500">Property Square Location:</p>
            {selectedProperty?.squareLocationId ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                <span>{selectedProperty.squareLocationId}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>SquareLocationID Missing</span>
              </span>
            )}
          </div>
        </div>

        {/* Batch Operation Feedback Alert */}
        {batchResult && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border ${
            batchResult.success 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            {batchResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold">{batchResult.success ? 'Square Invoices Successfully Generated' : 'Generation Notice'}</p>
              <p className="mt-0.5">{batchResult.message}</p>
            </div>
            <button 
              onClick={() => setBatchResult(null)} 
              className="text-zinc-400 hover:text-zinc-600 text-sm font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Email updated notification banner */}
        {emailSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{emailSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setEmailSuccessMsg('')}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* SUBTASK 1: DO MONTHLY RENTAL INVOICES */}
        {activeSubtask === 'rent' && (
          <div className="space-y-6">
            {/* Occupied Bedrooms Order Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <span>Occupied Bedrooms Order:</span>
                  <span className="text-indigo-600">{selectedProperty?.name}</span>
                  <span className="text-zinc-400 font-normal">({selectedMonth} {selectedYear})</span>
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-zinc-500">
                    {occupiedBedroomsWithTenants.length} occupied bedrooms.
                  </p>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-zinc-700">Invoicing:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRoomIdsForInvoice(occupiedBedroomsWithTenants.map(i => i.room.id))}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline text-[11px]"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRoomIdsForInvoice([])}
                      className="text-zinc-500 hover:text-zinc-700 font-semibold hover:underline text-[11px]"
                    >
                      Select None
                    </button>
                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {itemsToInvoice.length} of {occupiedBedroomsWithTenants.length} selected
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Print Order & Create/Mail Invoices */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintOrder}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-md shadow-2xs transition"
                  title="Print this order for bookkeeping & archiving"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Print Order</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateAndMailRentInvoices}
                  disabled={isGenerating || itemsToInvoice.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition"
                  title={itemsToInvoice.length === 0 ? "Select at least one resident" : `Call Square createOrder then createInvoice for ${itemsToInvoice.length} selected resident(s)`}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Create / Mail Invoices ({itemsToInvoice.length})</span>
                </button>
              </div>
            </div>

            {/* Printable Order Container */}
            <div id="printable-order-section" className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-700">
                <div className="flex items-center gap-2">
                  <span>Moyer Property Management</span>
                  <span>•</span>
                  <span>Order Reference: {selectedProperty?.name} - {selectedMonth} {selectedYear}</span>
                </div>
                <div>
                  Due Date: <span className="font-mono">{getDueDate(selectedMonth, selectedYear)}</span>
                </div>
              </div>

              {occupiedBedroomsWithTenants.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No occupied rooms found in {selectedProperty?.name}. Ensure rooms are marked "Occupied" in the Inventory tab with assigned resident contacts.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-12 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id="select-all-invoices"
                            checked={isAllSelected}
                            ref={el => {
                              if (el) el.indeterminate = isSomeSelected;
                            }}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                            title={isAllSelected ? "Deselect All" : "Select All"}
                          />
                        </div>
                      </th>
                      <th className="p-3">Room</th>
                      <th className="p-3">Resident / Contact</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Square Customer ID</th>
                      <th className="p-3">Square Location ID</th>
                      <th className="p-3 text-right">Rent Amount</th>
                      <th className="p-3 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {occupiedBedroomsWithTenants.map((item) => {
                      const isSelected = selectedRoomIdsForInvoice.includes(item.room.id);
                      return (
                        <tr 
                          key={item.room.id} 
                          className={`hover:bg-zinc-50/80 transition-colors ${isSelected ? 'bg-indigo-50/25' : 'opacity-65 bg-zinc-50/30'}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              id={`checkbox-invoice-${item.room.id}`}
                              checked={isSelected}
                              onChange={() => handleToggleRoomSelect(item.room.id)}
                              className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                              title={isSelected ? "Uncheck to exclude from invoicing" : "Check to include in invoicing"}
                            />
                          </td>
                          <td className="p-3 font-semibold text-zinc-900">
                            {item.room.name}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                              <User className="w-3 h-3 text-zinc-400" />
                              <span>{item.tenantName}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {item.tenantEmail ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-zinc-700">{item.tenantEmail}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmailModal(item)}
                                  title="Edit resident email, phone or rent"
                                  className="text-zinc-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEmailModal(item)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors"
                                title="Click to set tenant email address"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                <span>Add email</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            {item.squareCustomerId ? (
                              <span className="font-mono text-[11px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">
                                {item.squareCustomerId}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic text-[11px]">
                                Auto-generates on send
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-zinc-700">
                            {selectedProperty?.squareLocationId || 'N/A'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-bold text-zinc-900 text-xs">
                                ${item.rent.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEmailModal(item)}
                                title="Edit rent or details"
                                className="text-zinc-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEmailModal(item)}
                              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium hover:underline inline-flex items-center gap-1"
                              title="Edit email, phone or current rent"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-50 font-bold text-zinc-900 border-t-2 border-zinc-200">
                      <td colSpan={6} className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <span className="font-semibold text-zinc-600">
                            Total for Selected Invoices ({itemsToInvoice.length} of {occupiedBedroomsWithTenants.length}):
                          </span>
                          <span className="font-mono text-sm text-indigo-700">
                            ${totalSelectedRent.toFixed(2)}
                          </span>
                          {itemsToInvoice.length !== occupiedBedroomsWithTenants.length && (
                            <span className="text-[11px] text-zinc-400 font-normal ml-1">
                              (Order Total: ${totalOccupiedRent.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Policy Notes */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-md text-[11px] text-zinc-600 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Square API Policy: <strong>Partial payments disabled</strong> (`allow_partial_payments: false`). Invoices are delivered directly to the tenant's email address.</span>
              </span>
              <span className="text-indigo-800 font-semibold font-mono shrink-0 ml-2">Net Due: 1st of Month</span>
            </div>
          </div>
        )}

        {/* SUBTASK 2: DO UTILITY INVOICES */}
        {activeSubtask === 'utility' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Shared Utility Bills Split</h3>
              <p className="text-xs text-zinc-500">
                Enter the house utility bills for {selectedProperty?.name} ({selectedMonth} {selectedYear}). The system divides the total equally among the {occupiedBedroomsWithTenants.length} occupied rooms and dispatches individual Square orders and invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Electric Bill ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={electricAmount}
                    onChange={(e) => setElectricAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Natural Gas / Heating ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={gasAmount}
                    onChange={(e) => setGasAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Water, Sewer & Trash ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Gigabit Fiber Internet ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={internetAmount}
                    onChange={(e) => setInternetAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Split Calculation Card */}
            {occupiedBedroomsWithTenants.length > 0 && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-indigo-900 font-semibold">
                    Total Utility Expense: <span className="font-mono text-sm font-bold text-indigo-700">${(electricAmount + gasAmount + waterAmount + internetAmount).toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Equal share for {occupiedBedroomsWithTenants.length} occupied rooms: <span className="font-mono font-bold text-sm text-indigo-900">${((electricAmount + gasAmount + waterAmount + internetAmount) / occupiedBedroomsWithTenants.length).toFixed(2)}</span> / resident
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateUtilityInvoices}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Generate & Mail Utility Invoices</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTASK 3: DO COMMON SUPPLIES INVOICING */}
        {activeSubtask === 'supplies' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Common Supplies Shared Invoicing</h3>
              <p className="text-xs text-zinc-500">
                Split shared house replenishment items (toilet paper, paper towels, dish pods, cleaning supplies) across the active residents of {selectedProperty?.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Total Supplies Expense ($) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={suppliesAmount}
                    onChange={(e) => setSuppliesAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Supplies Category</label>
                <input
                  type="text"
                  value={suppliesCategory}
                  onChange={(e) => setSuppliesCategory(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Itemized Receipts / Notes</label>
                <input
                  type="text"
                  value={suppliesNotes}
                  onChange={(e) => setSuppliesNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {occupiedBedroomsWithTenants.length > 0 && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-indigo-900 font-semibold">
                    Total Supplies: <span className="font-mono text-sm font-bold text-indigo-700">${suppliesAmount.toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Share per resident: <span className="font-mono font-bold text-sm text-indigo-900">${(suppliesAmount / occupiedBedroomsWithTenants.length).toFixed(2)}</span> ({occupiedBedroomsWithTenants.length} occupied rooms)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateSuppliesInvoices}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Generate & Mail Supplies Invoices</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTASK 4: DO LATE FEE INVOICING */}
        {activeSubtask === 'late_fee' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Late Fee Assessment & Square Order Updating</h3>
              <p className="text-xs text-zinc-500">
                Rule: Past-due rent incurs a late fee of <strong>5% or $50 minimum</strong> (whichever is greater). Automatically updates the active Square order and invoice with the late fee line item.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Automated Cron Schedule: 8th of every month at 12:00 AM</p>
                  <p className="mt-0.5 text-amber-800">
                    Tenants past the 7th grace period have their Square orders amended to include the late fee line item, and a revised invoice notification is dispatched.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyLateFees}
                disabled={isApplyingLateFees}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-md shadow-xs transition shrink-0"
              >
                {isApplyingLateFees ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>Run Late Fee Audit Now</span>
              </button>
            </div>

            {lateFeeResult && (
              <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-md text-xs text-zinc-800">
                <span className="font-bold">Audit Result:</span> {lateFeeResult}
              </div>
            )}
          </div>
        )}

        {/* SUBTASK 5: DO SPECIAL INVOICING */}
        {activeSubtask === 'special' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Special Invoicing (Incident, Key Replacement & Move-Out)</h3>
              <p className="text-xs text-zinc-500">
                Create one-off Square invoices for specific incidentals (e.g. key replacement, lockouts, move-out cleaning, drywall repairs).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Select Tenant Contact *</label>
                <select
                  value={specialContactId}
                  onChange={(e) => setSpecialContactId(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Resident --</option>
                  {tenantContacts.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.propertyName ? `(${t.propertyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Charge Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={specialAmount}
                    onChange={(e) => setSpecialAmount(Number(e.target.value))}
                    className="w-full pl-6 p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Reason / Item *</label>
                <input
                  type="text"
                  value={specialReason}
                  onChange={(e) => setSpecialReason(e.target.value)}
                  placeholder="e.g. Replacement Electronic Keypad Fob"
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Detailed Description</label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateSpecialInvoice}
                disabled={isGenerating || !specialContactId}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-xs transition"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch Special Square Invoice</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HISTORICAL SQUARE INVOICES DISPATCH TABLE */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Square Invoices Record Ledger</span>
              <span className="text-xs bg-zinc-100 text-zinc-600 font-mono px-2 py-0.5 rounded-full">
                {invoices.length} Total
              </span>
            </h2>
            <p className="text-xs text-zinc-500">
              Live tracking of Square Orders, payment links, and webhook statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice or resident..."
                className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-44 sm:w-56"
              />
            </div>

            <select
              value={filterInvoiceStatus}
              onChange={(e) => setFilterInvoiceStatus(e.target.value)}
              className="p-1.5 bg-zinc-50 border border-zinc-300 rounded-md text-xs text-zinc-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid / Overdue</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No invoices found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Type</th>
                  <th className="p-3">Property & Room</th>
                  <th className="p-3">Resident</th>
                  <th className="p-3">Square Invoice ID</th>
                  <th className="p-3">Billing Period</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        inv.subtask === 'rent'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.subtask === 'utility'
                          ? 'bg-amber-100 text-amber-800'
                          : inv.subtask === 'supplies'
                          ? 'bg-purple-100 text-purple-800'
                          : inv.subtask === 'late_fee'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {inv.subtask}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-zinc-900">{inv.propertyName}</p>
                      <p className="text-[11px] text-zinc-500">{inv.roomName || 'Whole Asset'}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-zinc-900">{inv.tenantName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{inv.tenantEmail}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 border border-zinc-200">
                        {inv.squareInvoiceId || 'pending'}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-700">
                      {inv.billingMonth} {inv.billingYear}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-zinc-600">
                      {inv.dueDate}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-900">
                      ${inv.totalAmount.toFixed(2)}
                      {inv.lateFeeAmount > 0 && (
                        <span className="block text-[10px] text-rose-600 font-normal">
                          (+${inv.lateFeeAmount.toFixed(2)} late fee)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {inv.status === 'PAID' && <Check className="w-2.5 h-2.5" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {inv.squarePaymentUrl && (
                        <a
                          href={inv.squarePaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded hover:bg-indigo-100 font-semibold transition"
                          title="Open Square Checkout / Payment Link"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Pay Link</span>
                        </a>
                      )}

                      {inv.status !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(inv)}
                          className="px-2 py-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold transition"
                          title="Simulate tenant payment in sandbox"
                        >
                          Mark Paid
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSyncInvoiceStatus(inv)}
                        disabled={syncingInvoiceId === inv.id}
                        className="px-1.5 py-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition"
                        title="Sync with Square API"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingInvoiceId === inv.id ? 'animate-spin' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Resident Email Edit Modal */}
      {editingEmailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Resident Email & Contact Info</h3>
                  <p className="text-[11px] text-zinc-500">{editingEmailItem.room.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmailItem(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {emailModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{emailModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  disabled
                  value={editingEmailItem.tenantName}
                  className="w-full p-2 bg-zinc-100 border border-zinc-300 rounded-md text-xs text-zinc-700 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tenant Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. daniel.oliveria@example.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-md text-xs font-mono text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Required for dispatching Square invoices and receipt notifications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tenant Phone Number <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. (415) 555-0199"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs font-mono text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Current Monthly Rent ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-zinc-500">$</span>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={modalRent || ''}
                    onChange={(e) => setModalRent(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-zinc-300 rounded-md text-xs font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 895"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Updates this room's base monthly rent in property inventory and upcoming invoice orders.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-zinc-50 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setEditingEmailItem(null)}
                disabled={isSavingEmailModal}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTenantEmail}
                disabled={isSavingEmailModal}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-xs transition"
              >
                {isSavingEmailModal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Update Invoicing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cloudflare Pages Secrets Setup Guide Modal */}
      <CloudflareSecretsModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        squareStatus={squareStatus}
      />
    </div>
  );
};
