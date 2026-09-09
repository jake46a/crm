import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact, ActivityLog } from '../types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1070-yank',
    name: '1070 Yank St',
    address: '1070 Yank St',
    city: 'Golden',
    state: 'CO',
    zip: '80215',
    propertyType: 'Coliving House',
    yearBuilt: 1968,
    ownerName: 'Jake Moyer',
    ownerPhone: '(303) 555-0199',
    ownerEmail: 'jake@1070yankstreet.com',
    totalRooms: 7,
    occupiedRooms: 0,
    monthlyRevenueEstimate: 0,
    squareLocationId: 'LN4WBHANNNZ2Y',
    sharedAmenities: [
      'High-Speed Mesh Gigabit WiFi',
      'Fully Equipped Resident Chef Kitchen',
      'In-Unit Commercial Washer & Dryer',
      'Bi-Weekly Common Area Deep Cleaning',
      'Large Fenced Backyard, Patio & BBQ',
      'Off-Street Resident Parking & Bike Storage'
    ],
    houseRules: [
      'Quiet hours 10:00 PM – 7:00 AM daily',
      'No indoor smoking or vaping anywhere on premises',
      'Overnight guests limited to 3 consecutive nights without prior management notice',
      'Dishes and cookware washed and put away immediately after dining',
      '21-Day calendar written notice required for month-end lease termination'
    ],
    wifiNetwork: '1070Yank_HighSpeed',
    wifiPassword: 'YankStreetLiving2026',
    keypadMasterCode: '1070#',
    notes: 'Flagship 1070yankstreet.com coliving residence located in Golden/Lakewood CO.',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
  }
];

export const INITIAL_ROOMS: Room[] = [
  // 1070 Yank St (7 Rooms, clean slate, all Available)
  {
    id: 'room-yank-1',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '1',
    name: 'Bedroom suite',
    floor: 'Main Level',
    sqft: 260,
    bathroomType: 'Private Ensuite',
    isFurnished: true,
    monthlyRent: 950,
    securityDeposit: 950,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Private Ensuite Bath', 'King Bed', 'Executive Desk', 'Walk-in Closet'],
    roomFeatures: ['Private Full Bathroom', 'Spacious Bedroom Suite'],
    notes: 'Bedroom suite with private ensuite bathroom at 1070 Yank St.',
    turnoverChecklist: [
      { id: 't-suite-1', task: 'Sanitize private ensuite bathroom & shower', isDone: true },
      { id: 't-suite-2', task: 'Inspect desk, mattress, and closet surfaces', isDone: true },
      { id: 't-suite-3', task: 'Keypad and smoke alarm check', isDone: true }
    ]
  },
  {
    id: 'room-yank-2',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '2',
    name: 'Room 2',
    floor: 'Main Level',
    sqft: 195,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Full Memory Foam Bed', 'Study Desk', 'Ample Natural Light'],
    roomFeatures: ['Overlooks Back Garden'],
    notes: 'Room 2 on main level.',
    turnoverChecklist: [
      { id: 't-yank-2-1', task: 'Window sanitization and screen check', isDone: true },
      { id: 't-yank-2-2', task: 'Desk and furniture inspection', isDone: true }
    ]
  },
  {
    id: 'room-yank-3',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '3',
    name: 'Room 3',
    floor: 'Main Level',
    sqft: 200,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Queen Bed', 'Dual Monitors Desk', 'Walk-in Closet'],
    roomFeatures: ['Morning Sunlight Exposure'],
    notes: 'Room 3 on main level.',
    turnoverChecklist: [
      { id: 't-yank-3-1', task: 'Sanitize desk, mattress, and closet surfaces', isDone: true },
      { id: 't-yank-3-2', task: 'Test electrical outlets and lighting fixtures', isDone: true }
    ]
  },
  {
    id: 'room-yank-4',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '4',
    name: 'Room 4',
    floor: 'Lower Level',
    sqft: 190,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Comfortable Bed', 'Study Area', 'Closet Storage'],
    roomFeatures: ['Cool Summer Temperature', 'Quiet Lower Level'],
    notes: 'Room 4 on lower level.',
    turnoverChecklist: [
      { id: 't-yank-4-1', task: 'Baseboard and heating element check', isDone: true },
      { id: 't-yank-4-2', task: 'Carpet steam cleaning', isDone: true }
    ]
  },
  {
    id: 'room-yank-5',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '5',
    name: 'Room 5',
    floor: 'Lower Level',
    sqft: 205,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Full Bed', 'Oak Desk', 'Egress Window'],
    roomFeatures: ['Extra Closet Space'],
    notes: 'Available room at 1070 Yank St.',
    turnoverChecklist: [
      { id: 't-yank-5-1', task: 'Egress window latch inspection', isDone: true },
      { id: 't-yank-5-2', task: 'Deep clean bedding and work desk', isDone: true }
    ]
  },
  {
    id: 'room-yank-6',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '6',
    name: 'Room 6',
    floor: 'Lower Level',
    sqft: 215,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Queen Bed', 'Standing Desk', 'Smart TV Mount'],
    roomFeatures: ['Dual Lower Level Windows'],
    notes: 'Available room at 1070 Yank St.',
    turnoverChecklist: [
      { id: 't-yank-6-1', task: 'Wall and TV mount stability check', isDone: true },
      { id: 't-yank-6-2', task: 'Sanitize desk and nightstand', isDone: true }
    ]
  },
  {
    id: 'room-yank-7',
    propertyId: 'prop-1070-yank',
    propertyName: '1070 Yank St',
    roomNumber: '7',
    name: 'Room 7',
    floor: 'Main Level',
    sqft: 220,
    bathroomType: 'Shared Bath',
    isFurnished: true,
    monthlyRent: 850,
    securityDeposit: 850,
    utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
    status: 'Available',
    leaseType: 'Month-to-Month',
    amenities: ['Full Bed', 'Closet Storage', 'Work Desk'],
    roomFeatures: ['Quiet Location', 'Garden View'],
    notes: 'Available room at 1070 Yank St.',
    turnoverChecklist: [
      { id: 't-yank-7-1', task: 'Sanitize surfaces and vacuum', isDone: true },
      { id: 't-yank-7-2', task: 'Check door lock & keys', isDone: true }
    ]
  }
];

