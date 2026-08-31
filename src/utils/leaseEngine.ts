/**
 * Moyer Property Management - Lease Renewals & Expiration Engine
 * 
 * LEASING RULES:
 * 1. All bedrooms are leased Month-to-Month only and renew automatically every month.
 * 2. Minimum notice to terminate / vacate is at least 21 days by either tenant or landlord.
 * 3. Vacate dates ALWAYS align with the last day (end date) of a calendar month.
 *    - 31-day month: Notice given by the 10th (31 - 21 = 10) allows vacating on the 31st of the current month.
 *    - 30-day month: Notice given by the 9th (30 - 21 = 9) allows vacating on the 30th of the current month.
 *    - 28-day Feb: Notice given by the 7th (28 - 21 = 7) allows vacating on Feb 28th.
 *    - 29-day leap Feb: Notice given by the 8th (29 - 21 = 8) allows vacating on Feb 29th.
 *    - If notice is given on any date such that notice + 21 days falls into the next month (or beyond),
 *      the effective vacate date is adjusted to the end date of that next month.
 *      (e.g., Notice Oct 20th + 21 days = Nov 10th -> Effective Vacate Date = November 30th).
 * 
 * 4. 1-Year Anniversary Rent Increases:
 *    - Lease rate increases can only be implemented on the 1-year anniversary of the lease.
 *    - Negotiations start 2 months before the 1-year anniversary.
 *    - Decision deadline is the beginning of the 12th month (1 month before the anniversary date).
 */

export interface VacateCalculationResult {
  noticeDate: string;
  noticeDay: number;
  currentMonthDays: number;
  noticeCutoffDay: number;
  isEligibleForCurrentMonthEnd: boolean;
  min21DaysDate: string;
  effectiveVacateDate: string;
  noticeDaysCount: number;
  explanation: string;
}

export interface AnnualReviewMilestones {
  leaseStartDate: string;
  currentRate: number;
  anniversaryYear: number;
  anniversaryDate: string; // e.g. 2026-10-01 (when new rate becomes active)
  negotiationsStartDate: string; // 2 months before anniversary (e.g. 2026-08-01)
  decisionDeadline: string; // Beginning of 12th month (e.g. 2026-09-01)
  isNegotiationWindowOpen: boolean;
  isDecisionDeadlinePassed: boolean;
  daysUntilNegotiationStarts: number;
  daysUntilDecisionDeadline: number;
  daysUntilAnniversary: number;
}

/**
 * Returns number of days in a specific month for a given year.
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

/**
 * Formats a Date object to YYYY-MM-DD string in local time safely.
 */
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD safely into Date object at midnight local time.
 */
export function parseISODate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

/**
 * Calculates the exact effective vacate date and 21-day rule compliance for any given notice date.
 */
export function calculateVacateDate(noticeDateInput: Date | string): VacateCalculationResult {
  const noticeDate = typeof noticeDateInput === 'string' ? parseISODate(noticeDateInput) : new Date(noticeDateInput);
  
  const noticeYear = noticeDate.getFullYear();
  const noticeMonth = noticeDate.getMonth(); // 0-indexed
  const noticeDay = noticeDate.getDate();

  const currentMonthDays = getDaysInMonth(noticeYear, noticeMonth);
  const noticeCutoffDay = currentMonthDays - 21; // e.g. 31 - 21 = 10, 30 - 21 = 9

  // Minimum 21 days from notice date
  const min21Date = new Date(noticeYear, noticeMonth, noticeDay + 21);
  const min21DaysDateISO = formatDateToISO(min21Date);

  // The effective vacate date must be the end of the month containing min21Date
  const targetYear = min21Date.getFullYear();
  const targetMonth = min21Date.getMonth();
  const targetMonthDays = getDaysInMonth(targetYear, targetMonth);
  const effectiveVacateDateObj = new Date(targetYear, targetMonth, targetMonthDays);
  const effectiveVacateDateISO = formatDateToISO(effectiveVacateDateObj);

  // Total notice days provided
  const diffTime = effectiveVacateDateObj.getTime() - noticeDate.getTime();
  const noticeDaysCount = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isEligibleForCurrentMonthEnd = noticeDay <= noticeCutoffDay;

  let explanation = '';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const curMonthName = monthNames[noticeMonth];
  const targetMonthName = monthNames[targetMonth];

  if (isEligibleForCurrentMonthEnd) {
    explanation = `Notice given on ${curMonthName} ${noticeDay} meets the 21-day requirement for ${curMonthName} (${currentMonthDays} days in month, cutoff was ${curMonthName} ${noticeCutoffDay}). Effective vacate date is ${curMonthName} ${currentMonthDays}. (${noticeDaysCount} days total notice).`;
  } else {
    explanation = `Notice given on ${curMonthName} ${noticeDay} is past the ${curMonthName} ${noticeCutoffDay} cutoff. Adding 21 days reaches ${monthNames[min21Date.getMonth()]} ${min21Date.getDate()}, adjusting the effective vacate date to the end of ${targetMonthName} (${targetMonthName} ${targetMonthDays}). (${noticeDaysCount} days total notice).`;
  }

  return {
    noticeDate: formatDateToISO(noticeDate),
    noticeDay,
    currentMonthDays,
    noticeCutoffDay,
    isEligibleForCurrentMonthEnd,
    min21DaysDate: min21DaysDateISO,
    effectiveVacateDate: effectiveVacateDateISO,
    noticeDaysCount,
    explanation
  };
}

