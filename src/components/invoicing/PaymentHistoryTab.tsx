import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ExternalLink, 
  RefreshCw, 
  CreditCard, 
  DollarSign, 
  Building2, 
  Calendar, 
  User, 
  ArrowUpDown, 
  Download, 
  Check, 
  AlertCircle,
  FileText,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { Invoice, Property, InvoiceStatus } from '../../types';
import { SquareService } from '../../services/squareService';
import { StorageService } from '../../services/storage';
import { FirebaseService } from '../../services/firebase';

interface PaymentHistoryTabProps {
  invoices: Invoice[];
  properties: Property[];
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, details?: Partial<Invoice>) => void;
  onSaveInvoices?: (invoices: Invoice[]) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onSyncInvoiceStatus?: (invoice: Invoice) => Promise<void>;
  syncingInvoiceId?: string | null;
  onSwitchToRentTab?: () => void;
}

type PaymentFilterOutcome = 'all' | 'successful' | 'failed' | 'pending';

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({
  invoices,
  properties,
  onUpdateInvoiceStatus,
  onSaveInvoices,
  onDeleteInvoice,
  onSyncInvoiceStatus,
  syncingInvoiceId,
  onSwitchToRentTab
}) => {
  // Filters & State
  const [outcomeFilter, setOutcomeFilter] = useState<PaymentFilterOutcome>('all');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  
  // Failure reason modal / action
  const [editingFailureInvoice, setEditingFailureInvoice] = useState<Invoice | null>(null);
  const [failureReasonInput, setFailureReasonInput] = useState<string>('Card Declined: Insufficient Funds');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delete invoice state
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<boolean>(false);

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    const targetId = invoiceToDelete.id;
    setIsDeletingInvoice(true);
    try {
      if (invoiceToDelete.squareInvoiceId && invoiceToDelete.squareInvoiceId.startsWith('inv:')) {
        try {
          await SquareService.cancelInvoice(invoiceToDelete.squareInvoiceId);
        } catch (sqErr) {
          console.warn('Square cancellation warning:', sqErr);
        }
      }

      const remaining = invoices.filter(i => i.id !== targetId);
      if (onDeleteInvoice) {
        await onDeleteInvoice(targetId);
      }
      if (onSaveInvoices) {
        onSaveInvoices(remaining);
      }
      StorageService.deleteInvoice(targetId);
      try {
        await FirebaseService.deleteInvoice(targetId);
      } catch (fbErr) {
        console.error('Failed to delete invoice from Firebase:', fbErr);
      }

      showToast(`Invoice record for ${invoiceToDelete.tenantName || 'Resident'} was deleted.`);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Error deleting invoice from payment history:', err);
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  // Helper to trigger toast
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Determine payment classification for each invoice
  const classifiedInvoices = useMemo(() => {
    const now = Date.now();

    return invoices.map(inv => {
      const isPaid = inv.status === 'PAID' || (inv.amountPaid !== undefined && inv.amountPaid > 0);
      
      const isExplicitFailed = inv.status === 'FAILED' || 
        Boolean(inv.failureReason && inv.failureReason.trim().length > 0);

      const isCanceled = inv.status === 'CANCELED';
      const isOverdue = inv.status === 'OVERDUE' || 
        (inv.status === 'UNPAID' && inv.dueDate && new Date(inv.dueDate).getTime() < now);

      let outcomeCategory: 'successful' | 'failed' | 'pending';
      let failureLabel = inv.failureReason || '';

      if (isPaid) {
        outcomeCategory = 'successful';
      } else if (isExplicitFailed || isCanceled || isOverdue) {
        outcomeCategory = 'failed';
        if (!failureLabel) {
          if (isCanceled) failureLabel = 'Payment Canceled / Voided';
          else if (isOverdue) failureLabel = 'Delinquent: Past Due Date';
          else failureLabel = 'Transaction Failed: Authorization Error';
        }
      } else {
        outcomeCategory = 'pending';
      }

      return {
        ...inv,
        outcomeCategory,
        derivedFailureReason: failureLabel,
        effectiveDate: inv.paidAt || inv.failedAt || inv.createdAt || inv.dueDate
      };
    });
  }, [invoices]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let successfulCount = 0;
    let successfulAmount = 0;
    let failedCount = 0;
    let failedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    classifiedInvoices.forEach(item => {
      const amt = item.totalAmount || item.amount || 0;
      if (item.outcomeCategory === 'successful') {
        successfulCount++;
        successfulAmount += amt;
      } else if (item.outcomeCategory === 'failed') {
        failedCount++;
        failedAmount += amt;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
    });

    const totalProcessed = successfulCount + failedCount;
    const successRate = totalProcessed > 0 ? (successfulCount / totalProcessed) * 100 : 100;

    return {
      successfulCount,
      successfulAmount,
      failedCount,
      failedAmount,
      pendingCount,
      pendingAmount,
      totalCount: classifiedInvoices.length,
      successRate
    };
  }, [classifiedInvoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return classifiedInvoices
      .filter(item => {
        // Outcome filter
        if (outcomeFilter !== 'all' && item.outcomeCategory !== outcomeFilter) {
          return false;
        }

        // Property filter
        if (selectedPropertyFilter !== 'all' && item.propertyId !== selectedPropertyFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match = 
            (item.tenantName && item.tenantName.toLowerCase().includes(q)) ||
            (item.tenantEmail && item.tenantEmail.toLowerCase().includes(q)) ||
            (item.propertyName && item.propertyName.toLowerCase().includes(q)) ||
            (item.roomName && item.roomName.toLowerCase().includes(q)) ||
            (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(q)) ||
            (item.squareInvoiceId && item.squareInvoiceId.toLowerCase().includes(q)) ||
            (item.paymentMethod && item.paymentMethod.toLowerCase().includes(q)) ||
            (item.derivedFailureReason && item.derivedFailureReason.toLowerCase().includes(q));

          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.effectiveDate || 0).getTime() - new Date(a.effectiveDate || 0).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.effectiveDate || 0).getTime() - new Date(b.effectiveDate || 0).getTime();
        }
        if (sortBy === 'amount_desc') {
          return (b.totalAmount || b.amount || 0) - (a.totalAmount || a.amount || 0);
        }
        if (sortBy === 'amount_asc') {
          return (a.totalAmount || a.amount || 0) - (b.totalAmount || b.amount || 0);
        }
        return 0;
      });
  }, [classifiedInvoices, outcomeFilter, selectedPropertyFilter, searchQuery, sortBy]);

  // Action: Mark as Paid (Successful)
  const handleMarkAsPaid = (inv: Invoice) => {
    const paidTimestamp = new Date().toISOString();
    onUpdateInvoiceStatus(inv.id, 'PAID', {
      paidAt: paidTimestamp,
      paymentMethod: 'Square Online Pay (Card)',
      amountPaid: inv.totalAmount || inv.amount,
      failureReason: undefined,
      failedAt: undefined
    });
    showToast(`Payment recorded as Successful for ${inv.tenantName} ($${(inv.totalAmount || inv.amount).toFixed(2)})`);
  };

  // Action: Mark as Failed (e.g. Card Declined / Returned)
  const handleRecordFailure = () => {
    if (!editingFailureInvoice) return;
    const failedTimestamp = new Date().toISOString();
    onUpdateInvoiceStatus(editingFailureInvoice.id, 'FAILED', {
      status: 'FAILED',
      failureReason: failureReasonInput.trim() || 'Card Declined: Insufficient Funds',
      failedAt: failedTimestamp,
      paidAt: undefined
    });
    showToast(`Payment marked as Failed for ${editingFailureInvoice.tenantName} (${failureReasonInput})`);
    setEditingFailureInvoice(null);
  };

  // Helper: Seed sample payment records if empty so the user can immediately evaluate the table
  const handleSeedDemoPayments = () => {
    if (!onSaveInvoices) return;
    const propSpeer = properties[0] || { id: 'prop-1', name: 'Speer Coliving House', squareLocationId: 'LN4WBHANNNZ2Y' };
    const propCapHill = properties[1] || { id: 'prop-2', name: 'Capitol Hill Victorian', squareLocationId: 'LN4WBHANNNZ2Y' };

    const demoInvoices: Invoice[] = [
      {
        id: `demo-inv-1-${Date.now()}`,
        invoiceNumber: 'INV-2026-08-101',
        squareInvoiceId: 'inv:0-AQAAEB1234567890',
        squareOrderId: 'ord_speer_001',
        squareLocationId: propSpeer.squareLocationId || 'LN4WBHANNNZ2Y',
        propertyId: propSpeer.id,
        propertyName: propSpeer.name,
        roomName: 'Room 101 - Primary Suite',
        tenantName: 'Marcus Vance',
        tenantEmail: 'marcus.vance@gmail.com',
        invoiceType: 'Rental',
        month: 'August',
        year: 2026,
        amount: 895,
        totalAmount: 895,
        status: 'PAID',
        paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        paymentMethod: 'Square Online (Visa •••• 4242)',
        amountPaid: 895,
        dueDate: '2026-08-01',
        createdAt: '2026-07-25T14:00:00Z',
        subtask: 'rent',
        squarePaymentUrl: 'https://squareup.com/pay-invoice/demo-marcus'
      },
      {
        id: `demo-inv-2-${Date.now()}`,
        invoiceNumber: 'INV-2026-08-102',
        squareInvoiceId: 'inv:0-AQAAEB9876543210',
        squareOrderId: 'ord_speer_002',
        squareLocationId: propSpeer.squareLocationId || 'LN4WBHANNNZ2Y',
        propertyId: propSpeer.id,
        propertyName: propSpeer.name,
        roomName: 'Room 102 - Sunroom Garden',
        tenantName: 'Elena Rostova',
        tenantEmail: 'elena.rostova@techcorp.io',
        invoiceType: 'Rental',
        month: 'August',
        year: 2026,
        amount: 950,
        totalAmount: 950,
        status: 'PAID',
        paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        paymentMethod: 'Square ACH Direct Debit',
        amountPaid: 950,
        dueDate: '2026-08-01',
        createdAt: '2026-07-25T14:05:00Z',
        subtask: 'rent',
        squarePaymentUrl: 'https://squareup.com/pay-invoice/demo-elena'
      },
      {
        id: `demo-inv-3-${Date.now()}`,
        invoiceNumber: 'INV-2026-08-103',
        squareInvoiceId: 'inv:0-AQAAEB5555444433',
        squareOrderId: 'ord_speer_003',
        squareLocationId: propSpeer.squareLocationId || 'LN4WBHANNNZ2Y',
        propertyId: propSpeer.id,
        propertyName: propSpeer.name,
        roomName: 'Room 103 - Corner Parkview',
        tenantName: 'Daniel Oliveira',
        tenantEmail: 'daniel.oliveira@creative.co',
        invoiceType: 'Rental',
        month: 'August',
        year: 2026,
        amount: 875,
        lateFeeAmount: 50,
        lateFeeApplied: true,
        totalAmount: 925,
        status: 'FAILED',
        failedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        failureReason: 'Card Declined: Insufficient Funds (Decline Code: card_declined)',
        paymentMethod: 'Mastercard •••• 8812',
        dueDate: '2026-08-01',
        createdAt: '2026-07-25T14:10:00Z',
        subtask: 'rent',
        squarePaymentUrl: 'https://squareup.com/pay-invoice/demo-daniel'
      },
      {
        id: `demo-inv-4-${Date.now()}`,
        invoiceNumber: 'INV-2026-08-201',
        squareInvoiceId: 'inv:0-AQAAEB1122334455',
        squareOrderId: 'ord_caphill_001',
        squareLocationId: propCapHill.squareLocationId || 'LN4WBHANNNZ2Y',
        propertyId: propCapHill.id,
        propertyName: propCapHill.name,
        roomName: 'Room 202 - Pearl Bay Room',
        tenantName: "Liam O'Connor",
        tenantEmail: 'liam.oconnor@colorado.edu',
        invoiceType: 'Rental',
        month: 'August',
        year: 2026,
        amount: 885,
        totalAmount: 885,
        status: 'PAID',
        paidAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        paymentMethod: 'Square Online (Amex •••• 1004)',
        amountPaid: 885,
        dueDate: '2026-08-01',
        createdAt: '2026-07-25T14:15:00Z',
        subtask: 'rent',
        squarePaymentUrl: 'https://squareup.com/pay-invoice/demo-liam'
      },
      {
        id: `demo-inv-5-${Date.now()}`,
        invoiceNumber: 'INV-2026-08-202',
        squareInvoiceId: 'inv:0-AQAAEB9988776655',
        squareOrderId: 'ord_caphill_002',
        squareLocationId: propCapHill.squareLocationId || 'LN4WBHANNNZ2Y',
        propertyId: propCapHill.id,
        propertyName: propCapHill.name,
        roomName: 'Room 203 - Capitol View Master',
        tenantName: 'Chloe Davenport',
        tenantEmail: 'chloe.davenport@gmail.com',
        invoiceType: 'Rental',
        month: 'August',
        year: 2026,
        amount: 920,
        totalAmount: 920,
        status: 'OVERDUE',
        failureReason: 'Delinquent: Due Date Elapsed without Authorization',
        dueDate: '2026-08-01',
        createdAt: '2026-07-25T14:20:00Z',
        subtask: 'rent',
        squarePaymentUrl: 'https://squareup.com/pay-invoice/demo-chloe'
      }
    ];

    onSaveInvoices([...demoInvoices, ...invoices]);
    showToast('Loaded 5 demonstration payment records (3 Successful, 2 Failed/Overdue)');
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback banner */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Square Payment History & Settlement Ledger</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-100 text-zinc-700 rounded-full font-bold border border-zinc-200">
              {classifiedInvoices.length} Invoices Tracked
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time audit log of successful settlements, failed card authorizations, and overdue collection issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {invoices.length === 0 && onSaveInvoices && (
            <button
              type="button"
              onClick={handleSeedDemoPayments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition shadow-2xs"
              title="Populate test payments to verify the visualization"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Demo Payments</span>
            </button>
          )}

          {onSwitchToRentTab && (
            <button
              type="button"
              onClick={onSwitchToRentTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md transition shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Generate New Invoices</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Successful Payments Card */}
        <div className="bg-white border border-emerald-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Successful Payments</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-zinc-900">
            ${metrics.successfulAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
            <span>{metrics.successfulCount} settled transaction{metrics.successfulCount === 1 ? '' : 's'}</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">Paid</span>
          </div>
        </div>

        {/* Failed & Delinquent Card */}
        <div className="bg-white border border-rose-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Failed / Delinquent</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-700">
            ${metrics.failedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
            <span>{metrics.failedCount} issue{metrics.failedCount === 1 ? '' : 's'} detected</span>
            <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">Needs Action</span>
          </div>
        </div>

        {/* Collection / Reliability Rate Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Settlement Rate</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-indigo-600">
            {metrics.successRate.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.successRate)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-500">
            {metrics.successfulCount} of {metrics.successfulCount + metrics.failedCount} resolved payments
          </div>
        </div>

        {/* Pending & Scheduled Invoices Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Awaiting Settlement</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-zinc-900">
            ${metrics.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
            <span>{metrics.pendingCount} pending invoice{metrics.pendingCount === 1 ? '' : 's'}</span>
            <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">Active</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Outcome Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setOutcomeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                outcomeFilter === 'all'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'
              }`}
            >
              All Records ({classifiedInvoices.length})
            </button>

            <button
              type="button"
              onClick={() => setOutcomeFilter('successful')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                outcomeFilter === 'successful'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Successful ({metrics.successfulCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcomeFilter('failed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                outcomeFilter === 'failed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Failed & Delinquent ({metrics.failedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcomeFilter('pending')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                outcomeFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({metrics.pendingCount})</span>
            </button>
          </div>

          {/* Quick Info Badge */}
          <div className="text-[11px] text-zinc-500 flex items-center gap-2 shrink-0">
            <span>Showing <strong className="text-zinc-800">{filteredInvoices.length}</strong> of {classifiedInvoices.length} records</span>
          </div>
        </div>

        {/* Secondary Filters Bar: Search, Property, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-200">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resident, room, invoice #, card..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Property Selector */}
          <div>
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-zinc-300 rounded-md text-xs text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-1.5 bg-white border border-zinc-300 rounded-md text-xs text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="date_desc">Sort: Most Recent First</option>
              <option value="date_asc">Sort: Oldest First</option>
              <option value="amount_desc">Sort: Highest Amount</option>
              <option value="amount_asc">Sort: Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment History Table View */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No Payment Records Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {invoices.length === 0 
                ? "There are no invoices in your ledger yet. Create invoices in the Monthly Rental tab or load sample payments to evaluate the history view."
                : "No payments match your current filter criteria. Try resetting the filters or clearing the search query."}
            </p>
            {invoices.length === 0 && onSaveInvoices && (
              <button
                type="button"
                onClick={handleSeedDemoPayments}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Payment Records</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-36">Outcome / Status</th>
                  <th className="p-3">Invoice & Square Order</th>
                  <th className="p-3">Resident & Unit</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredInvoices.map((inv) => {
                  const isSuccess = inv.outcomeCategory === 'successful';
                  const isFail = inv.outcomeCategory === 'failed';
                  const isPending = inv.outcomeCategory === 'pending';

                  return (
                    <tr 
                      key={inv.id} 
                      className={`transition-colors ${
                        isSuccess 
                          ? 'hover:bg-emerald-50/40' 
                          : isFail 
                          ? 'bg-rose-50/20 hover:bg-rose-50/50' 
                          : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      {/* Column 1: Outcome / Status */}
                      <td className="p-3 align-top">
                        {isSuccess && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Successful</span>
                            </span>
                            <p className="text-[10px] text-emerald-700 font-medium">Settled on Square</p>
                          </div>
                        )}

                        {isFail && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Failed / Delinquent</span>
                            </span>
                            {inv.derivedFailureReason && (
                              <p className="text-[10px] text-rose-700 font-medium line-clamp-2" title={inv.derivedFailureReason}>
                                {inv.derivedFailureReason}
                              </p>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Auth</span>
                            </span>
                            <p className="text-[10px] text-amber-700 font-medium">Awaiting Resident Checkout</p>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Invoice & Square Order */}
                      <td className="p-3 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-zinc-900 text-xs">
                              {inv.invoiceNumber || inv.id}
                            </span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${
                              inv.invoiceType === 'Rental'
                                ? 'bg-blue-100 text-blue-800'
                                : inv.invoiceType === 'Utility'
                                ? 'bg-amber-100 text-amber-800'
                                : inv.invoiceType === 'Late Fee'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-zinc-200 text-zinc-800'
                            }`}>
                              {inv.invoiceType || 'Rental'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                            <span>Square:</span>
                            <span className="bg-zinc-100 px-1 py-0.2 rounded border border-zinc-200 text-zinc-700">
                              {inv.squareInvoiceId ? inv.squareInvoiceId.substring(0, 18) + (inv.squareInvoiceId.length > 18 ? '...' : '') : 'Pending ID'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Resident & Unit */}
                      <td className="p-3 align-top">
                        <p className="font-bold text-zinc-900 text-xs">{inv.tenantName}</p>
                        <p className="text-[11px] text-zinc-600 font-medium">{inv.propertyName}</p>
                        <p className="text-[10px] text-zinc-400">{inv.roomName || 'Whole Property'}</p>
                      </td>

                      {/* Column 4: Payment Method */}
                      <td className="p-3 align-top">
                        <div className="space-y-0.5">
                          <p className="font-medium text-zinc-800 text-xs flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-zinc-500" />
                            <span>{inv.paymentMethod || 'Square Hosted Checkout'}</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            Loc: {inv.squareLocationId || 'LN4WBHANNNZ2Y'}
                          </p>
                        </div>
                      </td>

                      {/* Column 5: Date */}
                      <td className="p-3 align-top text-xs text-zinc-700">
                        {isSuccess && inv.paidAt ? (
                          <div>
                            <span className="font-semibold text-emerald-800">
                              {new Date(inv.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="block text-[10px] text-zinc-400 font-mono">
                              {new Date(inv.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : isFail && inv.failedAt ? (
                          <div>
                            <span className="font-semibold text-rose-800">
                              {new Date(inv.failedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="block text-[10px] text-rose-500">Failed</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-zinc-800">Due: {inv.dueDate || '1st of month'}</span>
                            <span className="block text-[10px] text-zinc-400">
                              Period: {inv.month || inv.billingMonth} {inv.year || inv.billingYear}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Column 6: Amount */}
                      <td className="p-3 align-top text-right font-mono">
                        <span className={`text-xs font-bold ${isSuccess ? 'text-emerald-700' : isFail ? 'text-rose-700' : 'text-zinc-900'}`}>
                          ${(inv.totalAmount || inv.amount).toFixed(2)}
                        </span>
                        {inv.lateFeeAmount && inv.lateFeeAmount > 0 && (
                          <span className="block text-[9px] text-rose-600 font-normal">
                            (incl. ${inv.lateFeeAmount.toFixed(2)} late fee)
                          </span>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                        {/* Open Square Payment / View Link */}
                        {(inv.squarePaymentUrl || inv.paymentUrl || inv.viewUrl) && (
                          <a
                            href={inv.squarePaymentUrl || inv.paymentUrl || inv.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded font-semibold transition"
                            title="Open authentic Square hosted payment / invoice receipt page"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        )}

                        {/* Action: Mark Paid if not paid */}
                        {!isSuccess && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(inv)}
                            className="px-2 py-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold transition"
                            title="Record payment as Successful / Settled"
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* Action: Mark as Failed or Record Failure Note */}
                        {isSuccess ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFailureInvoice(inv);
                              setFailureReasonInput('Card Declined: Insufficient Funds');
                            }}
                            className="px-2 py-1 text-[11px] text-zinc-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="Simulate card decline or mark as failed for testing"
                          >
                            Simulate Decline
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFailureInvoice(inv);
                              setFailureReasonInput(inv.derivedFailureReason || 'Card Declined: Insufficient Funds');
                            }}
                            className="px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded font-semibold transition"
                            title="Update or record failure reason"
                          >
                            Failure Reason
                          </button>
                        )}

                        {/* Action: Sync status with Square */}
                        {onSyncInvoiceStatus && (
                          <button
                            type="button"
                            onClick={() => onSyncInvoiceStatus(inv)}
                            disabled={syncingInvoiceId === inv.id}
                            className="px-1.5 py-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition"
                            title="Sync live status with Square Invoices API"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingInvoiceId === inv.id ? 'animate-spin text-indigo-600' : ''}`} />
                          </button>
                        )}

                        {/* Action: Delete invoice from ledger */}
                        <button
                          type="button"
                          onClick={() => setInvoiceToDelete(inv)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded font-semibold transition"
                          title="Delete this invoice from ledger"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Payment Failure Modal */}
      {editingFailureInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Record Payment Failure / Decline</h3>
                  <p className="text-[11px] text-zinc-500">
                    {editingFailureInvoice.tenantName} • {editingFailureInvoice.propertyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFailureInvoice(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-600">
                Specify the authorization failure code or delinquency reason for invoice{' '}
                <strong className="text-zinc-900 font-mono">{editingFailureInvoice.invoiceNumber || editingFailureInvoice.id}</strong>{' '}
                (${ (editingFailureInvoice.totalAmount || editingFailureInvoice.amount).toFixed(2) }).
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Common Failure Reasons
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    'Card Declined: Insufficient Funds',
                    'Card Declined: Expired Card / Invalid CVV',
                    'Card Declined: Strict Fraud / 3DS Verification Failed',
                    'ACH Return: Unverified Account / Stop Payment',
                    'Delinquent: Past Due Date Grace Period Elapsed',
                    'Payment Link Expired / Voided by Merchant'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFailureReasonInput(preset)}
                      className={`text-left px-2.5 py-1.5 text-xs rounded border transition ${
                        failureReasonInput === preset
                          ? 'border-rose-500 bg-rose-50 text-rose-900 font-semibold'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Custom Failure Detail / Notes
                </label>
                <textarea
                  rows={2}
                  value={failureReasonInput}
                  onChange={(e) => setFailureReasonInput(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="Enter specific bank or Square decline message..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingFailureInvoice(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecordFailure}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition"
                >
                  Save Payment Failure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Invoice Record Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">Delete Invoice Record</h3>
                  <p className="text-xs text-zinc-500">Confirm removal from Payment History & Ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={isDeletingInvoice}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-zinc-700">
                Are you sure you want to delete this invoice record from the ledger?
              </p>

              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3.5 space-y-1.5 text-zinc-600">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Resident:</span>
                  <span className="font-semibold text-zinc-900">{invoiceToDelete.tenantName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Property:</span>
                  <span className="text-zinc-800">{invoiceToDelete.propertyName} {invoiceToDelete.roomName ? `• ${invoiceToDelete.roomName}` : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Billing Period:</span>
                  <span className="text-zinc-800 font-medium">{invoiceToDelete.billingMonth} {invoiceToDelete.billingYear}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Invoice ID:</span>
                  <span className="font-mono text-[11px] text-zinc-700 bg-white px-1.5 py-0.5 border border-zinc-200 rounded">
                    {invoiceToDelete.squareInvoiceId || invoiceToDelete.id}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-zinc-200">
                  <span className="text-zinc-700 font-semibold">Total Amount:</span>
                  <span className="font-mono font-bold text-sm text-zinc-900">${invoiceToDelete.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This will permanently delete this invoice record from the ledger and local/cloud storage.
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={isDeletingInvoice}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingInvoice}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md shadow-xs transition"
              >
                {isDeletingInvoice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
