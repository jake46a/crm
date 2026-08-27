# Security Specification & Threat Model (Firestore Rules)

## 1. Data Invariants
- A Room cannot exist without a valid `propertyId` and `monthlyRent >= 0`.
- A LeaseRenewal cannot exist without referencing a valid `propertyId` and `roomId`.
- A WorkOrder requires a valid `propertyId`, a priority in `['Emergency', 'High', 'Medium', 'Low']`, and a non-empty `title`.
- A TenantLead requires a valid `name`, `email`, and `phone`.
- A Contact requires a valid `type`, `name`, and contact details.
- ActivityLogs are append-only audit entries; updates/deletions are blocked.
- String fields and collection payloads must adhere to strict volumetric boundaries to prevent Denial-of-Wallet attacks.
- IDs must strictly match `^[a-zA-Z0-9_\-]+$` with max size 128 chars.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Write**: Write attempt to `/properties/p-malicious` without auth token (`request.auth == null`). Expected: PERMISSION_DENIED.
2. **ID Poisoning / Path Traversal**: Document ID containing `/../../` or >128 chars. Expected: PERMISSION_DENIED.
3. **Negative Rent Attack**: Write room with `monthlyRent: -5000`. Expected: PERMISSION_DENIED.
4. **Denial-of-Wallet Payload**: Field with >1MB string payload in `notes` or `description`. Expected: PERMISSION_DENIED.
5. **Ghost Field Injection**: Attempt to create property with undeclared root fields (`maliciousPayload: true`). Expected: PERMISSION_DENIED.
6. **Activity Log Mutation**: Attempt to update an existing audit log document. Expected: PERMISSION_DENIED.
7. **Lead Stage Spoofing**: Attempt to insert lead without required `stage` or `name`. Expected: PERMISSION_DENIED.
8. **Work Order Priority Escalation**: Invalid enum value for priority (`priority: 'SuperUrgentCrash'`). Expected: PERMISSION_DENIED.
9. **Blanket Query Scraping**: Collection query without filter or unauthorized access. Expected: PERMISSION_DENIED.
10. **Admin Escalation**: Attempting to self-grant admin claim in client payload. Expected: PERMISSION_DENIED.
11. **Orphaned Room Creation**: Room document with blank `propertyId`. Expected: PERMISSION_DENIED.
12. **Timestamp Tampering**: Setting `createdAt` or `timestamp` to client-spoofed past/future dates instead of server timestamp. Expected: PERMISSION_DENIED.