export const INITIAL_RENEWALS: LeaseRenewal[] = [];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

export const INITIAL_LEADS: TenantLead[] = [];

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-clean-slate-init',
    timestamp: new Date().toISOString(),
    user: 'Jake Moyer',
    category: 'System',
    message: 'Clean slate active for 1070 Yank St coliving. All 7 rooms available, zero demo records.'
  }
];

// Preserved Demo Dataset (can be restored at any time via Backup Manager)
export const DEMO_DATASET = {
  properties: [
    {
      id: 'prop-1070-yank',
      name: '1070 Yank St',
      address: '1070 Yank St',
      city: 'Golden',
      state: 'CO',
      zip: '80215',
      propertyType: 'Coliving House',
      yearBuilt: 1968,
      ownerName: 'Jake Moyer',
      ownerPhone: '(303) 555-0199',
      ownerEmail: 'jake@1070yankstreet.com',
      totalRooms: 7,
      occupiedRooms: 4,
      monthlyRevenueEstimate: 3500,
      squareLocationId: 'LN4WBHANNNZ2Y',
      sharedAmenities: [
        'High-Speed Mesh Gigabit WiFi',
        'Fully Equipped Resident Chef Kitchen',
        'In-Unit Commercial Washer & Dryer',
        'Bi-Weekly Common Area Deep Cleaning',
        'Large Fenced Backyard, Patio & BBQ',
        'Off-Street Resident Parking & Bike Storage'
      ],
      houseRules: [
        'Quiet hours 10:00 PM – 7:00 AM daily',
        'No indoor smoking or vaping anywhere on premises',
        'Overnight guests limited to 3 consecutive nights without prior management notice',
        'Dishes and cookware washed and put away immediately after dining',
        '21-Day calendar written notice required for month-end lease termination'
      ],
      wifiNetwork: '1070Yank_HighSpeed',
      wifiPassword: 'YankStreetLiving2026',
      keypadMasterCode: '1070#',
      notes: 'Flagship 1070yankstreet.com coliving residence located in Golden/Lakewood CO.',
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
    }
  ] as Property[],
  rooms: [
    {
      id: 'room-yank-1',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '1',
      name: 'Bedroom suite',
      floor: 'Main Level',
      sqft: 260,
      bathroomType: 'Private Ensuite',
      isFurnished: true,
      monthlyRent: 950,
      securityDeposit: 950,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Occupied',
      leaseType: 'Month-to-Month',
      currentTenantId: 'tenant-william-jacobs',
      currentTenantFirstName: 'William',
      currentTenantLastName: 'Jacobs',
      currentTenantName: 'William Jacobs',
      currentTenantPhone: '(303) 555-0100',
      currentTenantEmail: 'jake@proweb.agency',
      squareCustomerId: '5H7TD7HACMVSVZQFSJ557GW5XW',
      leaseStartDate: '2025-01-01',
      leaseEndDate: '2026-12-31',
      amenities: ['Private Ensuite Bath', 'King Bed', 'Executive Desk', 'Walk-in Closet'],
      roomFeatures: ['Private Full Bathroom', 'Spacious Bedroom Suite'],
      notes: 'Resident in Bedroom suite. Active tenant on file.',
      turnoverChecklist: [
        { id: 't-suite-1', task: 'Sanitize private ensuite bathroom & shower', isDone: true },
        { id: 't-suite-2', task: 'Inspect desk, mattress, and closet surfaces', isDone: true },
        { id: 't-suite-3', task: 'Keypad and smoke alarm check', isDone: true }
      ]
    },
    {
      id: 'room-yank-2',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '2',
      name: 'Room 2',
      floor: 'Main Level',
      sqft: 195,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Occupied',
      leaseType: 'Month-to-Month',
      currentTenantId: 'tenant-carlos-rea',
      currentTenantFirstName: 'Carlos Adrian',
      currentTenantLastName: 'Rea',
      currentTenantName: 'Carlos Adrian Rea',
      currentTenantPhone: '(720) 555-0144',
      currentTenantEmail: 'carlosrea@live.com',
      squareCustomerId: 'AKJ2CWZ97H76E6XG95WP3J35G8',
      leaseStartDate: '2025-09-01',
      leaseEndDate: '2026-09-01',
      amenities: ['Full Memory Foam Bed', 'Study Desk', 'Ample Natural Light'],
      roomFeatures: ['Overlooks Back Garden'],
      notes: 'Resident in Room 2. Prompt payer via Square.',
      turnoverChecklist: [
        { id: 't-yank-2-1', task: 'Window sanitization and screen check', isDone: true },
        { id: 't-yank-2-2', task: 'Desk and furniture inspection', isDone: true }
      ]
    },
    {
      id: 'room-yank-3',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '3',
      name: 'Room 3',
      floor: 'Main Level',
      sqft: 200,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Occupied',
      leaseType: 'Month-to-Month',
      currentTenantId: 'tenant-jordan-bends',
      currentTenantFirstName: 'Jordan',
      currentTenantLastName: 'Bends',
      currentTenantName: 'Jordan Bends',
      currentTenantPhone: '(303) 555-0178',
      currentTenantEmail: 'jordanbends@yahoo.com',
      squareCustomerId: 'BS5346WC6GYXYR7KP7V5QKV2ZG',
      leaseStartDate: '2025-06-01',
      leaseEndDate: '2026-06-01',
      amenities: ['Queen Bed', 'Dual Monitors Desk', 'Walk-in Closet'],
      roomFeatures: ['Morning Sunlight Exposure'],
      notes: 'Resident in Room 3.',
      turnoverChecklist: [
        { id: 't-yank-3-1', task: 'Sanitize desk, mattress, and closet surfaces', isDone: true },
        { id: 't-yank-3-2', task: 'Test electrical outlets and lighting fixtures', isDone: true }
      ]
    },
    {
      id: 'room-yank-4',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '4',
      name: 'Room 4',
      floor: 'Lower Level',
      sqft: 190,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Occupied',
      leaseType: 'Month-to-Month',
      currentTenantId: 'tenant-daniel-oliveira',
      currentTenantFirstName: 'Daniel',
      currentTenantLastName: 'Oliveira',
      currentTenantName: 'Daniel Oliveira',
      currentTenantPhone: '(720) 555-0193',
      currentTenantEmail: 'bacaliam28@gmail.com',
      squareCustomerId: 'NVKKA892W8959GTGYWKJ3F2NZ8',
      leaseStartDate: '2025-12-01',
      leaseEndDate: '2026-12-01',
      amenities: ['Comfortable Bed', 'Study Area', 'Closet Storage'],
      roomFeatures: ['Cool Summer Temperature', 'Quiet Lower Level'],
      notes: 'Resident in Room 4.',
      turnoverChecklist: [
        { id: 't-yank-4-1', task: 'Baseboard and heating element check', isDone: true },
        { id: 't-yank-4-2', task: 'Carpet steam cleaning', isDone: true }
      ]
    },
    {
      id: 'room-yank-5',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '5',
      name: 'Room 5',
      floor: 'Lower Level',
      sqft: 205,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Available',
      leaseType: 'Month-to-Month',
      amenities: ['Full Bed', 'Oak Desk', 'Egress Window'],
      roomFeatures: ['Extra Closet Space'],
      notes: 'Available room at 1070 Yank St.',
      turnoverChecklist: [
        { id: 't-yank-5-1', task: 'Egress window latch inspection', isDone: true },
        { id: 't-yank-5-2', task: 'Deep clean bedding and work desk', isDone: true }
      ]
    },
    {
      id: 'room-yank-6',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '6',
      name: 'Room 6',
      floor: 'Lower Level',
      sqft: 215,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Available',
      leaseType: 'Month-to-Month',
      amenities: ['Queen Bed', 'Standing Desk', 'Smart TV Mount'],
      roomFeatures: ['Dual Lower Level Windows'],
      notes: 'Available room at 1070 Yank St.',
      turnoverChecklist: [
        { id: 't-yank-6-1', task: 'Wall and TV mount stability check', isDone: true },
        { id: 't-yank-6-2', task: 'Sanitize desk and nightstand', isDone: true }
      ]
    },
    {
      id: 'room-yank-7',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomNumber: '7',
      name: 'Room 7',
      floor: 'Main Level',
      sqft: 220,
      bathroomType: 'Shared Bath',
      isFurnished: true,
      monthlyRent: 850,
      securityDeposit: 850,
      utilitiesIncluded: ['Water', 'Gas', 'Electricity', 'Gigabit WiFi', 'Trash & Recycling', 'Bi-Weekly Cleaning'],
      status: 'Available',
      leaseType: 'Month-to-Month',
      amenities: ['Full Bed', 'Closet Storage', 'Work Desk'],
      roomFeatures: ['Quiet Location', 'Garden View'],
      notes: 'Available room at 1070 Yank St.',
      turnoverChecklist: [
        { id: 't-yank-7-1', task: 'Sanitize surfaces and vacuum', isDone: true },
        { id: 't-yank-7-2', task: 'Check door lock & keys', isDone: true }
      ]
    }
  ] as Room[],
  renewals: [
    {
      id: 'ren-william-jacobs-1',
      tenantId: 'tenant-william-jacobs',
      tenantFirstName: 'William',
      tenantLastName: 'Jacobs',
      tenantName: 'William Jacobs',
      tenantEmail: 'jake@proweb.agency',
      tenantPhone: '(303) 555-0100',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomId: 'room-yank-1',
      roomName: 'Bedroom suite',
      currentMonthlyRent: 950,
      proposedMonthlyRent: 950,
      leaseStartDate: '2025-01-01',
      currentLeaseEndDate: '2026-12-31',
      anniversaryDate: '2026-12-31',
      negotiationStartDate: '2026-10-01',
      decisionDeadline: '2026-11-15',
      daysUntilExpiration: 113,
      renewalStatus: 'Review Pending',
      renewalTermMonths: 12,
      proposedTermMonths: 12,
      leaseType: 'Month-to-Month',
      noticeSentDate: '2026-09-01',
      lastContactDate: '2026-09-01',
      tenantResponseNotes: 'Active renewal on file for Bedroom suite.',
      internalNotes: 'Bedroom suite renewal record.'
    }
  ] as LeaseRenewal[],
  workOrders: [] as WorkOrder[],
  leads: [] as TenantLead[],
  contacts: [
    {
      id: 'cont-william-jacobs',
      type: 'Tenant',
      firstName: 'William',
      lastName: 'Jacobs',
      name: 'William Jacobs',
      email: 'jake@proweb.agency',
      phone: '(303) 555-0100',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomId: 'room-yank-1',
      roomName: 'Bedroom suite',
      status: 'Active',
      paymentStatus: 'Current / Paid',
      avatarBg: 'bg-indigo-600',
      notes: 'Resident in Bedroom suite. Active tenant on file.'
    },
    {
      id: 'cont-carlos-rea',
      type: 'Tenant',
      firstName: 'Carlos Adrian',
      lastName: 'Rea',
      name: 'Carlos Adrian Rea',
      email: 'carlosrea@live.com',
      phone: '(720) 555-0144',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomId: 'room-yank-2',
      roomName: 'Room 2',
      status: 'Active',
      paymentStatus: 'Current / Paid',
      avatarBg: 'bg-emerald-600',
      notes: 'Resident in Room 2. Prompt payer via Square.'
    },
    {
      id: 'cont-jordan-bends',
      type: 'Tenant',
      firstName: 'Jordan',
      lastName: 'Bends',
      name: 'Jordan Bends',
      email: 'jordanbends@yahoo.com',
      phone: '(303) 555-0178',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomId: 'room-yank-3',
      roomName: 'Room 3',
      status: 'Active',
      paymentStatus: 'Current / Paid',
      avatarBg: 'bg-blue-600',
      notes: 'Resident in Room 3.'
    },
    {
      id: 'cont-daniel-oliveira',
      type: 'Tenant',
      firstName: 'Daniel',
      lastName: 'Oliveira',
      name: 'Daniel Oliveira',
      email: 'bacaliam28@gmail.com',
      phone: '(720) 555-0193',
      propertyId: 'prop-1070-yank',
      propertyName: '1070 Yank St',
      roomId: 'room-yank-4',
      roomName: 'Room 4',
      status: 'Active',
      paymentStatus: 'Current / Paid',
      avatarBg: 'bg-amber-600',
      notes: 'Resident in Room 4.'
    },
    {
      id: 'cont-4',
      type: 'Vendor / Contractor',
      name: 'Apex Mile High Plumbing',
      company: 'Apex Mile High Mechanical LLC',
      email: 'dispatch@apexmilehighplumbing.com',
      phone: '(303) 555-0199',
      status: 'Active',
      avatarBg: 'bg-cyan-700',
      notes: 'Preferred plumbing & drain vendor for 1070 Yank St.'
    },
    {
      id: 'cont-5',
      type: 'Vendor / Contractor',
      name: 'Highland Sparkle Cleaners',
      company: 'Highland Sparkle Professional Cleaning',
      email: 'service@highlandclean.com',
      phone: '(303) 555-0172',
      status: 'Active',
      avatarBg: 'bg-pink-700',
      notes: 'Bi-weekly common area turnover resets & deep cleaning.'
    }
  ] as Contact[],
  activityLogs: [
    {
      id: 'act-demo-dataset',
      timestamp: new Date().toISOString(),
      user: 'Jake Moyer',
      category: 'System',
      message: '1070 Yank St demo dataset loaded with Bedroom suite and 3 sample room residents.'
    }
  ] as ActivityLog[]
};
