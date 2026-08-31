import React from 'react';
import { Printer, X, FileText, Database, ShieldCheck, Check } from 'lucide-react';

interface PrintSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintSchemaModal: React.FC<PrintSchemaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-zinc-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-zinc-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Firestore Database Schema & Field Reference</h2>
              <p className="text-[11px] text-zinc-400">Complete field dictionary & types for Moyer Property Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-zinc-800 print:p-0 print:m-0 print:text-black">
          {/* Printable Header */}
          <div className="border-b-2 border-zinc-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight text-zinc-950 uppercase font-mono">
                  Moyer Property Management
                </h1>
                <p className="text-xs font-semibold text-zinc-600 mt-0.5">
                  Firestore Database Architecture & Complete Field Reference Guide
                </p>
              </div>
              <div className="text-right text-[11px] text-zinc-500 font-mono">
                <p>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Database: <span className="font-bold text-zinc-700">ai-studio-moyerpropertyman</span></p>
              </div>
            </div>
          </div>

          {/* Table of Collections Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono print:grid-cols-4">
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">1. Assets</span>
              <strong className="text-zinc-900 text-xs">properties</strong> (21 fields)
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">2. Units</span>
              <strong className="text-zinc-900 text-xs">rooms</strong> (26 fields)
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">3. Leases</span>
              <strong className="text-zinc-900 text-xs">renewals</strong> (29 fields)
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">4. Maintenance</span>
              <strong className="text-zinc-900 text-xs">workorders</strong> (30 fields)
            </div>
          </div>

          {/* Collection 1: properties */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                1. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">properties</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Coliving Buildings & Physical Property Assets</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Unique property ID (e.g. <code>prop-1</code>)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Property display title</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">address</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Street address</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">city / state / zip</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Municipal location & postal code</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyType</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Coliving House, Multi-Unit Brownstone, Student Victorian, Townhome Suites</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">yearBuilt</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Construction year</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">ownerName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Asset owner / landlord full name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">ownerPhone / ownerEmail</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Owner direct contact coordinates</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">totalRooms</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Total rentable room count</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">occupiedRooms</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Currently active occupied room count</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">monthlyRevenueEstimate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Total estimated monthly rent ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">sharedAmenities</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string[]</td><td className="p-1.5">Shared kitchen, laundry, bike storage, patio, lounge</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">houseRules</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string[]</td><td className="p-1.5">Community guidelines and noise/guest standards</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">wifiNetwork / wifiPassword</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Resident Wi-Fi network SSID & access key</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">keypadMasterCode</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Front door smartlock / master keypad code</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">notes / imageUrl</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Manager remarks & property cover image URL</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 2: rooms */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                2. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">rooms</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Individual Rentable Rooms & Suites</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / propertyId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Room ID & associated parent property ID</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Denormalized parent property display name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">roomNumber / name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Unit number & full room title</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">floor / sqft</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Level (Main, 2nd, Basement) & square footage</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">bathroomType</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Private Ensuite, Shared Bath, Jack & Jill Shared</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">isFurnished</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">boolean</td><td className="p-1.5">Whether room includes bedroom furniture</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">monthlyRent / securityDeposit</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Monthly base rent ($) & deposit hold ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">status</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5 font-bold text-indigo-900">Occupied, Available, Under Turnover, Reserved</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantFirstName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active resident first name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantLastName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active resident last name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active resident formatted full name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantPhone / Email</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active tenant mobile & email</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">leaseStartDate / leaseEndDate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Lease term dates (ISO <code>YYYY-MM-DD</code>)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">turnoverChecklist</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">array</td><td className="p-1.5">Tasks list with <code>id</code>, <code>task</code>, <code>isDone</code></td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">utilitiesIncluded / amenities</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string[]</td><td className="p-1.5">Included utilities & private in-room amenities</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 3: renewals */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                3. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">renewals</code>
              </h2>
              <span className="text-[11px] text-zinc-500">1-Year Rate Adjustment Engine & Month-to-Month Records</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / tenantId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Renewal record ID & resident identifier</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantFirstName / LastName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Tenant discrete first & last names</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantName / Email / Phone</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Full name, email address, and mobile number</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyId / roomId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Foreign keys to Property and Room records</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyName / roomName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Denormalized unit location titles</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentMonthlyRent</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Current active monthly rent ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">proposedMonthlyRent</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Proposed 1-year rate adjustment ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">leaseStartDate / currentLeaseEndDate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Original lease commencement & anniversary date</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">daysUntilExpiration</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Days countdown until review / move-out</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">renewalStatus</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Auto-Renewing Month-to-Month, Review Pending, Notice Sent, Negotiating Terms, Tenant Accepted, Tenant Declined (Vacating), Notice to Vacate Given, Renewed Signed</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">anniversaryDate / decisionDeadline</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">1-Year adjustment date & response deadline</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">noticeToVacate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">object?</td><td className="p-1.5">noticeDate, givenBy (Tenant/Landlord), minNoticeDays, effectiveVacateDate, totalNoticeDays, reason</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantResponseNotes / internalNotes</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Feedback received & manager internal remarks</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 4: workorders */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                4. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">workorders</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Maintenance Tickets, Contractor Dispatches & Repairs</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / ticketNumber</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Unique ID & human ticket code (e.g. <code>WO-1002</code>)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">title / description</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Issue headline & detailed description</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyId / roomId / isCommonArea</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / bool</td><td className="p-1.5">Target property, optional room ID, common area flag</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">reportedByFirstName / LastName / Name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Reporter resident name fields</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">reportedByPhone / Email</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Reporter contact phone and email</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">category</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Plumbing, HVAC / Heating, Electrical, Appliance, Locks & Access, Common Area, Room Fixtures, Pest Control, Deep Cleaning</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">priority</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5 font-bold text-rose-700">Emergency, High, Medium, Low</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">status</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">New, Assigned, In Progress, Awaiting Parts, Scheduled, Completed, Cancelled</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">assignedVendorId / Name / Phone</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Assigned contractor coordinates</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">estimatedCost / actualCost</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Estimated budget ($) vs final invoice ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">dateReported / dateScheduled / dateCompleted</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Lifecycle milestones (ISO dates)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">comments / timeline</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">array</td><td className="p-1.5">Two-way message feed & status change audit log</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 5: leads */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                5. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">leads</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Applicant Pipeline & Roommate Screening CRM</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / firstName / lastName / name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Lead identifier and discrete name fields</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">email / phone</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Applicant contact coordinates</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">stage</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">New Lead, Contacted, Showing Scheduled, Application Received, Lease Signed, Lost / Archived</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">targetMoveInDate / maxBudget</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Desired move-in date & max rent budget ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">preferredBathroom / furnishingPreference</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Private Only/Shared OK, Furnished/Unfurnished</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">source / score</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Zillow, Craigslist, Roomies, Facebook, etc. & score (1-100)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">occupation / monthlyIncome / creditScoreRange</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Financial & employment qualification data</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">lifestyleProfile</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">object</td><td className="p-1.5">Coliving compatibility: cleanliness, schedule, social, pets, smoking</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">activityHistory</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">array</td><td className="p-1.5">Calls, emails, tours, SMS logs with timestamp and agent name</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 6: contacts */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                6. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">contacts</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Unified Rolodex (Tenants, Vendors, Owners, Agents)</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description / Allowed Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / type</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Tenant, Lead, Vendor / Contractor, Property Owner, Emergency Contact, Leasing Agent</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">firstName / lastName / name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">First name, last name, formatted full name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">company / roleOrSpecialty</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Company name & trade/role specialty (e.g. Master Plumber)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">phone / secondaryPhone / email</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Contact numbers and email address</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyId / roomId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Unit occupancy or property assignment link</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">hourlyRate / rating / licenseNumber</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">num / str?</td><td className="p-1.5">Contractor billing rate, 1-5 star rating, license code</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">emergencyContactName / Phone</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Next-of-kin emergency contact info for tenants</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">status / avatarBg</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Active, Past, Available 24/7 & avatar color class</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 7: activityLogs */}
          <section className="space-y-2 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                7. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">activityLogs</code>
              </h2>
              <span className="text-[11px] text-zinc-500">System Audit Trail & Operations Log</span>
            </div>
            <table className="w-full text-left border-collapse border border-zinc-300 text-[11px]">
              <thead>
                <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                  <th className="p-1.5 border-r border-zinc-300 w-1/4">Field Name</th>
                  <th className="p-1.5 border-r border-zinc-300 w-1/6 font-mono text-indigo-800">Type</th>
                  <th className="p-1.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / timestamp</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Log ID & formatted date-time string</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">category</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Lease, Maintenance, Lead, Room, System</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">message / user</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Event description and author / admin name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">entityId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Optional reference ID to affected record</td></tr>
              </tbody>
            </table>
          </section>

          {/* Document Footer */}
          <div className="pt-4 border-t border-zinc-300 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>Moyer Property Management • Firestore Security Rules & Blueprint Synced</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* Modal Footer (hidden in print) */}
        <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex justify-between items-center shrink-0 print:hidden">
          <span className="text-[11px] text-zinc-500 font-medium">
            Formatted for standard 8.5 x 11 in. Letter printing and PDF export
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schema</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
