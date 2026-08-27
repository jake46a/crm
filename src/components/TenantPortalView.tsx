import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  Key, 
  Wifi, 
  Phone, 
  User, 
  Send, 
  MessageSquare, 
  Search, 
  Filter, 
  FileText, 
  Check, 
  ShieldAlert, 
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { WorkOrder, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus, Property, Room, Contact } from '../types';
import { PriorityBadge, WorkOrderStatusBadge, MonthToMonthBadge } from './common/Badges';

interface TenantPortalViewProps {
  workOrders: WorkOrder[];
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
  onSaveWorkOrder: (workOrder: WorkOrder) => void;
  onUpdateWorkOrder: (workOrder: WorkOrder) => void;
}

export const TenantPortalView: React.FC<TenantPortalViewProps> = ({
  workOrders,
  properties,
  rooms,
  contacts,
  onSaveWorkOrder,
  onUpdateWorkOrder
}) => {
  // Available occupied rooms for tenant simulation
  const occupiedRooms = rooms.filter(r => r.currentTenantName);
  
  // Selected tenant / room state
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    occupiedRooms[0]?.id || rooms[0]?.id || ''
  );
  
  const currentRoom = rooms.find(r => r.id === selectedRoomId);
  const currentProperty = properties.find(p => p.id === currentRoom?.propertyId) || properties[0];

  // Active view tab in portal
  const [activePortalTab, setActivePortalTab] = useState<'submit' | 'track' | 'house-guide'>('submit');

  // Form State
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState<WorkOrderCategory>('Plumbing');
  const [ticketPriority, setTicketPriority] = useState<WorkOrderPriority>('Medium');
  const [isCommonArea, setIsCommonArea] = useState(false);
  const [entryPermission, setEntryPermission] = useState(true);
  const [accessNotes, setAccessNotes] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessTicket, setSubmissionSuccessTicket] = useState<string | null>(null);

  // Tracking Filter & Selection
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'In Progress' | 'Completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Interactive Comment state
  const [newComment, setNewComment] = useState('');
  
  // Photo Lightbox modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Auto-generate ticket number for display
  const [previewTicketNumber] = useState(() => `WO-${Math.floor(1000 + Math.random() * 9000)}`);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setUploadedPhotos(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddSamplePhoto = (url: string) => {
    if (!uploadedPhotos.includes(url)) {
      setUploadedPhotos(prev => [...prev, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Work Order
  const handleSubmitWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) return;

    setIsSubmitting(true);

    const generatedTicketNo = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const tenantName = currentRoom?.currentTenantName || 'Resident Tenant';
    const tenantPhone = currentRoom?.currentTenantPhone || '(303) 555-0100';
    const tenantEmail = currentRoom?.currentTenantEmail || `${tenantName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    const newTicket: WorkOrder = {
      id: `wo-${Date.now()}`,
      ticketNumber: generatedTicketNo,
      title: ticketTitle,
      description: ticketDescription,
      propertyId: currentProperty.id,
      propertyName: currentProperty.name,
      roomId: isCommonArea ? undefined : currentRoom?.id,
      roomName: isCommonArea ? 'Shared House Common Area' : currentRoom?.name || 'Private Bedroom',
      isCommonArea,
      tenantId: currentRoom?.currentTenantId,
      reportedByName: tenantName,
      reportedByPhone: tenantPhone,
      reportedByEmail: tenantEmail,
      category: ticketCategory,
      priority: ticketPriority,
      status: 'New',
      estimatedCost: ticketPriority === 'Emergency' ? 250 : 120,
      dateReported: new Date().toISOString().split('T')[0],
      accessInstructions: accessNotes || (entryPermission ? `Permission to enter granted. Master Keypad: ${currentProperty.keypadMasterCode || 'Provided'}` : 'Resident requests advance call before entering.'),
      entryPermission,
      photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          status: 'New',
          note: `Maintenance ticket #${generatedTicketNo} logged via Tenant Portal.`,
          author: tenantName
        }
      ],
      comments: [
        {
          id: `c-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          author: tenantName,
          isTenant: true,
          message: ticketDescription
        }
      ]
    };

    onSaveWorkOrder(newTicket);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionSuccessTicket(generatedTicketNo);
      setSelectedTicketId(newTicket.id);
      
      // Reset form
      setTicketTitle('');
      setTicketDescription('');
      setUploadedPhotos([]);
      setAccessNotes('');
    }, 400);
  };

  // Filter tenant tickets
  const tenantTickets = workOrders.filter(wo => {
    // Match by current property or current tenant room
    const isMatchingProperty = wo.propertyId === currentProperty.id;
    const isMatchingRoom = wo.roomId === currentRoom?.id;
    const isReportedByTenant = currentRoom?.currentTenantName && wo.reportedByName.toLowerCase().includes(currentRoom.currentTenantName.toLowerCase().split(' ')[0]);

    const belongsToContext = isMatchingProperty || isMatchingRoom || isReportedByTenant;
    if (!belongsToContext) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'New' && wo.status !== 'New') return false;
      if (statusFilter === 'In Progress' && (wo.status !== 'In Progress' && wo.status !== 'Assigned' && wo.status !== 'Scheduled' && wo.status !== 'Awaiting Parts')) return false;
      if (statusFilter === 'Completed' && wo.status !== 'Completed') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        wo.ticketNumber.toLowerCase().includes(q) ||
        wo.title.toLowerCase().includes(q) ||
        wo.description.toLowerCase().includes(q) ||
        wo.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const selectedTicket = workOrders.find(w => w.id === selectedTicketId) || tenantTickets[0];

  // Add comment to selected ticket
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;

    const tenantName = currentRoom?.currentTenantName || 'Resident';
    const commentObj = {
      id: `c-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      author: tenantName,
      isTenant: true,
      message: newComment
    };

    const updated = {
      ...selectedTicket,
      comments: [...(selectedTicket.comments || []), commentObj]
    };

    onUpdateWorkOrder(updated);
    setNewComment('');
  };

    return (
    <div className="space-y-6 pb-12">
      {/* Top Tenant Header & Profile Switcher */}
      <div className="bg-zinc-900 text-white rounded-lg p-6 shadow-xs border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-sm border border-indigo-400/30 uppercase tracking-wide">
                  Resident Maintenance Portal
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-sm border border-emerald-400/30 uppercase tracking-wide">
                  Month-to-Month Tenancy
                </span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight mt-1">
                Moyer Resident Services & Repair Hub
              </h1>
              <p className="text-xs text-zinc-400">
                Submit repair requests, upload photos, and track work orders with real-time technician updates.
              </p>
            </div>
          </div>

          {/* Active Tenant Profile Switcher */}
          <div className="bg-zinc-800/90 border border-zinc-700 rounded-md p-3 flex flex-col gap-1 min-w-[280px]">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3 text-indigo-400" />
              Viewing as Resident Tenancy:
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                setSubmissionSuccessTicket(null);
              }}
              className="bg-zinc-900 border border-zinc-600 rounded-sm px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-400"
            >
              {occupiedRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.currentTenantName} — {r.propertyName} ({r.name})
                </option>
              ))}
            </select>
            {currentRoom && (
              <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1 border-t border-zinc-700/60 mt-1">
                <span>Rent: ${currentRoom.monthlyRent}/mo</span>
                <span className="text-emerald-400 font-medium">● Active MTM Resident</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Room & Property Specs Bar */}
        {currentProperty && currentRoom && (
          <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-zinc-800/50 p-2.5 rounded-sm border border-zinc-700/50">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Your Property</p>
              <p className="font-bold text-white truncate">{currentProperty.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentProperty.address}</p>
            </div>
            <div className="bg-zinc-800/50 p-2.5 rounded-sm border border-zinc-700/50">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Assigned Room</p>
              <p className="font-bold text-white truncate">{currentRoom.name}</p>
              <p className="text-[11px] text-zinc-400">{currentRoom.bathroomType}</p>
            </div>
            <div className="bg-zinc-800/50 p-2.5 rounded-sm border border-zinc-700/50">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">House Wi-Fi</p>
              <p className="font-bold text-white flex items-center gap-1">
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span className="truncate">{currentProperty.wifiNetwork || 'Moyer-Fiber-5G'}</span>
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">Pass: {currentProperty.wifiPassword || 'MoyerGuest2026'}</p>
            </div>
            <div className="bg-zinc-800/50 p-2.5 rounded-sm border border-zinc-700/50">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Front Door Keypad</p>
              <p className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                <Key className="w-3 h-3 text-amber-400" />
                {currentProperty.keypadMasterCode || '5829'}
              </p>
              <p className="text-[11px] text-zinc-400">24/7 Access Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => {
            setActivePortalTab('submit');
            setSubmissionSuccessTicket(null);
          }}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activePortalTab === 'submit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Request</span>
        </button>

        <button
          onClick={() => setActivePortalTab('track')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activePortalTab === 'track'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Track Requests ({tenantTickets.length})</span>
        </button>

        <button
          onClick={() => setActivePortalTab('house-guide')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activePortalTab === 'house-guide'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>House Rules & Emergency Hotline</span>
        </button>
      </div>

      {/* SUCCESS BANNER WHEN SUBMITTED */}
      {submissionSuccessTicket && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-sm p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                Maintenance Request Submitted Successfully!
              </p>
              <p className="text-xs text-emerald-800">
                Your unique ticket number is <strong className="font-mono bg-emerald-200/70 px-1.5 py-0.5 rounded text-emerald-900">{submissionSuccessTicket}</strong>. The Moyer operations team and technician have been dispatched.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePortalTab('track')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-sm shadow-xs transition whitespace-nowrap"
          >
            View Live Tracker →
          </button>
        </div>
      )}

      {/* TAB 1: SUBMIT WORK ORDER FORM */}
      {activePortalTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Submission Form */}
          <div className="lg:col-span-2 bg-white rounded-sm p-6 border border-zinc-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-bold text-zinc-900 text-sm">New Maintenance Work Order Request</h2>
                <p className="text-xs text-zinc-500">Provide details so we can assign the correct certified contractor promptly.</p>
              </div>
              <div className="bg-zinc-100 px-2.5 py-1 rounded-sm border border-zinc-200 text-right">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Assigned Ticket #</span>
                <span className="font-mono font-bold text-xs text-indigo-700">Auto-Generated</span>
              </div>
            </div>

            <form onSubmit={handleSubmitWorkOrder} className="space-y-4 text-xs">
              {/* Category & Location Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Maintenance Category *
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as WorkOrderCategory)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Plumbing">Plumbing (Faucets, Drains, Toilet, Shower)</option>
                    <option value="HVAC / Heating">HVAC / Heating & Baseboard Radiators</option>
                    <option value="Electrical">Electrical (Outlets, Lighting, Breakers)</option>
                    <option value="Appliance">Appliance (Refrigerator, Stove, Dishwasher, Washer/Dryer)</option>
                    <option value="Locks & Access">Locks & Access (Keypad, Deadbolt, Room Key)</option>
                    <option value="Room Fixtures">Room Fixtures (Window, Closet, Blinds, Door)</option>
                    <option value="Common Area">Shared Common Area (Kitchen, Living Room, Porch)</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Deep Cleaning">Deep Cleaning / Shared Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as WorkOrderPriority)}
                    className={`w-full p-2.5 border rounded-sm font-bold ${
                      ticketPriority === 'Emergency'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : ticketPriority === 'High'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <option value="Low">Low — Routine maintenance or non-urgent repair</option>
                    <option value="Medium">Medium — Standard repair needed within 48-72h</option>
                    <option value="High">High — Urgent issue affecting living comfort</option>
                    <option value="Emergency">🚨 EMERGENCY — Active leak, total heat loss, or security issue</option>
                  </select>
                </div>
              </div>

              {/* Location Scope */}
              <div className="bg-zinc-50 p-3.5 rounded-sm border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900">Location of Issue</p>
                  <p className="text-[11px] text-zinc-500">
                    {isCommonArea ? 'Shared House Common Area (Kitchen/Living/Bath)' : `Your Private Room: ${currentRoom?.name || 'Assigned Bedroom'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCommonArea(false)}
                    className={`px-3 py-1.5 rounded-sm font-semibold text-xs transition ${
                      !isCommonArea ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-zinc-300 text-zinc-700'
                    }`}
                  >
                    My Private Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommonArea(true)}
                    className={`px-3 py-1.5 rounded-sm font-semibold text-xs transition ${
                      isCommonArea ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-zinc-300 text-zinc-700'
                    }`}
                  >
                    Shared Common Area
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Brief Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Under-sink pipe dripping slowly into bathroom cabinet"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-sm text-zinc-900 font-medium focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Detailed Description & Observations *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please describe when you first noticed the issue, exact symptoms, noises, and any temporary steps taken (e.g. placed a bucket or towel)..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-sm text-zinc-900 focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Attach Photos of the Issue (Recommended)</span>
                  <span className="text-[11px] text-zinc-500 font-normal">{uploadedPhotos.length} photo(s) attached</span>
                </label>

                {/* Upload Drag/Click Zone */}
                <div className="border-2 border-dashed border-zinc-300 rounded-sm p-4 bg-zinc-50/50 hover:bg-zinc-50 text-center transition">
                  <input
                    type="file"
                    id="tenant-photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="tenant-photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-zinc-600"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-indigo-600 hover:underline">
                      Click to upload photos from device
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      JPG, PNG, or WEBP up to 10MB each
                    </span>
                  </label>
                </div>

                {/* Sample Photo Presets */}
                <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-zinc-500 font-semibold">Or attach sample photo:</span>
                  <button
                    type="button"
                    onClick={() => handleAddSamplePhoto('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80')}
                    className="text-indigo-600 hover:underline bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm"
                  >
                    + Plumbing Leak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSamplePhoto('https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80')}
                    className="text-indigo-600 hover:underline bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm"
                  >
                    + Kitchen Appliance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSamplePhoto('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80')}
                    className="text-indigo-600 hover:underline bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm"
                  >
                    + Electric Fixture
                  </button>
                </div>

                {/* Photo Previews */}
                {uploadedPhotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {uploadedPhotos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-sm overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square">
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 opacity-90 transition"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(url)}
                          className="absolute bottom-1 right-1 bg-zinc-900/80 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Preview full image"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission to Enter & Access Notes */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entryPermission}
                    onChange={(e) => setEntryPermission(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300"
                  />
                  <span className="font-semibold text-zinc-800">
                    Permission to Enter: Authorized technician may enter the room using keypad code if I am away
                  </span>
                </label>

                <div>
                  <label className="block text-zinc-600 text-[11px] mb-1">
                    Special Access Instructions / Pets / Preferred Contact Time
                  </label>
                  <input
                    type="text"
                    value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)}
                    placeholder="e.g. Please call 15 minutes prior; cat will be inside carrier"
                    className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-sm text-zinc-800"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  Submitting automatically notifies Moyer dispatch & logs your ticket.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      <span>Submit Maintenance Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info & Resident Advice */}
          <div className="space-y-4">
            {/* Emergency Info Card */}
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Urgent Maintenance Helpline</span>
              </div>
              <p className="text-rose-900 text-[11px] leading-relaxed">
                For active uncontrolled water leaks, gas odor, or total winter furnace loss, please submit this form and call the 24/7 dispatch line immediately:
              </p>
              <div className="bg-white/80 p-2.5 rounded-sm border border-rose-300 font-mono font-bold text-rose-700 text-center text-sm">
                📞 (303) 555-0199 (Ext 1)
              </div>
            </div>

            {/* Roommate Coliving Respect Guidelines */}
            <div className="bg-white border border-zinc-200 rounded-sm p-4 space-y-2.5 text-xs">
              <h3 className="font-bold text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Coliving Work Order Tips</span>
              </h3>
              <ul className="space-y-2 text-zinc-600 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Clear the area:</strong> Please remove personal toiletries or items around sinks/appliances before the technician arrives.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Shared Areas:</strong> Housemates will be notified automatically via house email when repairs are scheduled.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Month-to-Month Guarantee:</strong> Maintenance repairs are covered at 100% by Moyer Property Management with zero deductible.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACK WORK ORDERS */}
      {activePortalTab === 'track' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition ${
                  statusFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All ({tenantTickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('New')}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition ${
                  statusFilter === 'New' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                New
              </button>
              <button
                onClick={() => setStatusFilter('In Progress')}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition ${
                  statusFilter === 'In Progress' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                In Progress / Scheduled
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`px-3 py-1 rounded-sm text-xs font-bold transition ${
                  statusFilter === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search ticket # or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-sm text-xs font-medium focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Split View: Tickets List & Active Ticket Tracker */}
          {tenantTickets.length === 0 ? (
            <div className="bg-white rounded-sm p-12 border border-zinc-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-700 text-sm">No Maintenance Tickets Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                There are no open or matching repair tickets for this property/room filter.
              </p>
              <button
                onClick={() => setActivePortalTab('submit')}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-sm shadow-xs"
              >
                Submit a Repair Request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Tickets Column */}
              <div className="lg:col-span-5 space-y-3">
                {tenantTickets.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-4 rounded-sm border cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {ticket.ticketNumber}
                          </span>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <WorkOrderStatusBadge status={ticket.status} />
                      </div>

                      <h4 className="font-bold text-zinc-900 text-xs line-clamp-1 mb-1">
                        {ticket.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-100">
                        <span>Reported: {ticket.dateReported}</span>
                        <span>{ticket.roomName || 'Common Area'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Active Ticket Tracker Card */}
              <div className="lg:col-span-7">
                {selectedTicket ? (
                  <div className="bg-white rounded-sm border border-zinc-200 shadow-xs p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {selectedTicket.ticketNumber}
                          </span>
                          <WorkOrderStatusBadge status={selectedTicket.status} />
                          <PriorityBadge priority={selectedTicket.priority} />
                        </div>
                        <h3 className="font-bold text-base text-zinc-900 mt-1">
                          {selectedTicket.title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {selectedTicket.propertyName} • {selectedTicket.roomName || 'Common Area'}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Reported Date</span>
                        <span className="font-bold text-zinc-700">{selectedTicket.dateReported}</span>
                      </div>
                    </div>

                    {/* Visual Timeline Stepper */}
                    <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-200">
                      <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-3">
                        Live Status Tracker
                      </p>
                      <div className="grid grid-cols-4 gap-2 relative">
                        {/* Step 1: New */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedTicket.status ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            1
                          </div>
                          <span className="text-[10px] font-bold text-zinc-700 mt-1">Submitted</span>
                          <span className="text-[9px] text-zinc-400">Ticket Logged</span>
                        </div>

                        {/* Step 2: Under Review / Assigned */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedTicket.status !== 'New' ? 'bg-indigo-700 text-white' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            2
                          </div>
                          <span className="text-[10px] font-bold text-zinc-700 mt-1">Assigned</span>
                          <span className="text-[9px] text-zinc-400">Tech Dispatched</span>
                        </div>

                        {/* Step 3: In Progress / Scheduled */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedTicket.status === 'In Progress' || selectedTicket.status === 'Scheduled' || selectedTicket.status === 'Completed'
                              ? 'bg-amber-600 text-white'
                              : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            3
                          </div>
                          <span className="text-[10px] font-bold text-zinc-700 mt-1">In Progress</span>
                          <span className="text-[9px] text-zinc-400">Service On-Site</span>
                        </div>

                        {/* Step 4: Completed */}
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedTicket.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'
                          }`}>
                            4
                          </div>
                          <span className="text-[10px] font-bold text-zinc-700 mt-1">Completed</span>
                          <span className="text-[9px] text-zinc-400">Resolved & Closed</span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details & Assigned Tech */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-50 p-3 rounded-sm border border-zinc-200 space-y-1.5">
                        <p className="font-bold text-zinc-800">Issue Details</p>
                        <p className="text-zinc-600 text-[11px] leading-relaxed">
                          {selectedTicket.description}
                        </p>
                        {selectedTicket.accessInstructions && (
                          <p className="text-[11px] text-indigo-700 font-medium pt-1 border-t border-zinc-200">
                            🔑 {selectedTicket.accessInstructions}
                          </p>
                        )}
                      </div>

                      <div className="bg-zinc-50 p-3 rounded-sm border border-zinc-200 space-y-1.5">
                        <p className="font-bold text-zinc-800">Assigned Technician</p>
                        {selectedTicket.assignedVendorName ? (
                          <div className="space-y-1 text-[11px]">
                            <p className="font-bold text-indigo-900">{selectedTicket.assignedVendorName}</p>
                            {selectedTicket.assignedVendorPhone && (
                              <p className="text-zinc-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-zinc-400" />
                                <span>{selectedTicket.assignedVendorPhone}</span>
                              </p>
                            )}
                            {selectedTicket.dateScheduled && (
                              <p className="text-cyan-700 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Scheduled: {selectedTicket.dateScheduled}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-zinc-500 text-[11px] italic">
                            Moyer Operations is reviewing this ticket to dispatch the best certified contractor.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Photos Attached Section */}
                    {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          <span>Attached Photos ({selectedTicket.photos.length})</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {selectedTicket.photos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setPreviewPhoto(photoUrl)}
                              className="group relative aspect-square rounded-sm overflow-hidden border border-zinc-200 cursor-pointer bg-zinc-100"
                            >
                              <img
                                src={photoUrl}
                                alt={`Ticket Photo ${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Message Thread */}
                    <div className="space-y-3 pt-3 border-t border-zinc-200">
                      <p className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span>Ticket Notes & Communication</span>
                      </p>

                      {/* Comments List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                        {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                          selectedTicket.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className={`p-2.5 rounded-sm border text-[11px] ${
                                comment.isTenant
                                  ? 'bg-indigo-50 border-indigo-200 text-zinc-900 ml-4'
                                  : 'bg-zinc-100 border-zinc-200 text-zinc-900 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-[10px] text-zinc-600 mb-1">
                                <span>{comment.author} {comment.isTenant ? '(Resident)' : '(Property Ops)'}</span>
                                <span>{comment.timestamp}</span>
                              </div>
                              <p className="leading-relaxed">{comment.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-zinc-400 italic">No additional notes on this ticket yet.</p>
                        )}
                      </div>

                      {/* Add comment box */}
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Type an update, question, or note for property management..."
                          className="flex-1 p-2 bg-zinc-50 border border-zinc-300 rounded-sm text-xs focus:bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm text-xs transition disabled:opacity-40 flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-sm p-8 border border-zinc-200 text-center text-zinc-400 text-xs">
                    Select a ticket to view live details and communication thread.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HOUSE RULES & GUIDE */}
      {activePortalTab === 'house-guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Coliving House Guide & Amenities</span>
            </h3>
            
            <div className="space-y-3">
              <div className="bg-zinc-50 p-3 rounded-sm border border-zinc-200">
                <p className="font-bold text-zinc-800">Quiet Hours</p>
                <p className="text-zinc-600 text-[11px]">10:00 PM – 7:00 AM daily. Please use headphones in private bedrooms and keep kitchen chatter mindful.</p>
              </div>

              <div className="bg-zinc-50 p-3 rounded-sm border border-zinc-200">
                <p className="font-bold text-zinc-800">Trash & Recycling Schedule</p>
                <p className="text-zinc-600 text-[11px]">Bins rolled out Tuesday evenings. Professional house cleaning of shared areas occurs every other Thursday.</p>
              </div>

              <div className="bg-zinc-50 p-3 rounded-sm border border-zinc-200">
                <p className="font-bold text-zinc-800">Month-to-Month Notice Terms</p>
                <p className="text-zinc-600 text-[11px]">All leases operate on a rolling Month-to-Month term. 30 days written notice required prior to move-out.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-sm border border-zinc-200 shadow-xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Property Management Contacts</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-zinc-50 rounded-sm border border-zinc-200">
                <p className="font-bold text-zinc-900">Jake Moyer (Managing Director)</p>
                <p className="text-[11px] text-zinc-600">Operations & Lease Renewals</p>
                <p className="font-mono text-indigo-600 text-[11px]">(303) 555-0100 • jake@moyerpm.com</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-sm border border-zinc-200">
                <p className="font-bold text-zinc-900">Sarah Jenkins (Resident Coordinator)</p>
                <p className="text-[11px] text-zinc-600">Showing schedules & Move-in inspections</p>
                <p className="font-mono text-indigo-600 text-[11px]">(303) 555-0102 • sarah@moyerpm.com</p>
              </div>

              <div className="p-3 bg-rose-50 rounded-sm border border-rose-200">
                <p className="font-bold text-rose-900">24/7 Emergency Dispatch</p>
                <p className="text-[11px] text-rose-700">Immediate dispatch for gas, water flood, or heating failure</p>
                <p className="font-mono font-bold text-rose-800 text-[11px]">(303) 555-0199 (Option 1)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="relative max-w-3xl w-full bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-zinc-700">
            <div className="p-3 bg-zinc-900 flex items-center justify-between text-white border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300">Attached Maintenance Photo</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-hidden">
              <img
                src={previewPhoto}
                alt="Enlarged photo preview"
                className="max-h-[75vh] w-auto object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
