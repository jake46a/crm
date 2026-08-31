import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  Plus, 
  Edit3, 
  Printer, 
  TrendingUp, 
  Filter,
  Check,
  Building,
  User,
  Sparkles,
  Calendar,
  Calculator,
  ChevronRight,
  Info,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Trash2,
  CopyX,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { LeaseRenewal, LeaseRenewalStatus, Room, Property, NoticeToVacateRecord } from '../types';
import { RenewalStatusBadge, MonthToMonthBadge } from './common/Badges';
import { 
  calculateVacateDate, 
  calculateAnnualReviewMilestones, 
  formatDateToISO 
} from '../utils/leaseEngine';
import { formatFullName } from '../utils/nameUtils';
import { QuickSmsModal, QuickSmsRecipient } from './modals/QuickSmsModal';

interface LeaseRenewalsViewProps {
  renewals: LeaseRenewal[];
  rooms: Room[];
  properties: Property[];
  onUpdateRenewal: (renewal: LeaseRenewal) => void;
  onOpenNewRenewalModal: () => void;
  onOpenEditRenewalModal?: (renewal: LeaseRenewal) => void;
  onDeleteRenewal?: (renewalId: string) => void;
  onDeleteDuplicateRenewals?: (idsToDelete: string[]) => void;
  onOpenRenewalLetterModal: (renewal: LeaseRenewal) => void;
  onOpenAssistant: () => void;
  onResetToChangedLogic?: () => void;
}

