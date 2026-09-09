import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Plus, 
  Sparkles, 
  Calendar, 
  User, 
  Home, 
  DollarSign, 
  FileSpreadsheet, 
  ShieldAlert, 
  LogOut,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Printer,
  Building2,
  Users,
  RotateCcw,
  Edit3,
  UserCheck
} from 'lucide-react';
import { Property, Room, LeaseRenewal, NavigationTab, Invoice, TenantLead, Contact } from '../types';
import { 
  GoogleWorkspaceService, 
  GoogleWorkspaceUser, 
  DocumentTemplateConfig, 
  GeneratedDocRecord,
  DEFAULT_OAUTH_CLIENT_ID
} from '../services/googleWorkspace';

interface GoogleDocsDriveViewProps {
  properties: Property[];
  rooms: Room[];
  renewals: LeaseRenewal[];
  invoices?: Invoice[];
  leads?: TenantLead[];
  contacts?: Contact[];
  onSelectTab?: (tab: NavigationTab) => void;
  initialTemplateType?: 'lease' | 'late_notice' | 'eviction' | 'utility_statement';
  initialTenantName?: string;
}

export const GoogleDocsDriveView: React.FC<GoogleDocsDriveViewProps> = ({
  properties,
  rooms,
  renewals,
  invoices = [],
  leads = [],
  contacts = [],
  onSelectTab,
  initialTemplateType = 'lease',
  initialTenantName = ''
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(GoogleWorkspaceService.getActiveToken());
  const [user, setUser] = useState<GoogleWorkspaceUser | null>(GoogleWorkspaceService.getConnectedUser());
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customClientId, setCustomClientId] = useState<string>(GoogleWorkspaceService.getClientId());
  const [showSettings, setShowSettings] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Templates state
  const [templates, setTemplates] = useState<DocumentTemplateConfig[]>(GoogleWorkspaceService.getTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateType ? `tpl_${initialTemplateType}` : 'tpl_lease'
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateDocInput, setTemplateDocInput] = useState<string>('');
  const [isCreatingStarterDoc, setIsCreatingStarterDoc] = useState<string | null>(null);

  // Property Selection state - Flagship 1070 Yank St preferred default
  const defaultProperty = properties.find(p => p.id === 'prop-1070-yank' || p.name.includes('1070 Yank')) || properties[0];
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(defaultProperty?.id || '');
  const [customPropertyName, setCustomPropertyName] = useState<string>(defaultProperty?.name || '1070 Yank St');
  const [customPropertyAddress, setCustomPropertyAddress] = useState<string>(
    defaultProperty ? `${defaultProperty.address}, ${defaultProperty.city}, ${defaultProperty.state} ${defaultProperty.zip}` : '1070 Yank St, Golden, CO 80215'
  );
  const [showPropertyAddressEdit, setShowPropertyAddressEdit] = useState<boolean>(false);

  // Resident / Room Source Mode
  const [residentSourceMode, setResidentSourceMode] = useState<'property_rooms' | 'crm_leads' | 'square_invoices' | 'blank_custom'>('property_rooms');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [customRoomName, setCustomRoomName] = useState<string>('');
  const [customTenantName, setCustomTenantName] = useState<string>(initialTenantName);
  const [customTenantEmail, setCustomTenantEmail] = useState<string>('');
  const [customTenantPhone, setCustomTenantPhone] = useState<string>('');
  const [customMonthlyRent, setCustomMonthlyRent] = useState<number>(850);
  const [customSecurityDeposit, setCustomSecurityDeposit] = useState<number>(850);
  const [customLateFee, setCustomLateFee] = useState<number>(50);
  const [customPastDue, setCustomPastDue] = useState<number>(850);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customVacateDeadline, setCustomVacateDeadline] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customViolationReason, setCustomViolationReason] = useState<string>(
    'Non-payment of past due rent balance and failure to cure within statutory grace period.'
  );

  // Utility billing specific state
  const [utilityDivisor, setUtilityDivisor] = useState<number>(7);
  const [electricBill, setElectricBill] = useState<number>(140);
  const [gasBill, setGasBill] = useState<number>(85);
  const [waterBill, setWaterBill] = useState<number>(65);

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSuccess, setGenerationSuccess] = useState<GeneratedDocRecord | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);

  // Generation history (stored in localStorage)
  const [docHistory, setDocHistory] = useState<GeneratedDocRecord[]>(() => {
    try {
      const saved = localStorage.getItem('moyer_crm_generated_docs_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep history in sync
  useEffect(() => {
    localStorage.setItem('moyer_crm_generated_docs_history', JSON.stringify(docHistory));
  }, [docHistory]);

  // Derived filtered rooms for currently active property
  const activeProperty = properties.find(p => p.id === selectedPropertyId) || defaultProperty;
  const propertyRooms = rooms.filter(r => !selectedPropertyId || r.propertyId === selectedPropertyId);

  // Handle room selection change
  const handleRoomChange = (roomId: string, currentRoomList: Room[] = rooms) => {
    setSelectedRoomId(roomId);
    if (roomId === 'custom_blank' || roomId === '') {
      setResidentSourceMode('blank_custom');
      setCustomTenantName('');
      setCustomTenantEmail('');
      setCustomTenantPhone('');
      setCustomRoomName('');
      setCustomMonthlyRent(850);
      setCustomSecurityDeposit(850);
      return;
    }

    const room = currentRoomList.find(r => r.id === roomId) || rooms.find(r => r.id === roomId);
    if (room) {
      setCustomRoomName(room.name);
      if (room.currentTenantName) setCustomTenantName(room.currentTenantName);
      if (room.currentTenantEmail) setCustomTenantEmail(room.currentTenantEmail);
      if (room.currentTenantPhone) setCustomTenantPhone(room.currentTenantPhone);
      if (room.monthlyRent) {
        setCustomMonthlyRent(room.monthlyRent);
        setCustomSecurityDeposit(room.securityDeposit || room.monthlyRent);
      }
      
      const renewal = renewals.find(r => r.roomId === roomId || (room.currentTenantName && r.tenantName === room.currentTenantName));
      if (renewal) {
        if (renewal.currentMonthlyRent) setCustomMonthlyRent(renewal.currentMonthlyRent);
        if (renewal.proposedMonthlyRent && selectedTemplateId === 'tpl_lease') {
          setCustomMonthlyRent(renewal.proposedMonthlyRent);
        }
        if (renewal.currentLeaseEndDate) {
          setCustomStartDate(renewal.currentLeaseEndDate);
        }
      }
    }
  };

  // Switch active property
  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      setCustomPropertyName(prop.name);
      setCustomPropertyAddress(`${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}`);
      const propRooms = rooms.filter(r => r.propertyId === propId);
      if (propRooms.length > 0) {
        const firstRoom = propRooms.find(r => r.currentTenantName) || propRooms[0];
        handleRoomChange(firstRoom.id, propRooms);
      } else {
        setSelectedRoomId('');
        setCustomRoomName('Room 1');
      }
    }
  };

  // One-click reset to clean blank form without sample data
  const handleResetToBlank = () => {
    setSelectedRoomId('custom_blank');
    setResidentSourceMode('blank_custom');
    setCustomTenantName('');
    setCustomTenantEmail('');
    setCustomTenantPhone('');
    setCustomRoomName('');
    setCustomMonthlyRent(850);
    setCustomSecurityDeposit(850);
    setCustomPastDue(0);
    setCustomLateFee(50);
  };

  // Select applicant from CRM leads
  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setCustomTenantName(lead.fullName);
      setCustomTenantEmail(lead.email || '');
      setCustomTenantPhone(lead.phone || '');
      if (lead.budgetMax) {
        setCustomMonthlyRent(lead.budgetMax);
        setCustomSecurityDeposit(lead.budgetMax);
      }
      if (lead.moveInDate) {
        setCustomStartDate(lead.moveInDate);
      }
    }
  };

  // Select tenant from Overdue Invoices
  const handleInvoiceSelect = (invId: string) => {
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setCustomTenantName(inv.tenantName);
      if (inv.tenantEmail) setCustomTenantEmail(inv.tenantEmail);
      if (inv.roomName) setCustomRoomName(inv.roomName);
      setCustomPastDue(inv.amount);
      if (inv.amount) setCustomMonthlyRent(inv.amount);
    }
  };

  // Set initial selected room if tenant name passed or load default property rooms
  useEffect(() => {
    if (initialTenantName) {
      const matchingRoom = rooms.find(r => 
        r.currentTenantName?.toLowerCase().includes(initialTenantName.toLowerCase())
      );
      if (matchingRoom) {
        setSelectedPropertyId(matchingRoom.propertyId);
        const prop = properties.find(p => p.id === matchingRoom.propertyId);
        if (prop) {
          setCustomPropertyName(prop.name);
          setCustomPropertyAddress(`${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}`);
        }
        handleRoomChange(matchingRoom.id);
      } else {
        setCustomTenantName(initialTenantName);
      }
    } else if (!selectedRoomId && propertyRooms.length > 0) {
      const firstRoom = propertyRooms.find(r => r.currentTenantName) || propertyRooms[0];
      handleRoomChange(firstRoom.id, propertyRooms);
    }
  }, [initialTenantName, selectedPropertyId]);

  // Connect via Firebase Auth (Bypasses GIS origin_mismatch on Cloudflare & custom domains)
  const handleConnectFirebase = async (loginHint: string = 'info@1070yankstreet.com') => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const res = await GoogleWorkspaceService.requestAccessTokenViaFirebaseAuth(loginHint);
      setToken(res.accessToken);
      setUser(res.user || null);
    } catch (err: any) {
      console.error('Firebase Workspace Auth error:', err);
      setAuthError(err.message || 'Failed to authenticate via Firebase Google Auth.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via Google Identity Services (GIS Token Client)
  const handleConnectGoogle = async (loginHint: string = 'info@1070yankstreet.com') => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const res = await GoogleWorkspaceService.requestAccessToken(loginHint, customClientId);
      setToken(res.accessToken);
      setUser(res.user || null);
    } catch (err: any) {
      console.error('Google Workspace Auth error:', err);
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('origin_mismatch') || errMsg.toLowerCase().includes('origin')) {
        setAuthError(
          `Google OAuth Error 400: origin_mismatch. Your current origin "${currentOrigin}" must be added to Authorized JavaScript Origins in Google Cloud Console, or connect via Firebase Auth.`
        );
      } else {
        setAuthError(errMsg || 'Failed to connect to Google Workspace. Please check your popup blocker.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyOrigin = () => {
    if (navigator.clipboard && currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2500);
    }
  };

  const handleSaveClientId = (newId: string) => {
    setCustomClientId(newId);
    GoogleWorkspaceService.saveClientId(newId);
  };

  const handleDisconnect = () => {
    GoogleWorkspaceService.disconnect();
    setToken(null);
    setUser(null);
  };

  // Save updated template Google Doc ID
  const handleSaveTemplateDocId = (tplId: string, inputUrlOrId: string) => {
    // Extract doc ID if full URL pasted
    let docId = inputUrlOrId.trim();
    const match = docId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      docId = match[1];
    }

    const updated = templates.map(t => t.id === tplId ? { ...t, googleDocId: docId } : t);
    setTemplates(updated);
    GoogleWorkspaceService.saveTemplates(updated);
    setEditingTemplateId(null);
    setTemplateDocInput('');
  };

  // 1-Click Create Starter Template in Google Drive
  const handleCreateStarterTemplateInDrive = async (tpl: DocumentTemplateConfig) => {
    if (!token) {
      handleConnectGoogle('jake@1070yankstreet.com');
      return;
    }

    setIsCreatingStarterDoc(tpl.id);
    setGenerationError(null);

    try {
      const starterTitle = `[TEMPLATE] 1070 Yank St - ${tpl.name}`;
      const starterBody = GoogleWorkspaceService.getStarterTemplateContent(tpl.type);
      const newDoc = await GoogleWorkspaceService.createGoogleDoc(starterTitle, starterBody, token);

      // Save the created Doc ID as this template's active Google Doc
      const updated = templates.map(t => t.id === tpl.id ? { ...t, googleDocId: newDoc.documentId } : t);
      setTemplates(updated);
      GoogleWorkspaceService.saveTemplates(updated);

      alert(`Success! Created starter Google Doc template: "${starterTitle}". It is now linked and saved in your Google Drive.`);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to create starter Google Doc in Drive.');
    } finally {
      setIsCreatingStarterDoc(null);
    }
  };

  // Copy placeholder tag
  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedPlaceholder(tag);
    setTimeout(() => setCopiedPlaceholder(null), 2000);
  };

  // Execute Auto-Fill and Save Document in Google Drive
  const handleGenerateDocument = async () => {
    if (!token) {
      handleConnectGoogle('jake@1070yankstreet.com');
      return;
    }

    const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
    const activeRoom = rooms.find(r => r.id === selectedRoomId);
    const activeProperty = properties.find(p => p.id === selectedPropertyId) || properties.find(p => p.id === activeRoom?.propertyId) || defaultProperty;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      let targetDocId = '';
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const tenantClean = customTenantName.trim() || activeRoom?.currentTenantName || 'Resident';
      const roomClean = customRoomName.trim() || activeRoom?.name || 'Room 1';
      const propertyClean = customPropertyName.trim() || activeProperty?.name || '1070 Yank St';
      const addressClean = customPropertyAddress.trim() || (activeProperty ? `${activeProperty.address}, ${activeProperty.city}, ${activeProperty.state} ${activeProperty.zip}` : '1070 Yank St, Golden, CO 80215');
      const newDocTitle = `${activeTemplate.name} - ${tenantClean} (${roomClean}) - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

      // Step 1: Copy existing template OR create a clean formatted document
      if (activeTemplate.googleDocId) {
        const copyResult = await GoogleWorkspaceService.copyDriveFile(activeTemplate.googleDocId, newDocTitle, token);
        targetDocId = copyResult.id;
      } else {
        // Create from starter content directly
        const starterContent = GoogleWorkspaceService.getStarterTemplateContent(activeTemplate.type);
        const created = await GoogleWorkspaceService.createGoogleDoc(newDocTitle, starterContent, token);
        targetDocId = created.documentId;
      }

      // Step 2: Build replacement dictionary
      const totalUtilityBill = electricBill + gasBill + waterBill;
      const tenantUtilityShare = Math.round((totalUtilityBill / Math.max(1, utilityDivisor)) * 100) / 100;

      const replacements: Record<string, string> = {
        '{{tenant_name}}': tenantClean,
        '{{tenant_email}}': customTenantEmail.trim() || activeRoom?.currentTenantEmail || 'resident@1070yankstreet.com',
        '{{tenant_phone}}': customTenantPhone.trim() || activeRoom?.currentTenantPhone || '(303) 555-0100',
        '{{property_name}}': propertyClean,
        '{{property_address}}': addressClean,
        '{{room_name}}': roomClean,
        '{{monthly_rent}}': `$${customMonthlyRent.toLocaleString()}`,
        '{{security_deposit}}': `$${customSecurityDeposit.toLocaleString()}`,
        '{{lease_start_date}}': customStartDate,
        '{{lease_end_date}}': customEndDate,
        '{{payment_due_day}}': '1st',
        '{{late_fee_amount}}': `$${customLateFee}`,
        '{{past_due_amount}}': `$${customPastDue.toLocaleString()}`,
        '{{total_owed}}': `$${(customPastDue + customLateFee).toLocaleString()}`,
        '{{due_date}}': new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        '{{payment_deadline}}': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        '{{payment_method}}': 'Square Online Tenant Portal (Credit Card, Debit, or ACH)',
        '{{vacate_deadline_date}}': customVacateDeadline,
        '{{violation_reason}}': customViolationReason,
        '{{key_return_instructions}}': 'Return room key and mailbox key to property manager lockbox located in the main foyer.',
        '{{manager_name}}': activeProperty?.ownerName || 'Jake Moyer, 1070 Yank Street Coliving',
        '{{manager_phone}}': activeProperty?.ownerPhone || '(303) 555-0199',
        '{{manager_email}}': activeProperty?.ownerEmail || 'jake@1070yankstreet.com',
        '{{today_date}}': todayStr,
        '{{billing_period}}': new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        '{{electric_total}}': `$${electricBill.toFixed(2)}`,
        '{{gas_total}}': `$${gasBill.toFixed(2)}`,
        '{{water_total}}': `$${waterBill.toFixed(2)}`,
        '{{combined_utilities_total}}': `$${totalUtilityBill.toFixed(2)}`,
        '{{utility_divisor}}': String(utilityDivisor),
        '{{tenant_share_amount}}': `$${tenantUtilityShare.toFixed(2)}`,
        '{{payment_due_date}}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        '{{utility_terms}}': `Tenants are billed monthly for shared variable utilities (Electric, Gas, Water & Sewer) divided equally by ${utilityDivisor}. High-speed fiber internet and trash removal are provided at no additional cost.`,
        '{{house_rules}}': '1. Quiet hours observed 10:00 PM - 7:00 AM daily. 2. Clean shared kitchen areas immediately following use. 3. No unauthorized overnight guests exceeding 3 consecutive nights without written manager approval. 4. Smoking prohibited indoors.',
      };

      // Step 3: Replace all placeholders in the newly created doc
      await GoogleWorkspaceService.replaceAllPlaceholders(targetDocId, replacements, token);

      // Step 4: Retrieve web view link
      const driveFile = await GoogleWorkspaceService.getDriveFile(targetDocId, token);
      const webViewLink = driveFile.webViewLink || `https://docs.google.com/document/d/${targetDocId}/edit`;

      const record: GeneratedDocRecord = {
        id: `gen_${Date.now()}`,
        templateType: activeTemplate.type,
        documentId: targetDocId,
        documentTitle: newDocTitle,
        webViewLink,
        tenantName: tenantClean,
        tenantId: activeRoom?.currentTenantId,
        roomName: roomClean,
        propertyName: propertyClean,
        createdAt: new Date().toISOString(),
        status: 'saved_to_drive',
      };

      setGenerationSuccess(record);
      setDocHistory(prev => [record, ...prev.slice(0, 49)]); // Keep last 50
    } catch (err: any) {
      console.error('Generation failed:', err);
      setGenerationError(err.message || 'An error occurred during Google Docs generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const activeRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <HardDrive className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Google Docs & Drive Center</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              Workspace
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Auto-populate lease agreements, late rent demands, eviction notices, and utility statements into Google Docs and save directly to your Google Drive.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="flex items-center gap-2">
          {onSelectTab && (
            <>
              <button
                onClick={() => onSelectTab('renewals')}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                Lease Renewals
              </button>
              <button
                onClick={() => onSelectTab('invoicing')}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
                Invoicing
              </button>
            </>
          )}
        </div>
      </div>

      {/* Connection Status & Account Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              token ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-zinc-100 text-zinc-500 border border-zinc-300'
            }`}>
              {token ? '✓' : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900">
                  {token ? 'Google Workspace Connected' : 'Google Drive & Docs Not Connected'}
                </h2>
                {token && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {token 
                  ? `Authorized for ${user?.email || '1070yankstreet.com'}. Docs & Drive file access granted.`
                  : 'Connect your Google account (e.g. 1070yankstreet.com) to read templates and save generated documents directly to Drive.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {token ? (
              <>
                <button
                  onClick={() => handleConnectFirebase(user?.email || 'info@1070yankstreet.com')}
                  disabled={isConnecting}
                  className="px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Reconnect via Firebase Google Auth"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                  Switch / Reconnect
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Primary Button: Firebase Auth Flow (Avoids GIS Origin Mismatch on Cloudflare) */}
                <button
                  onClick={() => handleConnectFirebase('info@1070yankstreet.com')}
                  disabled={isConnecting}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center gap-2"
                  title="Recommended for Cloudflare & custom domains (routes through Firebase Auth handler)"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span>Sign In with Google (Firebase)</span>
                </button>

                {/* Secondary Button: Direct GIS Client */}
                <button
                  onClick={() => handleConnectGoogle('info@1070yankstreet.com')}
                  disabled={isConnecting}
                  className="px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Direct Google Identity Services popup (requires origin registered in Google Cloud Console)"
                >
                  <span>Direct GIS</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors border ${
                showSettings 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 border-zinc-200'
              }`}
              title="Cloudflare & OAuth Origin Settings"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OAuth Client ID & Cloudflare Origin Settings Drawer */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3">
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cloudflare / Custom Domain & OAuth Setup</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Google OAuth strictly checks the originating domain of your request to prevent origin mismatch errors.
                  </p>
                </div>
              </div>

              {/* Current Detected Origin */}
              <div className="bg-white p-3 rounded border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Current Detected JavaScript Origin:</span>
                  <div className="font-mono text-xs font-semibold text-zinc-800 break-all">{currentOrigin || 'Loading...'}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded border border-zinc-300 transition flex items-center gap-1.5 shrink-0"
                >
                  {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-600" />}
                  <span>{copiedOrigin ? 'Copied!' : 'Copy Origin'}</span>
                </button>
              </div>

              {/* Instructions list */}
              <div className="text-[11px] text-zinc-600 space-y-1 bg-blue-50/60 p-3 rounded border border-blue-100">
                <p className="font-bold text-blue-900">How to resolve Error 400: origin_mismatch in Google Cloud Console:</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-700">
                  <li>Copy your current origin above (<span className="font-mono font-medium">{currentOrigin}</span>).</li>
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>Click on your <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
                  <li>Scroll to <strong>Authorized JavaScript origins</strong>, click <strong>+ ADD URI</strong>, and paste your origin.</li>
                  <li>Click <strong>Save</strong> (allow 2-5 minutes for Google to propagate changes).</li>
                </ol>
              </div>

              {/* Custom Client ID Input */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-1">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-zinc-700">Custom Google OAuth Client ID (Optional)</label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => handleSaveClientId(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-zinc-300 rounded font-mono text-xs text-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="xxxx.apps.googleusercontent.com"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Scopes configured: <span className="font-mono text-zinc-700">https://www.googleapis.com/auth/documents</span>, <span className="font-mono text-zinc-700">https://www.googleapis.com/auth/drive.file</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Origin Mismatch Diagnosis or General Auth Error */}
        {authError && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2.5">
            <div className="flex items-start gap-2 text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Authentication Issue:</span> {authError}
              </div>
            </div>

            {(authError.toLowerCase().includes('origin_mismatch') || authError.toLowerCase().includes('origin') || authError.includes('400')) && (
              <div className="bg-white/80 p-3 rounded border border-rose-200 space-y-2 text-zinc-700">
                <p className="font-bold text-rose-950">Quick Fix for Cloudflare & Custom Domains:</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-100/50 p-2 rounded border border-rose-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Origin to Register in Google Cloud Console:</span>
                    <p className="font-mono text-xs font-bold text-zinc-900">{currentOrigin}</p>
                  </div>
                  <button
                    onClick={handleCopyOrigin}
                    className="px-3 py-1 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 rounded font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition shrink-0"
                  >
                    {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOrigin ? 'Copied!' : 'Copy Origin'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => handleConnectFirebase('info@1070yankstreet.com')}
                    disabled={isConnecting}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-xs transition"
                  >
                    Try Sign-In via Firebase Auth
                  </button>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-semibold text-xs border border-zinc-300 transition flex items-center gap-1"
                  >
                    <span>Open Google Cloud Credentials</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 1-Click Document Generator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  1-Click Document Generator
                </h2>
              </div>
              <span className="text-xs text-zinc-500">Live CRM Data Integration</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Document Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  1. Select Document Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {templates.map(tpl => {
                    const isSelected = tpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                        }`}
                      >
                        <div>
                          <div className={`p-1.5 rounded-md inline-block mb-2 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {tpl.type === 'lease' && <FileText className="w-4 h-4" />}
                            {tpl.type === 'late_notice' && <DollarSign className="w-4 h-4" />}
                            {tpl.type === 'eviction' && <ShieldAlert className="w-4 h-4" />}
                            {tpl.type === 'utility_statement' && <FileSpreadsheet className="w-4 h-4" />}
                          </div>
                          <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-blue-950' : 'text-zinc-800'}`}>
                            {tpl.type === 'lease' && 'Lease'}
                            {tpl.type === 'late_notice' && 'Late Notice'}
                            {tpl.type === 'eviction' && 'Notice to Vacate'}
                            {tpl.type === 'utility_statement' && 'Utility Split'}
                          </p>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-2 block">
                          {tpl.googleDocId ? 'Template Linked' : 'Starter Included'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Target Property & Resident Selection */}
              <div className="space-y-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    2. Select Property & Resident Data
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToBlank}
                    className="self-start sm:self-auto flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition-colors"
                    title="Clear sample data and enter real resident details manually"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear to Blank Form (No Sample Data)</span>
                  </button>
                </div>

                {/* Property & Data Source Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-700">Property</label>
                      <button
                        type="button"
                        onClick={() => setShowPropertyAddressEdit(!showPropertyAddressEdit)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        {showPropertyAddressEdit ? 'Done' : 'Edit Address'}
                      </button>
                    </div>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => handlePropertyChange(e.target.value)}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.city}, {p.state}) {p.id === 'prop-1070-yank' ? '★ Primary' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Data Source</label>
                    <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-white text-xs">
                      <button
                        type="button"
                        onClick={() => setResidentSourceMode('property_rooms')}
                        className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all ${
                          residentSourceMode === 'property_rooms'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Rooms ({propertyRooms.length})
                      </button>
                      {leads.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setResidentSourceMode('crm_leads')}
                          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all ${
                            residentSourceMode === 'crm_leads'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          Leads ({leads.length})
                        </button>
                      )}
                      {invoices.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setResidentSourceMode('square_invoices')}
                          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all ${
                            residentSourceMode === 'square_invoices'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          Invoices ({invoices.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setResidentSourceMode('blank_custom');
                          handleResetToBlank();
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all ${
                          residentSourceMode === 'blank_custom'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        ✍️ Custom Blank
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Property Name & Address Quick Edit */}
                {showPropertyAddressEdit && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-900 mb-0.5">Property Name in Doc</label>
                      <input
                        type="text"
                        value={customPropertyName}
                        onChange={(e) => setCustomPropertyName(e.target.value)}
                        className="w-full p-1.5 bg-white border border-blue-300 rounded text-xs text-zinc-900"
                        placeholder="e.g. 1070 Yank St"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-900 mb-0.5">Full Address in Doc</label>
                      <input
                        type="text"
                        value={customPropertyAddress}
                        onChange={(e) => setCustomPropertyAddress(e.target.value)}
                        className="w-full p-1.5 bg-white border border-blue-300 rounded text-xs text-zinc-900"
                        placeholder="e.g. 1070 Yank St, Golden, CO 80215"
                      />
                    </div>
                  </div>
                )}

                {/* Selector Dropdown based on active mode */}
                {residentSourceMode === 'property_rooms' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Choose Room & Resident from {activeProperty?.name || 'Property'}
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => handleRoomChange(e.target.value, propertyRooms)}
                      className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Choose Room / Current Resident --</option>
                      <option value="custom_blank">✍️ Enter Custom Resident / Blank Form</option>
                      {propertyRooms.some(r => r.currentTenantName) && (
                        <optgroup label="Occupied Rooms">
                          {propertyRooms.filter(r => r.currentTenantName).map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} — {room.currentTenantName} (${room.monthlyRent}/mo)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {propertyRooms.some(r => !r.currentTenantName) && (
                        <optgroup label="Vacant / Available Rooms">
                          {propertyRooms.filter(r => !r.currentTenantName).map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} — (Vacant / Ready for New Lease) (${room.monthlyRent}/mo)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {residentSourceMode === 'crm_leads' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Select Move-In Applicant from CRM Leads
                    </label>
                    <select
                      onChange={(e) => handleLeadSelect(e.target.value)}
                      className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Select Applicant from CRM Leads --</option>
                      {leads.map(lead => (
                        <option key={lead.id} value={lead.id}>
                          {lead.fullName} ({lead.email || 'No email'}) — Stage: {lead.stage} — Budget: ${lead.budgetMax}/mo
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {residentSourceMode === 'square_invoices' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Select Tenant from Overdue Invoices
                    </label>
                    <select
                      onChange={(e) => handleInvoiceSelect(e.target.value)}
                      className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Select Overdue Invoice Record --</option>
                      {invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.tenantName} — {inv.roomName || 'Room'} (${inv.amount} - {inv.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {residentSourceMode === 'blank_custom' && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Custom / Real Resident Mode active. Enter your live tenant details in Step 3 below with zero sample data.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Dynamic Parameter Inputs */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    3. Verify & Customize Live Auto-Fill Fields
                  </p>
                  <span className="text-[11px] text-zinc-500">All fields auto-map into Google Doc tags</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Tenant Full Name</label>
                    <input
                      type="text"
                      value={customTenantName}
                      onChange={(e) => setCustomTenantName(e.target.value)}
                      placeholder="e.g. John Doe (or real tenant name)"
                      className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Room / Unit Name</label>
                    <input
                      type="text"
                      value={customRoomName}
                      onChange={(e) => setCustomRoomName(e.target.value)}
                      placeholder="e.g. Room 1 - Main Floor West Suite"
                      className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Tenant Email</label>
                    <input
                      type="email"
                      value={customTenantEmail}
                      onChange={(e) => setCustomTenantEmail(e.target.value)}
                      placeholder="e.g. resident@gmail.com"
                      className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Tenant Phone</label>
                    <input
                      type="tel"
                      value={customTenantPhone}
                      onChange={(e) => setCustomTenantPhone(e.target.value)}
                      placeholder="e.g. (303) 555-0100"
                      className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Monthly Room Rent ($)</label>
                    <input
                      type="number"
                      value={customMonthlyRent}
                      onChange={(e) => setCustomMonthlyRent(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {activeTemplate.type === 'lease' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Security Deposit ($)</label>
                        <input
                          type="number"
                          value={customSecurityDeposit}
                          onChange={(e) => setCustomSecurityDeposit(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Late Fee Amount ($)</label>
                        <input
                          type="number"
                          value={customLateFee}
                          onChange={(e) => setCustomLateFee(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Lease Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Lease End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {activeTemplate.type === 'late_notice' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Past Due Rent ($)</label>
                        <input
                          type="number"
                          value={customPastDue}
                          onChange={(e) => setCustomPastDue(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Late Fee ($)</label>
                        <input
                          type="number"
                          value={customLateFee}
                          onChange={(e) => setCustomLateFee(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 font-medium">
                        Total Demand Amount: <span className="font-mono font-bold">${(customPastDue + customLateFee).toFixed(2)}</span> (Demand deadline set to 3 business days from notice date)
                      </div>
                    </>
                  )}

                  {activeTemplate.type === 'eviction' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Vacate Deadline Date</label>
                        <input
                          type="date"
                          value={customVacateDeadline}
                          onChange={(e) => setCustomVacateDeadline(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Reason for Notice</label>
                        <textarea
                          rows={2}
                          value={customViolationReason}
                          onChange={(e) => setCustomViolationReason(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {activeTemplate.type === 'utility_statement' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Electric Bill ($)</label>
                        <input
                          type="number"
                          value={electricBill}
                          onChange={(e) => setElectricBill(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Gas / Heating Bill ($)</label>
                        <input
                          type="number"
                          value={gasBill}
                          onChange={(e) => setGasBill(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Water & Sewer Bill ($)</label>
                        <input
                          type="number"
                          value={waterBill}
                          onChange={(e) => setWaterBill(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-md font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-900 mb-1">Utility Divisor</label>
                        <input
                          type="number"
                          min="1"
                          value={utilityDivisor}
                          onChange={(e) => setUtilityDivisor(Math.max(1, Number(e.target.value)))}
                          className="w-full p-2 bg-blue-50 border border-blue-300 rounded-md font-mono font-bold text-xs text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-900 font-medium">
                        Total Utilities: <span className="font-mono font-bold">${(electricBill + gasBill + waterBill).toFixed(2)}</span> divided by {utilityDivisor} = <span className="font-mono font-bold">${((electricBill + gasBill + waterBill) / Math.max(1, utilityDivisor)).toFixed(2)}</span> per resident share (Trash & internet excluded)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Generation Button & Actions */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating & Saving to Google Drive...
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      Generate & Save to Google Drive
                    </>
                  )}
                </button>

                {!token && (
                  <p className="text-center text-xs text-zinc-500">
                    Note: Clicking generate will prompt you to authenticate your Google Drive (<span className="font-medium text-zinc-700">1070yankstreet.com</span>).
                  </p>
                )}
              </div>

              {/* Generation Result Banner */}
              {generationSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Document Generated & Saved to Drive!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        "{generationSuccess.documentTitle}" is ready in your Google Drive with all live tenant data populated.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                    <a
                      href={generationSuccess.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Google Docs
                    </a>
                    <a
                      href={`https://docs.google.com/document/d/${generationSuccess.documentId}/export?format=pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  </div>
                </div>
              )}

              {generationError && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Generation Failed</h4>
                    <p className="text-xs text-rose-700 mt-0.5">{generationError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Templates Hub & Placeholders (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Master Template Configuration Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Master Google Doc Templates
                </h3>
              </div>
            </div>

            <div className="p-5 divide-y divide-zinc-100">
              {templates.map(tpl => {
                const isEditing = editingTemplateId === tpl.id;
                return (
                  <div key={tpl.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{tpl.name}</h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{tpl.description}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tpl.googleDocId ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {tpl.googleDocId ? 'Drive Linked' : 'Standard'}
                      </span>
                    </div>

                    {tpl.googleDocId ? (
                      <div className="flex items-center justify-between gap-2 bg-zinc-50 p-2 rounded border border-zinc-200">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] font-mono text-zinc-500 truncate">
                            ID: {tpl.googleDocId.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://docs.google.com/document/d/${tpl.googleDocId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => {
                              setEditingTemplateId(tpl.id);
                              setTemplateDocInput(tpl.googleDocId);
                            }}
                            className="text-[11px] text-zinc-500 hover:text-zinc-700 ml-2"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={templateDocInput}
                              onChange={(e) => setTemplateDocInput(e.target.value)}
                              placeholder="Paste Google Doc URL or ID"
                              className="w-full p-2 bg-white border border-zinc-300 rounded text-xs text-zinc-800"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveTemplateDocId(tpl.id, templateDocInput)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded"
                              >
                                Save Link
                              </button>
                              <button
                                onClick={() => setEditingTemplateId(null)}
                                className="px-3 py-1 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreateStarterTemplateInDrive(tpl)}
                              disabled={isCreatingStarterDoc === tpl.id}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors flex items-center gap-1"
                            >
                              {isCreatingStarterDoc === tpl.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              Create in My Drive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplateId(tpl.id);
                                setTemplateDocInput('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                            >
                              Paste Existing Doc Link
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Placeholders Reference Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Supported Template Tags
              </h3>
              <span className="text-[10px] text-zinc-400">Click to copy</span>
            </div>
            <p className="text-xs text-zinc-500">
              Add these exact placeholder tags anywhere in your Google Doc template to automatically replace them when generating:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeTemplate.placeholders.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleCopyTag(tag)}
                  className="px-2 py-1 bg-zinc-100 hover:bg-blue-50 hover:text-blue-700 border border-zinc-200 hover:border-blue-300 rounded font-mono text-[11px] text-zinc-700 transition-colors flex items-center gap-1"
                  title="Click to copy tag"
                >
                  {copiedPlaceholder === tag ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-zinc-400" />
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Documents History Table */}
      {docHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Recently Generated Documents in Google Drive ({docHistory.length})
              </h3>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Clear document generation history? (Files in Google Drive will remain untouched)')) {
                  setDocHistory([]);
                }
              }}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase font-semibold">
                <tr>
                  <th className="p-3">Document Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Tenant & Room</th>
                  <th className="p-3">Date Generated</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {docHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-3 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-xs">{item.documentTitle}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 uppercase">
                        {item.templateType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-700">
                      <span className="font-medium">{item.tenantName}</span>
                      {item.roomName && <span className="text-zinc-400 ml-1">({item.roomName})</span>}
                    </td>
                    <td className="p-3 font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors"
                      >
                        Open in Docs <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={`https://docs.google.com/document/d/${item.documentId}/export?format=pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded text-[11px] font-medium transition-colors"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
