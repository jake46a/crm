import { Room, Property, WorkOrder, TurnoverTask, Contact } from '../types';

export const DEFAULT_TURNOVER_TASKS: string[] = [
  'Deep clean room surfaces, desk, wardrobe, and wipe down walls',
  'Sanitize bathroom fixtures, sink, and shower (if private ensuite)',
  'Steam clean carpet / sanitize and mop hard-surface flooring',
  'Inspect mattress, bed frame, and furniture integrity',
  'Reset & reprogram smart door lock / keypad entry code',
  'Test electrical outlets, lighting fixtures, and HVAC vents',
  'Patch & touch-up paint wall scuffs and drywall blemishes',
  'Verify window locks, blinds, and install fresh welcome pack'
];

/**
 * Ensures a room has a complete turnover checklist.
 * Resets task completion for a new turnover cycle.
 */
export function ensureRoomTurnoverChecklist(room: Room): TurnoverTask[] {
  if (room.turnoverChecklist && room.turnoverChecklist.length > 0) {
    // Reset isDone to false for fresh turnover cycle
    return room.turnoverChecklist.map(task => ({
      ...task,
      isDone: false
    }));
  }

  // Generate default tasks tailored for room
  const tasks: string[] = [...DEFAULT_TURNOVER_TASKS];
  if (room.bathroomType && room.bathroomType.includes('Private')) {
    tasks.splice(1, 1, 'Deep sanitize & descale private ensuite shower, toilet, sink & mirror');
  } else {
    tasks.splice(1, 1, 'Inspect room fixtures and check shared bath lock/access');
  }

  return tasks.map((taskStr, idx) => ({
    id: `turnover-task-${room.id}-${idx + 1}-${Date.now()}`,
    task: taskStr,
    isDone: false
  }));
}

/**
 * Creates an automated Turnover Work Order for a room moving into turnover status.
 */
export function generateTurnoverWorkOrder(
  room: Room,
  property?: Property,
  customTasks?: TurnoverTask[]
): WorkOrder {
  const effectiveTasks = customTasks || ensureRoomTurnoverChecklist(room);
  const propName = property?.name || room.propertyName || 'Coliving Property';
  const todayStr = new Date().toISOString().split('T')[0];
  const ticketNumber = `WO-${Math.floor(2000 + Math.random() * 7900)}`;

  // Formatted checklist in description for vendor and manager reading
  const checklistDescription = effectiveTasks
    .map((t, idx) => `${idx + 1}. [ ] ${t.task}`)
    .join('\n');

  const fullDescription = 
`AUTOMATED ROOM TURNOVER & MAKE-READY WORK ORDER

Property: ${propName}
Room: ${room.name} (${room.roomNumber ? `Room #${room.roomNumber}` : 'Room'})
Bathroom Type: ${room.bathroomType || 'Standard'}
Status: Ready for Vendor Dispatch & Turnover Prep

--- TURNOVER ITEMS NEEDED TO BE DONE ---
${checklistDescription}

Access: ${property?.keypadMasterCode ? `Keypad Master Code: ${property.keypadMasterCode}` : 'Coordinate access with property manager'}
Target: Complete within 48-72 hours for next resident move-in.`;

  return {
    id: `wo-turnover-${room.id}-${Date.now()}`,
    ticketNumber,
    title: `Turnover & Make-Ready: ${room.name}`,
    description: fullDescription,
    propertyId: room.propertyId,
    propertyName: propName,
    roomId: room.id,
    roomName: room.name,
    isCommonArea: false,
    reportedByName: 'Turnover Automation System',
    reportedByPhone: '(303) 555-0100',
    category: 'Turnover & Prep',
    priority: 'High',
    status: 'New',
    estimatedCost: 195,
    dateReported: todayStr,
    accessInstructions: property?.keypadMasterCode 
      ? `Property Master Keypad: ${property.keypadMasterCode}. Reset room door lock upon completion.` 
      : 'Contact property manager for key or digital code.',
    entryPermission: true,
    turnoverTasks: effectiveTasks,
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'New',
        note: `Automated turnover work order generated for ${room.name} with ${effectiveTasks.length} make-ready tasks.`,
        author: 'System Turnover Engine'
      }
    ],
    comments: [
      {
        id: `c-${Date.now()}-1`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        author: 'Turnover Automation',
        isTenant: false,
        message: `Room ${room.name} moved into Under Turnover status. Work order ${ticketNumber} created with ${effectiveTasks.length} checklist items. Ready to assign to a vendor.`
      }
    ]
  };
}

/**
 * Helper to assign a vendor to any work order, automatically transitioning status to 'Assigned'
 * and recording timeline & dispatch notes.
 */
export function assignVendorToWorkOrder(
  workOrder: WorkOrder,
  vendor: Contact,
  scheduledDate?: string,
  dispatchNotes?: string
): WorkOrder {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const vendorDisplay = vendor.company 
    ? `${vendor.name} (${vendor.company})` 
    : vendor.name;

  const timelineNote = scheduledDate 
    ? `Assigned to vendor ${vendorDisplay}. Work scheduled for ${scheduledDate}.`
    : `Assigned to vendor ${vendorDisplay} for dispatch.`;

  const updatedTimeline = [
    ...(workOrder.timeline || []),
    {
      id: `tl-${Date.now()}`,
      timestamp,
      status: 'Assigned' as const,
      note: timelineNote,
      author: 'Property Manager'
    }
  ];

  const updatedComments = [
    ...(workOrder.comments || [])
  ];

  if (dispatchNotes && dispatchNotes.trim()) {
    updatedComments.push({
      id: `c-${Date.now()}`,
      timestamp,
      author: 'Dispatch Note',
      isTenant: false,
      message: `Assigned to ${vendorDisplay}: ${dispatchNotes.trim()}`
    });
  }

  return {
    ...workOrder,
    assignedVendorId: vendor.id,
    assignedVendorName: vendorDisplay,
    assignedVendorPhone: vendor.phone,
    status: 'Assigned',
    dateScheduled: scheduledDate || workOrder.dateScheduled || new Date().toISOString().split('T')[0],
    timeline: updatedTimeline,
    comments: updatedComments
  };
}