export const LeaseRenewalsView: React.FC<LeaseRenewalsViewProps> = ({
  renewals,
  rooms,
  properties,
  onUpdateRenewal,
  onOpenNewRenewalModal,
  onOpenEditRenewalModal,
  onDeleteRenewal,
  onDeleteDuplicateRenewals,
  onOpenRenewalLetterModal,
  onOpenAssistant,
  onResetToChangedLogic
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 21-Day Calculator Live Playground State
  const [calculatorDate, setCalculatorDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Deduplication Modal State
  const [showDeduplicateModal, setShowDeduplicateModal] = useState<boolean>(false);

  // Single card delete confirmation state
  const [cardToDelete, setCardToDelete] = useState<LeaseRenewal | null>(null);

  // Quick SMS State
  const [smsTargetRenewal, setSmsTargetRenewal] = useState<LeaseRenewal | null>(null);

  // Notice to Vacate Modal / Drawer State
  const [vacatingRenewalTarget, setVacatingRenewalTarget] = useState<LeaseRenewal | null>(null);
  const [noticeGivenBy, setNoticeGivenBy] = useState<'Tenant' | 'Landlord'>('Tenant');
  const [noticeSubmitDate, setNoticeSubmitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noticeReason, setNoticeReason] = useState<string>('');

  // Run calculation on live calculator date
  const calcResult = calculateVacateDate(calculatorDate);
  const modalCalcResult = calculateVacateDate(noticeSubmitDate);

  // Smart Duplicate Detection Engine
  const duplicateAnalysis = useMemo(() => {
    const groups: Record<string, LeaseRenewal[]> = {};
    
    renewals.forEach(r => {
      // Key on roomId if present, or normalized tenant name + property
      const fullName = formatFullName(r.tenantFirstName, r.tenantLastName, r.tenantName);
      const groupKey = r.roomId 
        ? `room_${r.roomId}` 
        : `tenant_${(r.propertyName || '').trim().toLowerCase()}_${fullName.trim().toLowerCase()}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(r);
    });

    const statusScore = (status: LeaseRenewalStatus) => {
      switch (status) {
        case 'Notice to Vacate Given': return 100;
        case 'Tenant Declined (Vacating)': return 90;
        case 'Renewed Signed': return 85;
        case 'Tenant Accepted': return 80;
        case 'Negotiating Terms': return 70;
        case 'Notice Sent': return 60;
        case 'Review Pending': return 50;
        default: return 10;
      }
    };

    const duplicateGroups = Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([key, list]) => {
        // Sort to identify best primary card to keep
        const sorted = [...list].sort((a, b) => {
          const scoreDiff = statusScore(b.renewalStatus) - statusScore(a.renewalStatus);
          if (scoreDiff !== 0) return scoreDiff;
          if (b.noticeToVacate && !a.noticeToVacate) return 1;
          if (!b.noticeToVacate && a.noticeToVacate) return -1;
          // Prefer higher/more recent ID or latest updated
          return (b.id || '').localeCompare(a.id || '');
        });

        const primaryCard = sorted[0];
        const duplicates = sorted.slice(1);

        return {
          key,
          roomName: primaryCard.roomName || 'Bedroom',
          propertyName: primaryCard.propertyName || 'Property',
          tenantName: formatFullName(primaryCard.tenantFirstName, primaryCard.tenantLastName, primaryCard.tenantName || 'Resident'),
          primaryCard,
          duplicates,
          allCards: list
        };
      });

    const allDuplicateIds = duplicateGroups.flatMap(g => g.duplicates.map(d => d.id));
    const duplicateCount = allDuplicateIds.length;

    return {
      groups: duplicateGroups,
      duplicateCount,
      allDuplicateIds,
      isDuplicate: (id: string) => allDuplicateIds.includes(id)
    };
  }, [renewals]);

  // Enrich renewals with 1-year anniversary & 21-day notice calculations
  const enrichedRenewals = renewals.map(ren => {
    const milestones = calculateAnnualReviewMilestones(
      ren.leaseStartDate || '2025-10-01',
      ren.currentMonthlyRent
    );
    return {
      ...ren,
      milestones,
      isDuplicateCard: duplicateAnalysis.isDuplicate(ren.id)
    };
  });

  // Filter renewals
  const filteredRenewals = enrichedRenewals.filter(ren => {
    if (statusFilter === 'active-month-to-month' && (ren.renewalStatus === 'Notice to Vacate Given' || ren.renewalStatus === 'Tenant Declined (Vacating)')) {
      return false;
    }
    if (statusFilter === 'in-negotiations' && !ren.milestones.isNegotiationWindowOpen) {
      return false;
    }
    if (statusFilter === 'duplicates' && !ren.isDuplicateCard) {
      return false;
    }
    if (statusFilter === 'vacating' && ren.renewalStatus !== 'Notice to Vacate Given' && ren.renewalStatus !== 'Tenant Declined (Vacating)') {
      return false;
    }
    if (
      statusFilter !== 'all' && 
      statusFilter !== 'active-month-to-month' && 
      statusFilter !== 'in-negotiations' && 
      statusFilter !== 'vacating' && 
      statusFilter !== 'duplicates' && 
      ren.renewalStatus !== statusFilter
    ) {
      return false;
    }
    if (propertyFilter !== 'all' && ren.propertyId !== propertyFilter) return false;
    if (timeFilter === '30days' && ren.milestones.daysUntilDecisionDeadline > 30) return false;
    if (timeFilter === '60days' && ren.milestones.daysUntilDecisionDeadline > 60) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tName = formatFullName(ren.tenantFirstName, ren.tenantLastName, ren.tenantName).toLowerCase();
      return (
        tName.includes(q) ||
        (ren.tenantFirstName && ren.tenantFirstName.toLowerCase().includes(q)) ||
        (ren.tenantLastName && ren.tenantLastName.toLowerCase().includes(q)) ||
        ren.propertyName.toLowerCase().includes(q) ||
        ren.roomName.toLowerCase().includes(q) ||
        ren.tenantEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const urgentCount = enrichedRenewals.filter(r => 
    r.milestones.isNegotiationWindowOpen && 
    r.milestones.daysUntilDecisionDeadline <= 30 && 
    r.renewalStatus !== 'Tenant Accepted' && 
    r.renewalStatus !== 'Renewed Signed' && 
    r.renewalStatus !== 'Tenant Declined (Vacating)' && 
    r.renewalStatus !== 'Notice to Vacate Given'
  ).length;

  const inNegotiationCount = enrichedRenewals.filter(r => r.milestones.isNegotiationWindowOpen && r.renewalStatus !== 'Tenant Accepted' && r.renewalStatus !== 'Notice to Vacate Given').length;
  const acceptedCount = enrichedRenewals.filter(r => r.renewalStatus === 'Tenant Accepted' || r.renewalStatus === 'Renewed Signed').length;
  const vacatingCount = enrichedRenewals.filter(r => r.renewalStatus === 'Tenant Declined (Vacating)' || r.renewalStatus === 'Notice to Vacate Given').length;
  
  // Total Rent Delta
  const totalMonthlyGain = enrichedRenewals.reduce((sum, r) => sum + (r.proposedMonthlyRent - r.currentMonthlyRent), 0);
  const annualizedGain = totalMonthlyGain * 12;

  // 1-Click Status Advance
  const handleQuickStatusChange = (renewal: LeaseRenewal, newStatus: LeaseRenewalStatus) => {
    onUpdateRenewal({
      ...renewal,
      renewalStatus: newStatus,
      lastContactDate: new Date().toISOString().split('T')[0]
    });
  };

  // Submit Formal Notice to Vacate
  const handleConfirmNoticeToVacate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacatingRenewalTarget) return;

    const calc = calculateVacateDate(noticeSubmitDate);

    const noticeRecord: NoticeToVacateRecord = {
      noticeDate: calc.noticeDate,
      givenBy: noticeGivenBy,
      minNoticeDays: 21,
      effectiveVacateDate: calc.effectiveVacateDate,
      totalNoticeDays: calc.noticeDaysCount,
      reason: noticeReason,
      acknowledged: true
    };

    const updatedRenewal: LeaseRenewal = {
      ...vacatingRenewalTarget,
      renewalStatus: 'Notice to Vacate Given',
      currentLeaseEndDate: calc.effectiveVacateDate,
      daysUntilExpiration: Math.max(0, Math.ceil((new Date(calc.effectiveVacateDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      noticeToVacate: noticeRecord,
      internalNotes: `${vacatingRenewalTarget.internalNotes ? vacatingRenewalTarget.internalNotes + '\n' : ''}[${new Date().toISOString().split('T')[0]}] Notice to vacate recorded: ${noticeGivenBy} submitted notice on ${calc.noticeDate}. Effective month-end vacate date is ${calc.effectiveVacateDate} (${calc.noticeDaysCount} days notice).`
    };

    onUpdateRenewal(updatedRenewal);
    setVacatingRenewalTarget(null);
    setNoticeReason('');
  };

  // Execute Deduplication
  const handleExecuteDeduplicateAll = () => {
    if (duplicateAnalysis.allDuplicateIds.length === 0) return;
    if (onDeleteDuplicateRenewals) {
      onDeleteDuplicateRenewals(duplicateAnalysis.allDuplicateIds);
    } else if (onDeleteRenewal) {
      duplicateAnalysis.allDuplicateIds.forEach(id => onDeleteRenewal(id));
    }
    setShowDeduplicateModal(false);
  };

  // Delete single card confirm
  const handleConfirmDeleteSingle = () => {
    if (!cardToDelete) return;
    if (onDeleteRenewal) {
      onDeleteRenewal(cardToDelete.id);
    }
    setCardToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h1 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Lease Renewals & Expiration Engine
            </h1>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
              Month-to-Month Auto-Renewal
            </span>
            {urgentCount > 0 && (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
                {urgentCount} Deadline Approaching
              </span>
            )}
            {duplicateAnalysis.duplicateCount > 0 && (
              <button
                onClick={() => setShowDeduplicateModal(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                <span>{duplicateAnalysis.duplicateCount} Duplicate Cards Detected</span>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            All rooms are month-to-month auto-renewing. 21-day notice required to vacate at month end. 1-year anniversary rate increase negotiations begin 2 months prior with decision deadline at month 12.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deduplicate Button */}
          <button
            onClick={() => setShowDeduplicateModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-colors ${
              duplicateAnalysis.duplicateCount > 0 
                ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs' 
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
            title="Scan for and delete duplicate cards across the same rooms"
          >
            <CopyX className={`w-3.5 h-3.5 ${duplicateAnalysis.duplicateCount > 0 ? 'text-amber-600' : 'text-zinc-500'}`} />
            <span>
              {duplicateAnalysis.duplicateCount > 0 
                ? `Clean ${duplicateAnalysis.duplicateCount} Duplicates` 
                : 'Deduplicate Cards'}
            </span>
          </button>

          {onResetToChangedLogic && (
            <button
              onClick={onResetToChangedLogic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold uppercase tracking-wider transition-colors"
              title="Reset test data based on the updated coliving month-to-month and 21-day notice logic"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reset Data</span>
            </button>
          )}

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-colors ${
              showCalculator 
                ? 'bg-zinc-900 text-white border-zinc-900' 
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>21-Day Vacate Calculator</span>
          </button>

          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Notice Drafter</span>
          </button>

          <button
            onClick={onOpenNewRenewalModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Annual Review Record</span>
          </button>
        </div>
      </div>

      {/* Policy Rules Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 text-white rounded-sm p-4 border border-zinc-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Coliving Lease Logic & Notice Protocol</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              • <strong>Continuous Tenancy:</strong> All bedrooms auto-renew every month unless at least <strong>21 days notice</strong> is provided.<br/>
              • <strong>Month-End Vacating:</strong> Notice on or before the <strong>10th</strong> (31-day month) or <strong>9th</strong> (30-day month) vacates at the end of the current month. Later notice rolls into the end of the next month.<br/>
              • <strong>Annual Rate Increases:</strong> Rent adjustments occur on the <strong>1-Year Anniversary</strong>. Negotiations open <strong>2 months prior</strong>, and decisions lock in by the <strong>12th month</strong> start.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs bg-white/10 p-3 rounded-sm border border-white/10">
            <div className="text-center px-2">
              <span className="text-[10px] text-zinc-300 uppercase block font-semibold">31-Day Month</span>
              <strong className="text-sm font-mono text-emerald-400">Notice by 10th</strong>
              <span className="text-[10px] text-zinc-400 block">Vacate 31st</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-zinc-300 uppercase block font-semibold">30-Day Month</span>
              <strong className="text-sm font-mono text-emerald-400">Notice by 9th</strong>
              <span className="text-[10px] text-zinc-400 block">Vacate 30th</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-zinc-300 uppercase block font-semibold">1-Year Rate Rise</span>
              <strong className="text-sm font-mono text-amber-300">2-Mo Window</strong>
              <span className="text-[10px] text-zinc-400 block">Mo 12 Deadline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 21-Day Vacate Date Calculator (Collapsible / Toggleable) */}
      {showCalculator && (
        <div className="bg-zinc-50 rounded-sm p-5 border-2 border-indigo-500 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Interactive 21-Day Notice to Vacate Simulator
              </h2>
            </div>
            <button 
              onClick={() => setShowCalculator(false)}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold"
            >
              ✕ Close Simulator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-tight mb-1">
                Simulate Notice Date Given
              </label>
              <input
                type="date"
                value={calculatorDate}
                onChange={(e) => setCalculatorDate(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-zinc-300 rounded-sm p-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Notice month has <strong>{calcResult.currentMonthDays} days</strong>. Cutoff is the <strong>{calcResult.noticeCutoffDay}th</strong>.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-sm border border-zinc-200 shadow-xs text-xs space-y-1">
              <span className="text-zinc-500 uppercase tracking-tight text-[10px] font-bold block">
                21-Day Minimum Target
              </span>
              <p className="font-mono text-sm font-bold text-zinc-900">{calcResult.min21DaysDate}</p>
              <span className={`inline-block px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-tight ${
                calcResult.isEligibleForCurrentMonthEnd 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {calcResult.isEligibleForCurrentMonthEnd ? 'Eligible for Current Month End' : 'Adjusted to Next Month End'}
              </span>
            </div>

            <div className="bg-indigo-900 text-white p-3.5 rounded-sm shadow-xs text-xs space-y-1">
              <span className="text-indigo-200 uppercase tracking-tight text-[10px] font-bold block">
                Official Effective Vacate Date (Month End)
              </span>
              <p className="font-mono text-base font-bold text-emerald-300">{calcResult.effectiveVacateDate}</p>
              <p className="text-[11px] text-indigo-200">
                Total notice provided: <strong>{calcResult.noticeDaysCount} calendar days</strong>
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-sm border border-zinc-200 text-xs text-zinc-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 font-semibold">Engine Rule Explanation: </strong>
              <span>{calcResult.explanation}</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-zinc-400">Total Month-to-Month Leases</span>
          <p className="text-3xl font-light text-zinc-900 mt-2">{renewals.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Continuous coliving tenancies</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-indigo-600">In 2-Month Review Window</span>
          <p className="text-3xl font-light text-indigo-600 mt-2">{inNegotiationCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Anniversary negotiations active</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-600">Rate Increases Accepted</span>
          <p className="text-3xl font-light text-emerald-600 mt-2">{acceptedCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{vacatingCount} vacating notices on record</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-amber-600">Projected Annual Lift</span>
          <p className="text-3xl font-light text-amber-600 mt-2 font-mono">+${annualizedGain.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">+${totalMonthlyGain}/mo from 1-yr rate reviews</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
            >
              All Leases ({renewals.length})
            </button>
            <button
              onClick={() => setStatusFilter('in-negotiations')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'in-negotiations' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            >
              In 2-Mo Window ({inNegotiationCount})
            </button>
            <button
              onClick={() => setStatusFilter('Review Pending')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Review Pending' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
            >
              Pending ({renewals.filter(r => r.renewalStatus === 'Review Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Notice Sent')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Notice Sent' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
            >
              Notice Sent ({renewals.filter(r => r.renewalStatus === 'Notice Sent').length})
            </button>
            <button
              onClick={() => setStatusFilter('Tenant Accepted')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'Tenant Accepted' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              onClick={() => setStatusFilter('vacating')}
              className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors ${statusFilter === 'vacating' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
            >
              Vacating / 21-Day Notice ({vacatingCount})
            </button>
            {duplicateAnalysis.duplicateCount > 0 && (
              <button
                onClick={() => setStatusFilter('duplicates')}
                className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-tight transition-colors flex items-center gap-1 ${statusFilter === 'duplicates' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'}`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Duplicates ({duplicateAnalysis.duplicateCount})</span>
              </button>
            )}
          </div>

          {/* Time & Search */}
          <div className="flex items-center gap-2.5">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Timelines</option>
              <option value="30days">Deadline &le; 30 Days</option>
              <option value="60days">In 2-Mo Window (&le; 60d)</option>
            </select>

            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search tenant or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Renewals Table & Action Cards */}
      <div className="space-y-3">
        {filteredRenewals.length === 0 ? (
          <div className="bg-white rounded-sm p-8 text-center text-zinc-400 border border-zinc-200">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-zinc-400" />
            <p className="font-semibold text-xs uppercase tracking-wider">No lease records match your active filters.</p>
          </div>
        ) : (
          filteredRenewals.map(renewal => {
            const deltaRent = renewal.proposedMonthlyRent - renewal.currentMonthlyRent;
            const percentIncrease = ((deltaRent / renewal.currentMonthlyRent) * 100).toFixed(1);
            const m = renewal.milestones;

            const isUrgent = m.isNegotiationWindowOpen && m.daysUntilDecisionDeadline <= 30 && renewal.renewalStatus !== 'Tenant Accepted' && renewal.renewalStatus !== 'Renewed Signed' && renewal.renewalStatus !== 'Notice to Vacate Given' && renewal.renewalStatus !== 'Tenant Declined (Vacating)';
            const isVacating = renewal.renewalStatus === 'Notice to Vacate Given' || renewal.renewalStatus === 'Tenant Declined (Vacating)';
            const isDup = renewal.isDuplicateCard;

            return (
              <div 
                key={renewal.id}
                className={`bg-white rounded-sm p-5 border shadow-xs transition-colors ${
                  isDup
                    ? 'border-amber-400 bg-amber-50/20'
                    : isVacating 
                    ? 'border-rose-300 bg-rose-50/20' 
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-zinc-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Tenant & Tenancy Timeline */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-tight">
                        {formatFullName(renewal.tenantFirstName, renewal.tenantLastName, renewal.tenantName)}
                      </h3>
                      <RenewalStatusBadge status={renewal.renewalStatus} />
                      <MonthToMonthBadge />

                      {isDup && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>Duplicate Card</span>
                        </span>
                      )}
                      
                      {m.isNegotiationWindowOpen && !isVacating && (
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono uppercase tracking-tight ${
                          m.daysUntilDecisionDeadline <= 15
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          ⏱️ Mo 12 Deadline: {m.daysUntilDecisionDeadline > 0 ? `${m.daysUntilDecisionDeadline}d left` : 'Due Now'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-600 flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-zinc-800">{renewal.propertyName}</span>
                      <span>•</span>
                      <span className="font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded-sm border border-zinc-200">
                        {renewal.roomName}
                      </span>
                      {renewal.tenantEmail && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500 font-mono text-[11px]">{renewal.tenantEmail}</span>
                        </>
                      )}
                      {renewal.tenantPhone && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500 font-mono text-[11px]">{renewal.tenantPhone}</span>
                        </>
                      )}
                    </div>

                    {/* Lease Timeline Visual */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-2.5 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-600 flex-wrap gap-2">
                        <span>Lease Start: <strong className="text-zinc-900 font-mono">{renewal.leaseStartDate || '2025-10-01'}</strong></span>
                        <span>1-Yr Anniversary: <strong className="text-indigo-700 font-mono font-semibold">{m.anniversaryDate}</strong></span>
                        <span>Decision Deadline: <strong className="text-rose-700 font-mono font-semibold">{m.decisionDeadline}</strong></span>
                      </div>
                      <div className="text-zinc-500 text-[10px] flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Negotiation Window opened on <strong>{m.negotiationsStartDate}</strong> (2 months before 1-yr anniversary).</span>
                      </div>
                    </div>

                    {/* Notice to Vacate Record (if active) */}
                    {renewal.noticeToVacate && (
                      <div className="bg-rose-50 border border-rose-200 rounded-sm p-2.5 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>🚨 21-Day Notice to Vacate Active</span>
                          <span className="font-mono">Move-out: {renewal.noticeToVacate.effectiveVacateDate}</span>
                        </div>
                        <p className="text-[11px] text-rose-800">
                          Notice submitted by <strong>{renewal.noticeToVacate.givenBy}</strong> on {renewal.noticeToVacate.noticeDate} ({renewal.noticeToVacate.totalNoticeDays} days notice provided).
                        </p>
                        {renewal.noticeToVacate.reason && (
                          <p className="text-[11px] text-rose-700 italic">"{renewal.noticeToVacate.reason}"</p>
                        )}
                      </div>
                    )}

                    {renewal.tenantResponseNotes && (
                      <div className="text-xs bg-zinc-50 p-2 rounded-sm border border-zinc-200 text-zinc-700">
                        <strong className="text-zinc-900">Tenant Feedback: </strong>
                        {renewal.tenantResponseNotes}
                      </div>
                    )}

                    {renewal.internalNotes && (
                      <div className="text-[11px] text-zinc-500 bg-zinc-50/70 p-2 rounded-sm border border-zinc-100 font-mono line-clamp-2">
                        <strong className="text-zinc-700">Notes: </strong>{renewal.internalNotes}
                      </div>
                    )}
                  </div>

                  {/* Middle: 1-Year Rate Increase Card */}
                  <div className="bg-zinc-50 rounded-sm p-3.5 border border-zinc-200 text-xs min-w-[230px] space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-500">Current Monthly:</span>
                      <span className="font-light text-zinc-800 font-mono text-sm">${renewal.currentMonthlyRent}/mo</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-500">Proposed 1-Yr Rate:</span>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-700 font-mono text-sm">${renewal.proposedMonthlyRent}/mo</span>
                        <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">(+{percentIncrease}%)</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-200 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Lease Structure:</span>
                        <span className="font-semibold text-zinc-800">Month-to-Month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Rate Effective:</span>
                        <span className="font-medium text-indigo-700 font-mono">{m.anniversaryDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Notice Rule:</span>
                        <span className="font-medium text-zinc-700">21 Days (Month-End)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 w-full">
                      {/* Edit Button */}
                      {onOpenEditRenewalModal && (
                        <button
                          onClick={() => onOpenEditRenewalModal(renewal)}
                          className="flex-1 px-2.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors flex items-center justify-center gap-1 shadow-2xs"
                          title="Edit rate review, tenant info, rent, dates, and notes"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteRenewal && (
                        <button
                          onClick={() => setCardToDelete(renewal)}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-sm text-xs font-semibold transition-colors flex items-center justify-center"
                          title="Delete this lease card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      <button
                        onClick={() => onOpenRenewalLetterModal(renewal)}
                        className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-xs"
                        title="Generate formal letter or printable notice"
                      >
                        <Send className="w-3 h-3" />
                        <span>Notice</span>
                      </button>

                      <button
                        onClick={() => setSmsTargetRenewal(renewal)}
                        className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-xs"
                        title="Send 1-Year Rate adjustment SMS via Google Voice or Mobile"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>SMS</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setVacatingRenewalTarget(renewal);
                        setNoticeSubmitDate(new Date().toISOString().split('T')[0]);
                        setNoticeReason('');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors flex items-center justify-center gap-1.5 w-full"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Issue 21-Day Notice</span>
                    </button>

                    <div className="flex items-center gap-1.5 w-full">
                      {renewal.renewalStatus !== 'Tenant Accepted' && renewal.renewalStatus !== 'Renewed Signed' && (
                        <button
                          onClick={() => handleQuickStatusChange(renewal, 'Tenant Accepted')}
                          className="flex-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors flex items-center justify-center gap-1"
                          title="Record that tenant agreed to 1-year rate increase"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickStatusChange(renewal, 'Notice Sent')}
                        className="px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-sm text-xs font-medium uppercase tracking-tight"
                        title="Mark Annual Notice as Sent"
                      >
                        Mark Sent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record 21-Day Notice to Vacate Modal */}
      {vacatingRenewalTarget && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
            <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">
                    Record 21-Day Notice to Vacate
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Tenant: {vacatingRenewalTarget.tenantName} ({vacatingRenewalTarget.propertyName} - {vacatingRenewalTarget.roomName})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setVacatingRenewalTarget(null)} 
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmNoticeToVacate} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Notice Initiated By *</label>
                  <select
                    value={noticeGivenBy}
                    onChange={(e) => setNoticeGivenBy(e.target.value as 'Tenant' | 'Landlord')}
                    className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="Tenant">Tenant (Resident)</option>
                    <option value="Landlord">Landlord (Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Date Notice Given *</label>
                  <input
                    type="date"
                    required
                    value={noticeSubmitDate}
                    onChange={(e) => setNoticeSubmitDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Live Calculation Display */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 font-medium">Month Cutoff Rule:</span>
                  <span className="font-bold text-zinc-800">
                    {modalCalcResult.currentMonthDays} days in month (Cutoff: Day {modalCalcResult.noticeCutoffDay})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 font-medium">21-Day Min Date:</span>
                  <span className="font-mono font-bold text-zinc-800">{modalCalcResult.min21DaysDate}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-zinc-800 font-bold uppercase">Official Month-End Vacate Date:</span>
                  <span className="font-mono font-black text-rose-700 text-sm">{modalCalcResult.effectiveVacateDate}</span>
                </div>
                <p className="text-[11px] text-zinc-500 pt-1">
                  {modalCalcResult.explanation}
                </p>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Reason / Move-Out Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  placeholder="e.g. Relocating for work, graduated, purchased home..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setVacatingRenewalTarget(null)}
                  className="px-4 py-2 border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Lock In Vacate Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Card Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h3 className="font-bold text-sm">Delete Lease Renewal Card</h3>
              </div>
              <button onClick={() => setCardToDelete(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-zinc-700">
                Are you sure you want to delete this lease renewal record for <strong className="text-zinc-900 font-bold">{cardToDelete.tenantName}</strong>?
              </p>
              <div className="bg-zinc-50 p-3 rounded border border-zinc-200 space-y-1 text-zinc-600">
                <p><strong>Property:</strong> {cardToDelete.propertyName}</p>
                <p><strong>Bedroom:</strong> {cardToDelete.roomName}</p>
                <p><strong>Current Rent:</strong> ${cardToDelete.currentMonthlyRent}/mo &rarr; Proposed: ${cardToDelete.proposedMonthlyRent}/mo</p>
                <p><strong>Status:</strong> {cardToDelete.renewalStatus}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setCardToDelete(null)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deduplication & Cleanup Modal */}
      {showDeduplicateModal && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
            <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center font-bold text-zinc-900 shadow-xs">
                  <CopyX className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">
                    Lease Card Deduplication & Cleanup
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Scans coliving rooms to detect duplicate records and retain primary active leases
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDeduplicateModal(false)} className="text-zinc-400 hover:text-white p-1">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[600px] overflow-y-auto">
              {duplicateAnalysis.groups.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-md text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">No Duplicates Found</h4>
                  <p className="text-emerald-700 text-xs">
                    All {renewals.length} lease renewal cards represent unique bedrooms and tenancies.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-md flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">
                        {duplicateAnalysis.duplicateCount} duplicate card{duplicateAnalysis.duplicateCount === 1 ? '' : 's'} identified across {duplicateAnalysis.groups.length} room{duplicateAnalysis.groups.length === 1 ? '' : 's'}.
                      </strong>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Our intelligent engine keeps the most progressive record (e.g. accepted, with notice to vacate, or most recent activity) and purges redundant duplicate entries.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {duplicateAnalysis.groups.map((group, idx) => (
                      <div key={group.key || idx} className="border border-zinc-200 rounded-md p-3.5 bg-zinc-50 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                          <div>
                            <span className="font-bold text-zinc-900 text-xs">{group.propertyName} - {group.roomName}</span>
                            <span className="text-zinc-500 ml-2">({group.allCards.length} cards detected)</span>
                          </div>
                          <span className="text-[10px] font-mono bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                            {group.duplicates.length} duplicate{group.duplicates.length === 1 ? '' : 's'} to delete
                          </span>
                        </div>

                        {/* Primary to keep */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                              Keep Primary
                            </span>
                            <span className="font-bold text-emerald-950">{group.primaryCard.tenantName}</span>
                            <span className="text-emerald-800">(${group.primaryCard.proposedMonthlyRent}/mo • {group.primaryCard.renewalStatus})</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700">ID: {group.primaryCard.id}</span>
                        </div>

                        {/* Duplicates to delete */}
                        <div className="space-y-1 pl-2">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Redundant Duplicate Cards to Remove:</span>
                          {group.duplicates.map(dup => (
                            <div key={dup.id} className="bg-white border border-rose-200 rounded p-2 text-xs flex items-center justify-between text-rose-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                                  Duplicate
                                </span>
                                <span>{dup.tenantName}</span>
                                <span className="text-zinc-600">(${dup.proposedMonthlyRent}/mo • {dup.renewalStatus})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-400">ID: {dup.id}</span>
                                {onDeleteRenewal && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteRenewal(dup.id)}
                                    className="p-1 hover:bg-rose-100 rounded text-rose-700"
                                    title="Delete this duplicate now"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeduplicateModal(false)}
                className="px-4 py-2 border border-zinc-300 rounded text-zinc-700 hover:bg-white font-semibold text-xs"
              >
                Close
              </button>

              {duplicateAnalysis.duplicateCount > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteDeduplicateAll}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All {duplicateAnalysis.duplicateCount} Duplicate Card{duplicateAnalysis.duplicateCount === 1 ? '' : 's'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick SMS Modal for 1-Year Rate Adjustment Notice via Google Voice or Mobile */}
      <QuickSmsModal
        isOpen={Boolean(smsTargetRenewal)}
        onClose={() => setSmsTargetRenewal(null)}
        recipient={smsTargetRenewal ? {
          id: smsTargetRenewal.id,
          firstName: smsTargetRenewal.tenantFirstName,
          lastName: smsTargetRenewal.tenantLastName,
          name: smsTargetRenewal.tenantName,
          phone: smsTargetRenewal.tenantPhone || '(303) 555-0100',
          email: smsTargetRenewal.tenantEmail,
          roleOrType: 'Active Room Tenant',
          propertyName: smsTargetRenewal.propertyName,
          roomName: smsTargetRenewal.roomName,
          proposedRent: smsTargetRenewal.proposedMonthlyRent,
          effectiveDate: smsTargetRenewal.renewalEffectiveDate
        } : null}
        defaultTemplateId="anniversary_rate"
      />
    </div>
  );
};
