export type NavigationTab = 
  | 'dashboard' 
  | 'properties' 
  | 'renewals' 
  | 'workorders' 
  | 'leads' 
  | 'contacts'
  | 'tenant-portal'
  | 'assistant';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: 'Coliving House' | 'Multi-Unit Brownstone' | 'Student Victorian' | 'Townhome Suites';
  yearBuilt: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  totalRooms: number;
  occupiedRooms: number;
  monthlyRevenueEstimate: number;
  sharedAmenities: string[];
  houseRules: string[];
  wifiNetwork?: string;
  wifiPassword?: string;
  keypadMasterCode?: string;
  notes?: string;
  imageUrl?: string;
}

export type RoomBathroomType = 'Private Ensuite' | '1 Shared Bathroom' | '2 Shared Bathrooms' | 'Shared Bath' | 'Jack & Jill Shared' | string;
export type RoomStatus = 'Occupied' | 'Available' | 'Under Turnover' | 'Reserved';
export type FloorLevel = 'Main Level' | 'Lower Level' | 'Upper Level' | '1st Floor' | '2nd Floor' | '3rd Floor' | 'Basement' | 'Attic' | string;

export interface TurnoverTask {
  id: string;
  task: string;
  isDone: boolean;
}

export interface Room {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  name: string;
  floor: FloorLevel | number;
  sqft: number;
  bathroomType: RoomBathroomType;
  isFurnished: boolean;
  monthlyRent: number;
  securityDeposit: number;
  utilitiesIncluded: string[];
  status: RoomStatus;
  leaseType?: 'Month-to-Month' | 'Fixed'; // All standard leases are Month-to-Month
  currentTenantId?: string;
  currentTenantFirstName?: string;
  currentTenantLastName?: string;
  currentTenantName?: string;
  currentTenantPhone?: string;
  currentTenantEmail?: string;
  currentLeaseId?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  turnoverChecklist: TurnoverTask[];
  amenities: string[];
  roomFeatures: string[];
  notes?: string;
}

export type LeaseRenewalStatus = 
  | 'Auto-Renewing Month-to-Month'
  | 'Review Pending' 
  | 'Notice Sent' 
  | 'Negotiating Terms' 
  | 'Tenant Accepted' 
  | 'Tenant Declined (Vacating)' 
  | 'Notice to Vacate Given'
  | 'Renewed Signed';

export interface NoticeToVacateRecord {
  noticeDate: string;
  givenBy: 'Tenant' | 'Landlord';
  minNoticeDays: number;
  effectiveVacateDate: string;
  totalNoticeDays: number;
  reason?: string;
  acknowledged: boolean;
}

export interface LeaseRenewal {
  id: string;
  tenantId: string;
  tenantFirstName?: string;
  tenantLastName?: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomName: string;
  currentMonthlyRent: number;
  proposedMonthlyRent: number;
  leaseStartDate: string;
  currentLeaseEndDate: string; // End of current month or anniversary date
  daysUntilExpiration: number; // Days until anniversary / review or effective vacate date
  renewalStatus: LeaseRenewalStatus;
  renewalTermMonths: number;
  proposedTermMonths: number;
  leaseType?: 'Month-to-Month';
  lastContactDate?: string;
  noticeSentDate?: string;
  anniversaryDate?: string; // 1-year anniversary date
  negotiationStartDate?: string; // 2 months before anniversary
  decisionDeadline: string; // Beginning of 12th month
  tenantResponseNotes?: string;
  internalNotes: string;
  noticeToVacate?: NoticeToVacateRecord;
  generatedNoticeLetter?: string;
}

export type WorkOrderPriority = 'Emergency' | 'High' | 'Medium' | 'Low';
export type WorkOrderStatus = 'New' | 'Assigned' | 'In Progress' | 'Awaiting Parts' | 'Scheduled' | 'Completed' | 'Cancelled';
export type WorkOrderCategory = 
  | 'Plumbing' 
  | 'HVAC / Heating' 
  | 'Electrical' 
  | 'Appliance' 
  | 'Locks & Access' 
  | 'Common Area' 
  | 'Room Fixtures' 
  | 'Pest Control' 
  | 'Deep Cleaning';

export interface WorkOrderComment {
  id: string;
  timestamp: string;
  author: string;
  isTenant: boolean;
  message: string;
}