/**
 * Calculates 1-Year Anniversary Milestones for Annual Rate Increases.
 * - Anniversary Date: 1 year from lease start (e.g. Month 13 start)
 * - Negotiations Start: 2 months prior to 1-year anniversary (Month 10)
 * - Decision Deadline: Beginning of 12th month (Month 11 end / Month 12 day 1)
 */
export function calculateAnnualReviewMilestones(
  leaseStartDateStr: string,
  currentRate: number = 895,
  referenceDateInput: Date | string = new Date()
): AnnualReviewMilestones {
  const leaseStartDate = parseISODate(leaseStartDateStr || '2025-10-01');
  const refDate = typeof referenceDateInput === 'string' ? parseISODate(referenceDateInput) : new Date(referenceDateInput);

  // Find which anniversary year we are currently evaluating
  const startYear = leaseStartDate.getFullYear();
  const startMonth = leaseStartDate.getMonth();
  const startDay = leaseStartDate.getDate();

  // Find next anniversary after lease start
  let anniversaryYear = 1;
  let anniversaryDate = new Date(startYear + 1, startMonth, startDay);

  while (refDate.getTime() > anniversaryDate.getTime()) {
    anniversaryYear += 1;
    anniversaryDate = new Date(startYear + anniversaryYear, startMonth, startDay);
  }

  // Negotiations start 2 months before anniversary
  const negotiationsStartDate = new Date(anniversaryDate.getFullYear(), anniversaryDate.getMonth() - 2, 1);

  // Decision deadline is beginning of the 12th month (1 month before anniversary)
  const decisionDeadline = new Date(anniversaryDate.getFullYear(), anniversaryDate.getMonth() - 1, 1);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilAnniversary = Math.ceil((anniversaryDate.getTime() - refDate.getTime()) / msPerDay);
  const daysUntilNegotiationStarts = Math.ceil((negotiationsStartDate.getTime() - refDate.getTime()) / msPerDay);
  const daysUntilDecisionDeadline = Math.ceil((decisionDeadline.getTime() - refDate.getTime()) / msPerDay);

  const isNegotiationWindowOpen = refDate.getTime() >= negotiationsStartDate.getTime();
  const isDecisionDeadlinePassed = refDate.getTime() > decisionDeadline.getTime();

  return {
    leaseStartDate: formatDateToISO(leaseStartDate),
    currentRate,
    anniversaryYear,
    anniversaryDate: formatDateToISO(anniversaryDate),
    negotiationsStartDate: formatDateToISO(negotiationsStartDate),
    decisionDeadline: formatDateToISO(decisionDeadline),
    isNegotiationWindowOpen,
    isDecisionDeadlinePassed,
    daysUntilNegotiationStarts,
    daysUntilDecisionDeadline,
    daysUntilAnniversary
  };
}

/**
 * Returns formatted 1-Year Rate Adjustment Notice letter text.
 */
