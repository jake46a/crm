import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact, ActivityLog } from '../types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1070-yank',
    name: '1070 Yank St',
    address: '1070 Yank St',
    city: 'Golden',
    state: 'CO',
    zip: '80401-4223',
    propertyType: 'Coliving House',
    yearBuilt: 1979,
    ownerName: 'Christine Moyer',
    ownerPhone: '(720) 432-5144',
    ownerEmail: 'Christinemoyer85@gmail.com',
    totalRooms: 7,
    occupiedRooms: 4,
    monthlyRevenueEstimate: 5160,
    squareLocationId: 'LN4WBHANNNZ2Y',
    keypadMasterCode: 'Manual Key',
    wifiNetwork: 'new wifi',
    wifiPassword: 'YankStreetLiving2026',
    notes: 'Flagship 1070yankstreet.com coliving residence located in Golden/Lakewood CO.',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    sharedAmenities: [
      'High-Speed Internet & WIFI',
      'Fully Equipped Resident Kitchen',
      'Family Room w/ Fireplace',
      'Living Room',
      'Dining Room',
      'Kitchenet/Bar with Dining Area',
      'Enclosed heated Porch (Designated Smoking/Vaping area)  On-site Laundry',
      'Large Fenced Backyard',
      'Front Porch',
      'Off & On Street Parking',
      'Garage & Basement Storage'
    ],
    houseRules: [
      'Quiet hours 11:00 PM – 7:00 AM daily',
      'No indoor smoking or vaping anywhere on premises except for designated areas (garage / enclosed porch / front and back yard / front porch)',
      'Overnight guests limited to 2 non-consecutive nights per week without prior management notice',
      'Dishes and cookware washed and put away immediately after dining',
      'in all common/shared areas clean up immediately',
      '21-Day calendar written notice required for month-to-month lease termination'
    ]
  }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1788994917927',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'SBS',
    name: 'Sunny Bedroom Suite',
    floor: 'Main Level',
    sqft: 362,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: true,
    monthlyRent: 990,
    securityDeposit: 0,
    status: 'Occupied',
    leaseStartDate: '2026-09-25',
    leaseEndDate: '2027-09-25',
    currentTenantId: 'tenant-1789089079096',
    currentTenantFirstName: 'Daniel',
    currentTenantLastName: 'Oliveira',
    currentTenantName: 'Daniel Oliveira',
    currentTenantPhone: '(970) 637-6188',
    currentTenantEmail: 'danolive1200@gmail.com',
    amenities: [
      'Private entrance from outside to room',
      'Private entrance from room to Family Room',
      'Private entrance from room to Enclosed Porch',
      'Doggie Door to outside and to Family/Living Room',
      'Access to 2 Shared Bathrooms',
      '3 large windows (East Window',
      'East Window',
      'South Window)',
      'Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-1788995778400',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'MB',
    name: 'Master Bedroom',
    floor: 'Main Level',
    sqft: 169,
    bathroomType: 'Private Ensuite',
    isFurnished: false,
    monthlyRent: 1090,
    securityDeposit: 1090,
    status: 'Available',
    amenities: [
      'Private Ensuite Bath',
      'North Window',
      'French Doors private entrance from room to Enclosed Porch',
      'Ceiling Fan & Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-1789003910725',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'NWB',
    name: 'North-West Bedroom',
    floor: 'Main Level',
    sqft: 120,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: false,
    monthlyRent: 890,
    securityDeposit: 890,
    status: 'Available',
    amenities: [
      'Large Windows (North & West Exposures)',
      'Ceiling Fan',
      'Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-1789004156640',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'WB',
    name: 'West Bedroom',
    floor: 'Main Level',
    sqft: 110,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: false,
    monthlyRent: 790,
    securityDeposit: 790,
    status: 'Available',
    amenities: [
      'Large Window (West Exposure)',
      'Ceiling Fan',
      'Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-1789010716978',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'LNWB',
    name: 'Lower North-West Bedroom',
    floor: 'Lower Level',
    sqft: 175,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: false,
    monthlyRent: 575,
    securityDeposit: 0,
    status: 'Occupied',
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-05-01',
    currentTenantId: 'tenant-1789083511470',
    currentTenantFirstName: 'Jordan',
    currentTenantLastName: 'Bends',
    currentTenantName: 'Jordan Bends',
    currentTenantPhone: '(720) 422-8055',
    currentTenantEmail: 'jordanbends@yahoo.com',
    amenities: [
      'Built-in Cabinets and Workspace Countertop',
      '2 Windows (West & North Windows)',
      'Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-1789010950929',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'NB',
    name: 'North Bedroom',
    floor: 'Lower Level',
    sqft: 169,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: true,
    monthlyRent: 425,
    securityDeposit: 0,
    status: 'Occupied',
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-05-01',
    currentTenantId: 'tenant-1789084866278',
    currentTenantFirstName: 'Carlos',
    currentTenantLastName: 'Adrian Rea',
    currentTenantName: 'Carlos Adrian Rea',
    currentTenantPhone: '(970) 417-3126',
    currentTenantEmail: 'carlosrea@live.com',
    amenities: [
      'Built-in Cabinets and Workspace Countertop',
      'North Window (Soft Lighting)',
      'Laminate Wood Flooring'
    ],
    roomFeatures: [
      'Keyless Entry Door Code',
      'Large Window with Natural Light',
      'Hardwood Flooring',
      'Walk-in Closet'
    ],
    utilitiesIncluded: [
      'High-Speed Fiber Wi-Fi',
      'Water & Sewer',
      'Gas & Electric',
      'Trash & Recycling'
    ],
    turnoverChecklist: [
      { id: 't-1', task: 'Digital keycode reset & test door deadbolt', isDone: false },
      { id: 't-2', task: 'Professional room & ensuite deep clean and sanitize', isDone: false },
      { id: 't-3', task: 'Mattress encasement inspection & wash bedding', isDone: false },
      { id: 't-4', task: 'Paint touch-ups & baseboard dusting', isDone: false },
      { id: 't-5', task: 'Welcome move-in coliving house packet placed', isDone: false }
    ]
  },
  {
    id: 'room-yank-1',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: 'BS',
    name: 'Bedroom suite',
    floor: 'Lower Level',
    sqft: 369,
    bathroomType: '2 Shared Bathrooms',
    isFurnished: false,
    monthlyRent: 400,
    securityDeposit: 0,
    status: 'Occupied',
    leaseType: 'Month-to-Month',
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-05-01',
    currentTenantId: 'tenant-1789083128237',
    currentTenantFirstName: 'William',
    currentTenantLastName: 'Jacobs',
    currentTenantName: 'William Jacobs',
    currentTenantPhone: '(303) 591-9353',
    currentTenantEmail: 'jake46a@gmail.com',
    amenities: [
      'West Window',
      '2 Entrances',
      'Laminate Wood Flooring. Room Divider Curtain'
    ],
    roomFeatures: [
      'Private Full Bathroom',
      'Spacious Bedroom Suite'
    ],
    utilitiesIncluded: [
      'Water',
      'Gas',
      'Electricity',
      'Gigabit WiFi',
      'Trash & Recycling',
      'Bi-Weekly Cleaning'
    ],
    notes: 'Property Manager office and bedroom',
    turnoverChecklist: [
      { id: 't-suite-1', task: 'Sanitize private ensuite bathroom & shower', isDone: true },
      { id: 't-suite-2', task: 'Inspect desk, mattress, and closet surfaces', isDone: true },
      { id: 't-suite-3', task: 'Keypad and smoke alarm check', isDone: true }
    ]
  }
];

export const INITIAL_RENEWALS: LeaseRenewal[] = [
  {
    id: 'ren-1789083128243',
    tenantId: 'tenant-1789083128237',
    tenantFirstName: 'William',
    tenantLastName: 'Jacobs',
    tenantName: 'William Jacobs',
    tenantPhone: '(303) 591-9353',
    tenantEmail: 'jake46a@gmail.com',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-yank-1',
    roomName: 'Bedroom suite',
    currentMonthlyRent: 400,
    proposedMonthlyRent: 416,
    leaseStartDate: '2026-05-01',
    currentLeaseEndDate: '2027-05-01',
    anniversaryDate: '2027-05-01',
    negotiationStartDate: '2027-03-01',
    decisionDeadline: '2027-04-01',
    daysUntilExpiration: 232,
    renewalStatus: 'Auto-Renewing Month-to-Month',
    renewalTermMonths: 12,
    proposedTermMonths: 12,
    leaseType: 'Month-to-Month',
    tenantResponseNotes: '',
    internalNotes: 'Initial lease signed after screening conversion'
  },
  {
    id: 'ren-1789083511477',
    tenantId: 'tenant-1789083511470',
    tenantFirstName: 'Jordan',
    tenantLastName: 'Bends',
    tenantName: 'Jordan Bends',
    tenantPhone: '(720) 422-8055',
    tenantEmail: 'jordanbends@yahoo.com',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1789010716978',
    roomName: 'Lower North-West Bedroom',
    currentMonthlyRent: 575,
    proposedMonthlyRent: 601,
    leaseStartDate: '2026-05-01',
    currentLeaseEndDate: '2027-05-01',
    anniversaryDate: '2027-05-01',
    negotiationStartDate: '2027-03-01',
    decisionDeadline: '2027-04-01',
    daysUntilExpiration: 232,
    renewalStatus: 'Auto-Renewing Month-to-Month',
    renewalTermMonths: 12,
    proposedTermMonths: 12,
    leaseType: 'Month-to-Month',
    tenantResponseNotes: '',
    internalNotes: 'Initial lease signed after screening conversion'
  },
  {
    id: 'ren-1789084866283',
    tenantId: 'tenant-1789084866278',
    tenantFirstName: 'Carlos',
    tenantLastName: 'Adrian Rea',
    tenantName: 'Carlos Adrian Rea',
    tenantPhone: '97041743126',
    tenantEmail: 'carlosrea@live.com',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1789010950929',
    roomName: 'North Bedroom',
    currentMonthlyRent: 425,
    proposedMonthlyRent: 442,
    leaseStartDate: '2026-05-01',
    currentLeaseEndDate: '2027-05-01',
    anniversaryDate: '2027-05-01',
    negotiationStartDate: '2027-03-01',
    decisionDeadline: '2027-04-01',
    daysUntilExpiration: 232,
    renewalStatus: 'Notice to Vacate Given',
    renewalTermMonths: 12,
    proposedTermMonths: 12,
    leaseType: 'Month-to-Month',
    tenantResponseNotes: '',
    internalNotes: 'Initial lease signed after screening conversion'
  },
  {
    id: 'ren-1789089079107',
    tenantId: 'tenant-1789089079096',
    tenantFirstName: 'Daniel',
    tenantLastName: 'Oliveira',
    tenantName: 'Daniel Oliveira',
    tenantPhone: '(970) 637-6188',
    tenantEmail: 'danolive1200@gmail.com',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1788994917927',
    roomName: 'Sunny Bedroom Suite',
    currentMonthlyRent: 990,
    proposedMonthlyRent: 1030,
    leaseStartDate: '2026-09-01',
    currentLeaseEndDate: '2027-09-25',
    anniversaryDate: '2027-09-01',
    negotiationStartDate: '2027-07-01',
    decisionDeadline: '2027-08-01',
    daysUntilExpiration: 355,
    renewalStatus: 'Auto-Renewing Month-to-Month',
    renewalTermMonths: 12,
    proposedTermMonths: 12,
    leaseType: 'Month-to-Month',
    tenantResponseNotes: '',
    internalNotes: 'Initial lease signed after screening conversion'
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

export const INITIAL_LEADS: TenantLead[] = [
  {
    id: 'lead-1789083036185',
    name: 'William Jacobs',
    firstName: 'William',
    lastName: 'Jacobs',
    email: 'jake46a@gmail.com',
    phone: '3035919353',
    maxBudget: 1050,
    targetMoveInDate: '2026-05-01',
    source: 'Tenant Referral',
    occupation: 'Software Engineer',
    stage: 'Signed / Converted',
    preferredPropertyIds: ['prop-1070-yank'],
    preferredBathroom: 'Either',
    furnishingPreference: 'Furnished Only',
    assignedAgent: 'William Jacobs',
    monthlyIncome: 4800,
    creditScoreRange: '700-749 (Good)',
    score: 88,
    createdDate: '2026-09-10',
    notes: '',
    lifestyleProfile: {
      smoking: 'Non-smoker strictly',
      pets: 'No Pets',
      schedule: 'WFH Full-time',
      cleanliness: 'Moderate / Weekly Clean',
      socialLevel: 'Friendly / Moderate Social'
    },
    activityHistory: [
      {
        id: 'act-1789091833539',
        date: '2026-09-11 01:57',
        agent: 'William Jacobs',
        type: 'note',
        title: 'Internal Staff Note',
        content: 'test internal note'
      },
      {
        id: 'act-1789083128241',
        date: '2026-09-10 23:32',
        agent: 'Jake Moyer',
        type: 'stage_change',
        title: 'Converted to Tenant',
        content: 'Assigned to 1070 Yank St (Bedroom suite) at $400/mo from 2026-05-01 to 2027-05-01.'
      }
    ]
  },
  {
    id: 'lead-1789083478082',
    name: 'Jordan Bends',
    firstName: 'Jordan',
    lastName: 'Bends',
    email: 'jordanbends@yahoo.com',
    phone: '7204228055',
    maxBudget: 1050,
    targetMoveInDate: '2026-05-01',
    source: 'Website Inquiry',
    occupation: 'Gig Worker',
    stage: 'Signed / Converted',
    preferredPropertyIds: ['prop-1070-yank'],
    preferredBathroom: 'Either',
    furnishingPreference: 'Furnished Only',
    assignedAgent: 'William Jacobs',
    monthlyIncome: 4800,
    creditScoreRange: '700-749 (Good)',
    score: 88,
    createdDate: '2026-09-10',
    notes: '',
    lifestyleProfile: {
      schedule: 'Night Shift / Late Owl',
      pets: 'No Pets',
      cleanliness: 'Very Clean / Daily Tidy',
      smoking: 'Non-smoker strictly',
      socialLevel: 'Friendly / Moderate Social'
    },
    activityHistory: [
      {
        id: 'act-1789083511474',
        date: '2026-09-10 23:38',
        agent: 'Jake Moyer',
        type: 'stage_change',
        title: 'Converted to Tenant',
        content: 'Assigned to 1070 Yank St (Lower North-West Bedroom) at $575/mo from 2026-05-01 to 2027-05-01.'
      }
    ]
  },
  {
    id: 'lead-1789084777701',
    name: 'Carlos Adrian Rea',
    firstName: 'Carlos Adrian',
    lastName: 'Rea',
    email: 'carlosrea@live.com',
    phone: '97041743126',
    maxBudget: 1050,
    targetMoveInDate: '2026-05-01',
    source: 'Tenant Referral',
    occupation: '711 Clerk',
    stage: 'Signed / Converted',
    preferredPropertyIds: ['prop-1070-yank'],
    preferredBathroom: 'Either',
    furnishingPreference: 'Furnished Only',
    assignedAgent: 'William Jacobs',
    monthlyIncome: 4800,
    creditScoreRange: '700-749 (Good)',
    score: 88,
    createdDate: '2026-09-10',
    notes: '',
    lifestyleProfile: {
      schedule: 'Standard 9-to-5',
      cleanliness: 'Moderate / Weekly Clean',
      socialLevel: 'Quiet / Independent',
      smoking: 'Non-smoker strictly',
      pets: 'No Pets'
    },
    activityHistory: [
      {
        id: 'act-1789084866281',
        date: '2026-09-11 00:01',
        agent: 'Jake Moyer',
        type: 'stage_change',
        title: 'Converted to Tenant',
        content: 'Assigned to 1070 Yank St (North Bedroom) at $425/mo from 2026-05-01 to 2027-05-01.'
      }
    ]
  },
  {
    id: 'lead-1789089057526',
    name: 'Daniel Oliveira',
    firstName: 'Daniel',
    lastName: 'Oliveira',
    email: 'danolive1200@gmail.com',
    phone: '(970) 637-6188',
    maxBudget: 1050,
    targetMoveInDate: '2026-09-25',
    source: 'Tenant Referral',
    occupation: 'Software Engineer',
    stage: 'Signed / Converted',
    preferredPropertyIds: ['prop-1070-yank'],
    preferredBathroom: 'Private Only',
    furnishingPreference: 'Furnished Only',
    assignedAgent: 'William Jacobs',
    monthlyIncome: 4800,
    creditScoreRange: '700-749 (Good)',
    score: 88,
    createdDate: '2026-09-11',
    notes: '',
    lifestyleProfile: {
      pets: 'No Pets',
      smoking: 'Non-smoker strictly',
      schedule: 'WFH Full-time',
      cleanliness: 'Moderate / Weekly Clean',
      socialLevel: 'Friendly / Moderate Social'
    },
    activityHistory: [
      {
        id: 'act-1789089079102',
        date: '2026-09-11 01:11',
        agent: 'Jake Moyer',
        type: 'stage_change',
        title: 'Converted to Tenant',
        content: 'Assigned to 1070 Yank St (Sunny Bedroom Suite) at $990/mo from 2026-09-25 to 2027-09-25.'
      }
    ]
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'con-1789082300092',
    name: 'Christine Moyer',
    firstName: 'Christine',
    lastName: 'Moyer',
    company: 'Moyer Property Management LLLP',
    email: 'christinemoyer85@gmail.com',
    phone: '(720) 432-5144',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    type: 'Property Owner',
    status: 'Active',
    avatarBg: 'bg-purple-600',
    notes: ''
  },
  {
    id: 'con-1789082530612',
    name: 'William Jacobs',
    firstName: 'William',
    lastName: 'Jacobs',
    roleOrSpecialty: 'Senior Leasing Agent',
    email: 'info@1070yankstreet.com',
    phone: '(720) 432-5144',
    type: 'Leasing Agent',
    status: 'Active',
    avatarBg: 'bg-indigo-600',
    notes: ''
  },
  {
    id: 'con-1789083128242',
    name: 'William Jacobs',
    firstName: 'William',
    lastName: 'Jacobs',
    email: 'jake46a@gmail.com',
    phone: '(303) 591-9353',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-yank-1',
    roomName: 'Bedroom suite',
    squareCustomerId: 'AEEXRRD9SS16NA34D53FMTWFDM',
    type: 'Tenant',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    notes: 'Converted from lead pipeline. Occupation: Software Engineer'
  },
  {
    id: 'con-1789083511475',
    name: 'Jordan Bends',
    firstName: 'Jordan',
    lastName: 'Bends',
    email: 'jordanbends@yahoo.com',
    phone: '(720) 422-8055',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1789010716978',
    roomName: 'Lower North-West Bedroom',
    squareCustomerId: 'BS5346WC6GYXYR7KP7V5QKV2ZG',
    type: 'Tenant',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    notes: 'Converted from lead pipeline. Occupation: Gig Worker'
  },
  {
    id: 'con-1789084866282',
    name: 'Carlos Adrian Rea',
    firstName: 'Carlos',
    lastName: 'Adrian Rea',
    email: 'carlosrea@live.com',
    phone: '(970) 417-3126',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1789010950929',
    roomName: 'North Bedroom',
    squareCustomerId: 'AKJ2CWZ97H76E6XG95WP3J35G8',
    type: 'Tenant',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    notes: 'Converted from lead pipeline. Occupation: 711 Clerk'
  },
  {
    id: 'con-1789089079104',
    name: 'Daniel Oliveira',
    firstName: 'Daniel',
    lastName: 'Oliveira',
    email: 'danolive1200@gmail.com',
    phone: '(970) 637-6188',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomId: 'room-1788994917927',
    roomName: 'Sunny Bedroom Suite',
    squareCustomerId: 'J494CHPV997GFE2070BZ665NJC',
    type: 'Tenant',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    notes: 'Converted from lead pipeline. Occupation: Software Engineer'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-clean-slate-init',
    timestamp: '2026-09-09T17:59:42.512Z',
    user: 'Jake Moyer',
    category: 'System',
    message: 'Clean slate active for 1070 Yank St coliving. All 7 rooms available, zero demo records.'
  }
];

export const DEMO_DATASET = {
  properties: INITIAL_PROPERTIES,
  rooms: INITIAL_ROOMS,
  renewals: INITIAL_RENEWALS,
  workOrders: INITIAL_WORK_ORDERS,
  leads: INITIAL_LEADS,
  contacts: INITIAL_CONTACTS,
  activityLogs: INITIAL_ACTIVITY_LOGS
};