export interface WorkOrderTimelineEvent {
  id: string;
  timestamp: string;
  status: WorkOrderStatus;
  note: string;
  author: string;
}

export interface WorkOrder {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomName?: string; // e.g. "Room 201" or "Shared Kitchen / Common Area"
  isCommonArea: boolean;
  tenantId?: string;
  reportedByFirstName?: string;
  reportedByLastName?: string;
  reportedByName: string;
  reportedByPhone: string;
  reportedByEmail?: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedVendorId?: string;
  assignedVendorName?: string;
  assignedVendorPhone?: string;
  estimatedCost: number;
  actualCost?: number;
  dateReported: string;
  dateScheduled?: string;
  dateCompleted?: string;
  accessInstructions?: string;
  entryPermission?: boolean;
  photos?: string[]; // Image URLs or Base64 uploaded images
  comments?: WorkOrderComment[];
  timeline?: WorkOrderTimelineEvent[];
  internalNotes?: string;
  resolutionSummary?: string;
}

export type LeadStage = 
  | 'New Lead' 
  | 'Contacted' 
  | 'Showing Scheduled' 
  | 'Application Received' 
  | 'Lease Signed' 
  | 'Lost / Archived'
  // Legacy alias support
  | 'New Inquiry' 
  | 'Tour Scheduled' 
  | 'Tour Completed' 
  | 'Application Submitted' 
  | 'Screening & Background' 
  | 'Approved' 
  | 'Lease Sent' 
  | 'Signed / Converted';

export interface LeadActivity {
  id: string;
  date: string;
  type: 'email' | 'call' | 'tour' | 'sms' | 'stage_change' | 'note' | 'showing';
  title: string;
  content: string;
  agent: string;
}

export interface TenantLead {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  stage: LeadStage;
  assignedAgent?: string;
  targetMoveInDate: string;
  maxBudget: number;
  preferredBathroom: 'Private Only' | 'Shared OK' | 'Either';
  furnishingPreference: 'Furnished Only' | 'Unfurnished' | 'Either';
  preferredPropertyIds: string[];
  assignedRoomId?: string;
  source: 'Zillow' | 'Craigslist' | 'Roomies' | 'Facebook' | 'Website Inquiry' | 'Tenant Referral';
  score: number; // 1-100 based on qualification
  occupation: string;
  monthlyIncome: number;
  creditScoreRange: '750+ (Excellent)' | '700-749 (Good)' | '650-699 (Fair)' | 'Below 650' | 'Student / Guarantor';
  lifestyleProfile: {
    cleanliness: 'Very Clean / Daily Tidy' | 'Moderate / Weekly Clean' | 'Casual';
    schedule: 'Standard 9-to-5' | 'Night Shift / Late Owl' | 'WFH Full-time' | 'Student / Variable';
    socialLevel: 'Quiet / Independent' | 'Friendly / Moderate Social' | 'Very Social / Group Dinners';
    pets: 'No Pets' | 'Has Cat' | 'Has Small Dog' | 'Allergies to Pets';
    smoking: 'Non-smoker strictly' | 'Outdoor only';
  };
  notes: string;
  activityHistory: LeadActivity[];
  createdDate: string;
}

export type ContactType = 'Tenant' | 'Lead' | 'Vendor / Contractor' | 'Property Owner' | 'Emergency Contact' | 'Leasing Agent';

export interface Contact {
  id: string;
  type: ContactType;
  firstName?: string;
  lastName?: string;
  name: string;
  company?: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  propertyId?: string;
  propertyName?: string;
  roomId?: string;
  roomName?: string;
  roleOrSpecialty?: string; // e.g. "Master Tenant", "HVAC Tech & Plumber", "Senior Leasing Agent", "Property Investor", "Lead (Inquiry)"
  address?: string;
  status: 'Active' | 'Past' | 'Prospect' | 'Available 24/7' | 'On Leave' | 'Inactive';
  hourlyRate?: number;
  rating?: number;
  commissionRate?: string;
  licenseNumber?: string;
  assignedPropertyIds?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes: string;
  paymentStatus?: 'Current / Paid' | 'Payment Pending' | 'Past Due';
  avatarBg: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'Lease' | 'Maintenance' | 'Lead' | 'Room' | 'System';
  message: string;
  user: string;
  entityId?: string;
}

