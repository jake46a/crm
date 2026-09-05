import React from 'react';
import { Printer, X, FileText, Database, ShieldCheck, Check } from 'lucide-react';
import { printHtmlDocument } from '../../utils/printUtils';

interface PrintSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintSchemaModal: React.FC<PrintSchemaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getHtmlSchemaContent = () => {
    return `
      <!-- Printable Header -->
      <div style="border-bottom: 2px solid #09090b; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; font-family: monospace; margin: 0; color: #09090b;">
              Moyer Property Management
            </h1>
            <p style="font-size: 11px; font-weight: 600; color: #4b5563; margin: 4px 0 0 0;">
              Firestore Database Architecture & Complete Field Reference Guide
            </p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #6b7280; font-family: monospace;">
            <div>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>Database: <strong style="color: #1f2937;">ai-studio-moyerpropertyman</strong></div>
          </div>
        </div>
      </div>

      <!-- Table of Collections Summary -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-family: monospace; font-size: 10px; margin-bottom: 16px;">
        <div style="padding: 6px 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
          <span style="color: #6b7280; display: block; font-size: 9px; text-transform: uppercase; font-weight: bold;">1. Assets</span>
          <strong style="color: #111827; font-size: 11px;">properties</strong> (21 fields)
        </div>
        <div style="padding: 6px 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
          <span style="color: #6b7280; display: block; font-size: 9px; text-transform: uppercase; font-weight: bold;">2. Units</span>
          <strong style="color: #111827; font-size: 11px;">rooms</strong> (26 fields)
        </div>
        <div style="padding: 6px 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
          <span style="color: #6b7280; display: block; font-size: 9px; text-transform: uppercase; font-weight: bold;">3. Leases</span>
          <strong style="color: #111827; font-size: 11px;">renewals</strong> (29 fields)
        </div>
        <div style="padding: 6px 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
          <span style="color: #6b7280; display: block; font-size: 9px; text-transform: uppercase; font-weight: bold;">4. Maintenance</span>
          <strong style="color: #111827; font-size: 11px;">workorders</strong> (30 fields)
        </div>
      </div>

      <!-- Collection 1: properties -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            1. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">properties</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Coliving Buildings & Physical Property Assets</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Unique property ID (e.g. <code>prop-1</code>)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">name</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Property display title</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">address</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Street address</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">city / state / zip</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Municipal location & postal code</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyType</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Coliving House, Multi-Unit Brownstone, Student Victorian, Townhome Suites</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">yearBuilt</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Construction year</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">ownerName</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Asset owner / landlord full name</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">ownerPhone / ownerEmail</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Owner direct contact coordinates</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">totalRooms / occupiedRooms</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Total rentable rooms vs currently occupied units</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">monthlyRevenueEstimate</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Total estimated monthly rent ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">sharedAmenities / houseRules</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string[]</td><td style="padding: 4px 6px;">Shared amenities array & house rules/guidelines</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">wifiNetwork / wifiPassword</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Resident Wi-Fi network SSID & access key</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">keypadMasterCode</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Front door smartlock / master keypad code</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">squareLocationId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Square Location ID linked for payment processing</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">notes / imageUrl</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Manager remarks & property cover image URL</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 2: rooms -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            2. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">rooms</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Individual Rentable Rooms & Suites</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / propertyId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Room ID & associated parent property ID</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyName / roomNumber / name</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Property title, unit number, full room name</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">floor / sqft</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">str / num</td><td style="padding: 4px 6px;">Floor level (Main, 2nd, Basement) & square footage</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">bathroomType</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Private Ensuite, Shared Bath, Jack & Jill Shared</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">isFurnished / monthlyRent / securityDeposit</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">bool / num</td><td style="padding: 4px 6px;">Furnished status, monthly rent ($), deposit ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">status</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px; font-weight: bold; color: #1e3a8a;">Occupied, Available, Under Turnover, Reserved</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">currentTenantFirstName / LastName</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Active resident first & last names</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">currentTenantName / Phone / Email</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Active tenant full name, phone number, email</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">leaseStartDate / leaseEndDate</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Lease term dates (ISO YYYY-MM-DD)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">turnoverChecklist</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">array</td><td style="padding: 4px 6px;">Tasks list with id, task, isDone</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">utilitiesIncluded / amenities</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string[]</td><td style="padding: 4px 6px;">Included utilities & in-room private amenities</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 3: renewals -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            3. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">renewals</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">1-Year Rate Adjustment Engine & Month-to-Month Records</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / tenantId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Renewal record ID & resident identifier</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">tenantFirstName / LastName / Name</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">First name, last name, and formatted full name</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">tenantEmail / tenantPhone</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Resident email address and mobile phone</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyId / roomId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Foreign keys to Property and Room records</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyName / roomName</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Denormalized unit location titles</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">currentMonthlyRent / proposedMonthlyRent</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Current rent ($) vs proposed 1-year rate adjustment ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">leaseStartDate / currentLeaseEndDate</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Lease start date & 1-year anniversary date</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">daysUntilExpiration</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Days countdown until review / move-out</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">renewalStatus</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Auto-Renewing Month-to-Month, Review Pending, Notice Sent, Negotiating Terms, Tenant Accepted, Tenant Declined, Notice to Vacate Given</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">anniversaryDate / decisionDeadline</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">1-Year adjustment date & response deadline</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">noticeToVacate</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">object?</td><td style="padding: 4px 6px;">noticeDate, givenBy (Tenant/Landlord), minNoticeDays, effectiveVacateDate, totalNoticeDays, reason</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">tenantResponseNotes / internalNotes</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Feedback received & manager internal remarks</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 4: workorders -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            4. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">workorders</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Maintenance Tickets, Contractor Dispatches & Repairs</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / ticketNumber</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Unique ID & ticket code (e.g. <code>WO-1002</code>)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">title / description</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Issue headline & detailed description</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyId / roomId / isCommonArea</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string / bool</td><td style="padding: 4px 6px;">Target property, optional room ID, common area flag</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">reportedByName / Phone / Email</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Reporter tenant full name, phone and email</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">category</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Plumbing, HVAC / Heating, Electrical, Appliance, Locks & Access, Common Area, Room Fixtures, Pest Control, Deep Cleaning</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">priority / status</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Priority (Emergency/High/Med/Low) & Status (New/Assigned/In Progress/Scheduled/Completed)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">assignedVendorId / Name / Phone</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Assigned contractor coordinates</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">estimatedCost / actualCost</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Estimated budget ($) vs final invoice ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">dateReported / dateScheduled / dateCompleted</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Lifecycle milestones (ISO dates)</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">comments / timeline</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">array</td><td style="padding: 4px 6px;">Two-way message feed & status change audit log</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 5: leads -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            5. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">leads</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Applicant Pipeline & Roommate Screening CRM</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / firstName / lastName / name</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Lead ID & discrete name fields</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">email / phone</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Applicant contact coordinates</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">stage</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">New Lead, Contacted, Showing Scheduled, Application Received, Lease Signed, Lost</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">targetMoveInDate / maxBudget</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string / number</td><td style="padding: 4px 6px;">Desired move-in date & max rent budget ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">preferredBathroom / furnishingPreference</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Private Only/Shared OK, Furnished/Unfurnished</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">source / score</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string / number</td><td style="padding: 4px 6px;">Zillow, Craigslist, Roomies, Facebook, etc. & score (1-100)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">occupation / monthlyIncome / creditScoreRange</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string / number</td><td style="padding: 4px 6px;">Financial & employment qualification data</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">lifestyleProfile / activityHistory</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">obj / arr</td><td style="padding: 4px 6px;">Coliving compatibility profile & communication timeline log</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 6: contacts -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            6. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">contacts</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Unified Rolodex (Tenants, Vendors, Owners, Agents)</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / type</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Tenant, Lead, Vendor / Contractor, Property Owner, Emergency Contact, Leasing Agent</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">firstName / lastName / name</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">First name, last name, formatted full name</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">company / roleOrSpecialty</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Company name & trade/role specialty (e.g. Master Plumber)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">phone / secondaryPhone / email</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Contact numbers and email address</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyId / roomId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Unit occupancy or property assignment link</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">hourlyRate / rating / licenseNumber</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">num / str?</td><td style="padding: 4px 6px;">Contractor billing rate, 1-5 star rating, license code</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">emergencyContactName / Phone</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Next-of-kin emergency contact info for tenants</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">squareCustomerId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Square Customer ID synced via search/create Customers API</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">status / avatarBg</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Active, Past, Available 24/7 & avatar color class</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 7: activityLogs -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            7. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">activityLogs</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">System Audit Trail & Operations Log</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / timestamp</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Log ID & formatted date-time string</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">category</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Lease, Maintenance, Lead, Room, System</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">message / user</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Event description and author / admin name</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">entityId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Optional reference ID to affected record</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Collection 8: invoices -->
      <section style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 6px;">
          <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; font-family: monospace; margin: 0; color: #312e81;">
            8. Collection: <code style="background: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px;">invoices</code>
          </h2>
          <span style="font-size: 10px; color: #6b7280;">Square Payment Processing & Invoicing Orders</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #1f2937; font-weight: bold; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 26%;">Field Name</th>
              <th style="padding: 4px 6px; border-right: 1px solid #d1d5db; width: 14%; font-family: monospace; color: #4338ca;">Type</th>
              <th style="padding: 4px 6px;">Description / Allowed Values</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">id / subtask</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Invoice ID & subtask: rent, utility, supplies, late_fee, special</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">propertyId / propertyName / roomId / roomName</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Property & bedroom entity references</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">tenantId / tenantName / tenantEmail / tenantPhone</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Billed tenant contact details</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">squareLocationId / squareCustomerId</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string</td><td style="padding: 4px 6px;">Square Location & Customer references</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">squareOrderId / squareInvoiceId / squarePaymentUrl</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">string?</td><td style="padding: 4px 6px;">Square API created Order, Invoice ID and hosted checkout link</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">billingMonth / billingYear / dueDate</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">str / num</td><td style="padding: 4px 6px;">Billing cycle period & payment due date</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">rentAmount / utilityAmount / suppliesAmount / lateFeeAmount / specialAmount</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">number</td><td style="padding: 4px 6px;">Itemized financial line item components ($)</td></tr>
            <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">totalAmount / status</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">num / str</td><td style="padding: 4px 6px;">Total balance ($) & status: DRAFT, SENT, PAID, UNPAID, CANCELLED</td></tr>
            <tr><td style="padding: 4px 6px; font-family: monospace; font-weight: 600; border-right: 1px solid #d1d5db;">allowPartialPayments</td><td style="padding: 4px 6px; font-family: monospace; color: #4b5563; border-right: 1px solid #d1d5db;">boolean</td><td style="padding: 4px 6px;">Strictly false per policy (partial payments disabled)</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Document Footer -->
      <div style="padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #6b7280; font-family: monospace;">
        <span>Moyer Property Management • Firestore Security Rules & Blueprint Synced</span>
        <span>All 8 Collections Included</span>
      </div>
    `;
  };

  const handlePrint = () => {
    printHtmlDocument('Firestore_Schema_Moyer_Property_Management', getHtmlSchemaContent());
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-zinc-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-zinc-800 shrink-0">
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
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-zinc-800">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
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
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">totalRooms / occupiedRooms</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Total rentable room count vs currently occupied units</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">monthlyRevenueEstimate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Total estimated monthly rent ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">sharedAmenities / houseRules</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string[]</td><td className="p-1.5">Shared amenities & community guidelines</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">wifiNetwork / wifiPassword</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Resident Wi-Fi network SSID & access key</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">keypadMasterCode</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Front door smartlock / master keypad code</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">squareLocationId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Square Location ID linked for payment processing</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">notes / imageUrl</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Manager remarks & property cover image URL</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 2: rooms */}
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyName / roomNumber / name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Property display title, room number & full name</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">floor / sqft</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Level (Main, 2nd, Basement) & square footage</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">bathroomType</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Private Ensuite, Shared Bath, Jack & Jill Shared</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">isFurnished / monthlyRent / securityDeposit</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">bool / num</td><td className="p-1.5">Furnished status, monthly base rent ($), deposit ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">status</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5 font-bold text-indigo-900">Occupied, Available, Under Turnover, Reserved</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantFirstName / LastName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active resident first & last names</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentTenantName / Phone / Email</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Active resident full name, phone number, email</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">leaseStartDate / leaseEndDate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Lease term dates (ISO <code>YYYY-MM-DD</code>)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">turnoverChecklist</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">array</td><td className="p-1.5">Tasks list with <code>id</code>, <code>task</code>, <code>isDone</code></td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">utilitiesIncluded / amenities</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string[]</td><td className="p-1.5">Included utilities & private in-room amenities</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 3: renewals */}
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantFirstName / LastName / Name</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Discrete first, last, and formatted full names</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantName / Email / Phone</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Full name, email address, and mobile number</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyId / roomId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Foreign keys to Property and Room records</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyName / roomName</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Denormalized unit location titles</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">currentMonthlyRent / proposedMonthlyRent</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Current rent ($) vs proposed 1-year rate adjustment ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">leaseStartDate / currentLeaseEndDate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Original lease commencement & anniversary date</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">daysUntilExpiration</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Days countdown until review / move-out</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">renewalStatus</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Auto-Renewing Month-to-Month, Review Pending, Notice Sent, Negotiating Terms, Tenant Accepted, Tenant Declined, Notice to Vacate Given</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">anniversaryDate / decisionDeadline</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">1-Year adjustment date & response deadline</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">noticeToVacate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">object?</td><td className="p-1.5">noticeDate, givenBy (Tenant/Landlord), minNoticeDays, effectiveVacateDate, totalNoticeDays, reason</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">tenantResponseNotes / internalNotes</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Feedback received & manager internal remarks</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 4: workorders */}
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">reportedByName / Phone / Email</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Reporter resident name and contact info</td></tr>
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
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">stage</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">New Lead, Contacted, Showing Scheduled, Application Received, Lease Signed, Lost</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">targetMoveInDate / maxBudget</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Desired move-in date & max rent budget ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">preferredBathroom / furnishingPreference</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Private Only/Shared OK, Furnished/Unfurnished</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">source / score</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Zillow, Craigslist, Roomies, Facebook, etc. & score (1-100)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">occupation / monthlyIncome / creditScoreRange</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string / number</td><td className="p-1.5">Financial & employment qualification data</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">lifestyleProfile / activityHistory</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">obj / arr</td><td className="p-1.5">Coliving compatibility & communication timeline log</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 6: contacts */}
          <section className="space-y-2">
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">squareCustomerId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Square Customer ID synced via search/create Customers API</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">status / avatarBg</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Active, Past, Available 24/7 & avatar color class</td></tr>
              </tbody>
            </table>
          </section>

          {/* Collection 7: activityLogs */}
          <section className="space-y-2">
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

          {/* Collection 8: invoices */}
          <section className="space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 font-mono">
                8. Collection: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">invoices</code>
              </h2>
              <span className="text-[11px] text-zinc-500">Square Payment Processing & Invoicing Orders</span>
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
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">id / subtask</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Invoice ID & subtask: rent, utility, supplies, late_fee, special</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">propertyId / roomId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Entity relational references</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">squareLocationId / squareCustomerId</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string</td><td className="p-1.5">Square Location & Customer API identifiers</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">squareOrderId / squareInvoiceId / squarePaymentUrl</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">string?</td><td className="p-1.5">Square created Order, Invoice ID & hosted checkout link</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">billingMonth / billingYear / dueDate</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">str / num</td><td className="p-1.5">Billing cycle and due date</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">rentAmount / utilityAmount / suppliesAmount / lateFeeAmount / specialAmount</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">number</td><td className="p-1.5">Component charges ($)</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">totalAmount / status</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">num / str</td><td className="p-1.5">Total balance & status: DRAFT, SENT, PAID, UNPAID, CANCELLED</td></tr>
                <tr><td className="p-1.5 font-mono font-semibold border-r border-zinc-300">allowPartialPayments</td><td className="p-1.5 font-mono text-zinc-600 border-r border-zinc-300">boolean</td><td className="p-1.5">Strictly false per policy (partial payments disabled)</td></tr>
              </tbody>
            </table>
          </section>

          {/* Document Footer */}
          <div className="pt-4 border-t border-zinc-300 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>Moyer Property Management • Firestore Security Rules & Blueprint Synced</span>
            <span>All 8 Collections Included</span>
          </div>
        </div>

        {/* Modal Footer (hidden in print) */}
        <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-zinc-500 font-medium">
            Formatted for standard 8.5 x 11 in. Letter printing and PDF export
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
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