export function generateAnnualRateAdjustmentNoticeText(params: {
  tenantName: string;
  propertyName: string;
  roomName: string;
  currentRent: number;
  proposedRent: number;
  anniversaryDate: string;
  decisionDeadline: string;
  managerName?: string;
}): string {
  const delta = params.proposedRent - params.currentRent;
  const pct = ((delta / params.currentRent) * 100).toFixed(1);
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `MOYER PROPERTY MANAGEMENT
Coliving & Room Rental Operations
1000 Speer Blvd, Denver, CO 80204 • Operations Hotline: (303) 555-0100

================================================================================
NOTICE OF ANNUAL RENT RATE ADJUSTMENT (1-YEAR LEASE ANNIVERSARY)
================================================================================
Date: ${todayStr}

TENANT & RESIDENCE DETAILS:
Resident: ${params.tenantName}
Property: ${params.propertyName}
Unit / Room: ${params.roomName}
Lease Structure: Month-to-Month Auto-Renewing
Anniversary Rate Increase Effective Date: ${params.anniversaryDate}

Dear ${params.tenantName},

Thank you for being a valued member of our coliving community at ${params.propertyName}. Under our month-to-month coliving lease policy, your tenancy auto-renews continuously, and rent rate adjustments occur exclusively on your 1-Year Lease Anniversary.

In accordance with our 2-month advance annual review schedule, we are pleased to present your upcoming annual renewal terms:

PROPOSED RATE ADJUSTMENT TERMS:
--------------------------------------------------------------------------------
• Current Monthly Rent: $${params.currentRent}.00/mo
• Proposed New Monthly Rent: $${params.proposedRent}.00/mo (+$${delta}.00 / +${pct}%)
• Effective Date of New Rate: ${params.anniversaryDate}
• Lease Agreement Type: Continuous Month-to-Month (Auto-Renewing)
• Utilities & Inclusions: High-speed Wi-Fi, Water/Gas/Trash, House Cleaning
• Decision Deadline: ${params.decisionDeadline} (Beginning of 12th Month)

REQUIRED ACTION & 21-DAY NOTICE POLICY:
--------------------------------------------------------------------------------
1. To accept this rate adjustment and maintain continuous tenancy, please confirm via the resident portal or return a signed copy by ${params.decisionDeadline}.
2. If you decide not to continue your month-to-month tenancy, written notice must be submitted at least 21 days prior to your intended month-end move-out date.

Sincerely,

${params.managerName || 'Jake Moyer'}
Property Operations Manager
Moyer Property Management LLC`;
}

/**
 * Returns formatted 21-Day Notice to Vacate letter text.
 */
export function generate21DayVacateNoticeText(params: {
  tenantName: string;
  propertyName: string;
  roomName: string;
  noticeDate: string;
  effectiveVacateDate: string;
  totalNoticeDays: number;
  givenBy: 'Tenant' | 'Landlord';
  reason?: string;
  managerName?: string;
}): string {
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `MOYER PROPERTY MANAGEMENT
Coliving & Room Rental Operations
1000 Speer Blvd, Denver, CO 80204 • Operations Hotline: (303) 555-0100

================================================================================
FORMAL NOTICE TO VACATE & LEASE TERMINATION (21-DAY NOTICE RULE)
================================================================================
Date: ${todayStr}

TENANT & RESIDENCE DETAILS:
Resident: ${params.tenantName}
Property: ${params.propertyName}
Unit / Room: ${params.roomName}
Lease Type: Month-to-Month Coliving
Notice Initiated By: ${params.givenBy}
Date Notice Received: ${params.noticeDate}

VACATE TIMELINE & END-OF-MONTH ALIGNMENT:
--------------------------------------------------------------------------------
• Minimum Notice Required: 21 Calendar Days
• Total Notice Days Provided: ${params.totalNoticeDays} Days
• Official Effective Move-Out Date: ${params.effectiveVacateDate} (End of Month)

MOVE-OUT INSPECTION & TURNOVER INSTRUCTIONS:
--------------------------------------------------------------------------------
1. Room must be cleared of all personal belongings by 11:59 PM on ${params.effectiveVacateDate}.
2. Keys / access fob returned to on-site lockbox or property manager.
3. Move-out checklist and security deposit reconciliation will be completed within 14 business days.

${params.reason ? `Notes / Reason: ${params.reason}\n` : ''}
Acknowledgment:
Tenant: ___________________________ Date: ____________
Management: _______________________ Date: ____________`;
}
