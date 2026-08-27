import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to get Cloudflare D1 credentials
function getD1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || "";
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID?.trim() || "";
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() || "";

  const isConfigured = Boolean(accountId && databaseId && apiToken);
  return { accountId, databaseId, apiToken, isConfigured };
}

// Helper to execute query against Cloudflare D1 REST API
async function executeD1Query(sql: string, params: any[] = []) {
  const { accountId, databaseId, apiToken, isConfigured } = getD1Config();

  if (!isConfigured) {
    throw new Error(
      "Cloudflare D1 credentials missing. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_API_TOKEN in environment variables."
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sql,
      params
    })
  });

  const data: any = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data?.errors?.map((e: any) => `${e.message} (code ${e.code})`).join("; ") || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Cloudflare D1 API error: ${errorMsg}`);
  }

  // data.result is an array of result objects
  const firstResult = data.result?.[0] || { results: [], meta: {} };
  return {
    rows: firstResult.results || [],
    meta: firstResult.meta || {},
    raw: data
  };
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health & System Info
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Moyer Property Management CRM - Cloudflare D1 Backend"
  });
});

// Cloudflare D1 Status & Diagnostics
app.get("/api/d1/status", async (_req: Request, res: Response) => {
  const { accountId, databaseId, isConfigured } = getD1Config();

  if (!isConfigured) {
    return res.json({
      configured: false,
      connected: false,
      message: "Cloudflare D1 credentials not configured.",
      details: {
        hasAccountId: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
        hasDatabaseId: Boolean(process.env.CLOUDFLARE_DATABASE_ID),
        hasApiToken: Boolean(process.env.CLOUDFLARE_API_TOKEN),
        accountIdPreview: accountId ? `${accountId.slice(0, 6)}...` : null,
        databaseIdPreview: databaseId ? `${databaseId.slice(0, 8)}...` : null
      }
    });
  }

  const startTime = Date.now();
  try {
    // Ping query
    const pingResult = await executeD1Query("SELECT 1 as ping, datetime('now') as server_time;");
    const latency = Date.now() - startTime;

    // Check existing tables
    const tablesResult = await executeD1Query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
    );
    const existingTables = (tablesResult.rows || []).map((r: any) => r.name);

    // Get count of records in existing tables
    const tableCounts: Record<string, number> = {};
    for (const tbl of existingTables) {
      try {
        const countRes = await executeD1Query(`SELECT count(*) as count FROM ${tbl};`);
        tableCounts[tbl] = countRes.rows[0]?.count || 0;
      } catch {
        tableCounts[tbl] = 0;
      }
    }

    return res.json({
      configured: true,
      connected: true,
      latencyMs: latency,
      databaseId: databaseId,
      accountId: accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : "",
      serverTime: pingResult.rows[0]?.server_time || new Date().toISOString(),
      tables: existingTables,
      tableCounts,
      schemaReady: [
        "properties",
        "rooms",
        "renewals",
        "work_orders",
        "leads",
        "contacts",
        "activity_logs"
      ].every((t) => existingTables.includes(t))
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      connected: false,
      error: err.message || "Failed to communicate with Cloudflare D1"
    });
  }
});

// Initialize / Migrate D1 SQL Schema
app.post("/api/d1/init-schema", async (_req: Request, res: Response) => {
  try {
    const d1SchemaSql = `
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip TEXT NOT NULL,
        total_rooms INTEGER NOT NULL,
        property_type TEXT,
        target_occupancy_percent REAL,
        monthly_target_revenue REAL,
        notes TEXT,
        manager_name TEXT,
        manager_phone TEXT,
        manager_email TEXT,
        amenities TEXT,
        image_url TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        property_name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        room_name TEXT NOT NULL,
        floor TEXT,
        bathroom_type TEXT,
        dimensions TEXT,
        sq_ft INTEGER,
        target_rent REAL NOT NULL,
        current_rent REAL,
        deposit_amount REAL,
        status TEXT NOT NULL,
        tenant_name TEXT,
        tenant_email TEXT,
        tenant_phone TEXT,
        lease_start TEXT,
        lease_end TEXT,
        payment_status TEXT,
        notes TEXT,
        features TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS renewals (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        tenant_name TEXT NOT NULL,
        tenant_email TEXT NOT NULL,
        tenant_phone TEXT NOT NULL,
        property_name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        lease_end_date TEXT NOT NULL,
        days_until_expiration INTEGER,
        current_rent REAL NOT NULL,
        proposed_rent REAL NOT NULL,
        rent_increase_percent REAL,
        status TEXT NOT NULL,
        proposed_term_months INTEGER,
        last_notice_sent_date TEXT,
        notice_count INTEGER,
        tenant_response_notes TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        ticket_number TEXT NOT NULL,
        property_id TEXT NOT NULL,
        property_name TEXT NOT NULL,
        room_id TEXT,
        room_number TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        reporter_type TEXT NOT NULL,
        reporter_contact TEXT,
        reported_date TEXT NOT NULL,
        assigned_vendor_id TEXT,
        assigned_vendor_name TEXT,
        vendor_category TEXT,
        vendor_phone TEXT,
        vendor_rate REAL,
        scheduled_date TEXT,
        completed_date TEXT,
        actual_cost REAL,
        permission_to_enter INTEGER,
        access_code TEXT,
        resolution_notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        preferred_property_id TEXT,
        preferred_property_name TEXT,
        desired_move_in_date TEXT,
        budget_max REAL,
        stage TEXT NOT NULL,
        source TEXT,
        assigned_agent TEXT,
        background_check_status TEXT,
        credit_score INTEGER,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        company TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        secondary_phone TEXT,
        property_id TEXT,
        property_name TEXT,
        room_id TEXT,
        room_name TEXT,
        role_or_specialty TEXT,
        address TEXT,
        status TEXT NOT NULL,
        hourly_rate REAL,
        rating REAL,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        notes TEXT,
        payment_status TEXT,
        avatar_bg TEXT,
        license_number TEXT,
        commission_rate TEXT,
        assigned_properties TEXT,
        assigned_property_names TEXT,
        active_listings_count INTEGER,
        trade_category TEXT,
        emergency_available INTEGER,
        insurance_policy_expiry TEXT,
        w9_on_record INTEGER,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_id TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT
      );
    `;

    // Execute batch creation
    await executeD1Query(d1SchemaSql);

    res.json({
      success: true,
      message: "Cloudflare D1 tables initialized successfully!"
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to initialize Cloudflare D1 schema"
    });
  }
});

// Run Custom SQL Query on Cloudflare D1
app.post("/api/d1/query", async (req: Request, res: Response) => {
  const { sql, params = [] } = req.body;
  if (!sql || typeof sql !== "string") {
    return res.status(400).json({ error: "Missing SQL string in request body" });
  }

  try {
    const result = await executeD1Query(sql, params);
    res.json({
      success: true,
      rows: result.rows,
      meta: result.meta
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Cloudflare D1 query execution error"
    });
  }
});

// Pull Full Dataset from Cloudflare D1
app.get("/api/d1/sync/pull", async (_req: Request, res: Response) => {
  try {
    const [
      propRes,
      roomsRes,
      renewalsRes,
      woRes,
      leadsRes,
      contactsRes,
      logsRes
    ] = await Promise.all([
      executeD1Query("SELECT * FROM properties;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM rooms;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM renewals;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM work_orders;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM leads;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM contacts;").catch(() => ({ rows: [] })),
      executeD1Query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100;").catch(() => ({ rows: [] }))
    ]);

    // Map properties
    const properties = propRes.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      totalRooms: Number(p.total_rooms) || 0,
      propertyType: p.property_type || "Coliving Manor",
      targetOccupancyPercent: Number(p.target_occupancy_percent) || 100,
      monthlyTargetRevenue: Number(p.monthly_target_revenue) || 0,
      notes: p.notes || "",
      managerName: p.manager_name || "",
      managerPhone: p.manager_phone || "",
      managerEmail: p.manager_email || "",
      amenities: p.amenities ? JSON.parse(p.amenities) : [],
      imageUrl: p.image_url
    }));

    // Map rooms
    const rooms = roomsRes.rows.map((r: any) => ({
      id: r.id,
      propertyId: r.property_id,
      propertyName: r.property_name,
      roomNumber: r.room_number,
      roomName: r.room_name,
      floor: r.floor,
      bathroomType: r.bathroom_type,
      dimensions: r.dimensions,
      sqFt: Number(r.sq_ft) || 0,
      targetRent: Number(r.target_rent) || 0,
      currentRent: r.current_rent ? Number(r.current_rent) : undefined,
      depositAmount: r.deposit_amount ? Number(r.deposit_amount) : undefined,
      status: r.status,
      tenantName: r.tenant_name,
      tenantEmail: r.tenant_email,
      tenantPhone: r.tenant_phone,
      leaseStart: r.lease_start,
      leaseEnd: r.lease_end,
      paymentStatus: r.payment_status,
      notes: r.notes || "",
      features: r.features ? JSON.parse(r.features) : []
    }));

    // Map renewals
    const renewals = renewalsRes.rows.map((ren: any) => ({
      id: ren.id,
      roomId: ren.room_id,
      propertyId: ren.property_id,
      tenantName: ren.tenant_name,
      tenantEmail: ren.tenant_email,
      tenantPhone: ren.tenant_phone,
      propertyName: ren.property_name,
      roomNumber: ren.room_number,
      leaseEndDate: ren.lease_end_date,
      daysUntilExpiration: Number(ren.days_until_expiration) || 0,
      currentRent: Number(ren.current_rent) || 0,
      proposedRent: Number(ren.proposed_rent) || 0,
      rentIncreasePercent: Number(ren.rent_increase_percent) || 0,
      status: ren.status,
      proposedTermMonths: Number(ren.proposed_term_months) || 12,
      lastNoticeSentDate: ren.last_notice_sent_date,
      noticeCount: Number(ren.notice_count) || 0,
      tenantResponseNotes: ren.tenant_response_notes,
      notes: ren.notes || ""
    }));

    // Map work orders
    const workOrders = woRes.rows.map((w: any) => ({
      id: w.id,
      ticketNumber: w.ticket_number,
      propertyId: w.property_id,
      propertyName: w.property_name,
      roomId: w.room_id,
      roomNumber: w.room_number,
      title: w.title,
      description: w.description,
      category: w.category,
      priority: w.priority,
      status: w.status,
      reportedBy: w.reported_by,
      reporterType: w.reporter_type,
      reporterContact: w.reporter_contact,
      reportedDate: w.reported_date,
      assignedVendorId: w.assigned_vendor_id,
      assignedVendorName: w.assigned_vendor_name,
      vendorCategory: w.vendor_category,
      vendorPhone: w.vendor_phone,
      vendorRate: w.vendor_rate ? Number(w.vendor_rate) : undefined,
      scheduledDate: w.scheduled_date,
      completedDate: w.completed_date,
      actualCost: w.actual_cost ? Number(w.actual_cost) : undefined,
      permissionToEnter: Boolean(w.permission_to_enter),
      accessCode: w.access_code,
      resolutionNotes: w.resolution_notes
    }));

    // Map leads
    const leads = leadsRes.rows.map((l: any) => ({
      id: l.id,
      fullName: l.full_name,
      email: l.email,
      phone: l.phone,
      preferredPropertyId: l.preferred_property_id,
      preferredPropertyName: l.preferred_property_name,
      desiredMoveInDate: l.desired_move_in_date,
      budgetMax: Number(l.budget_max) || 0,
      stage: l.stage,
      source: l.source,
      assignedAgent: l.assigned_agent,
      backgroundCheckStatus: l.background_check_status,
      creditScore: l.credit_score ? Number(l.credit_score) : undefined,
      notes: l.notes || ""
    }));

    // Map contacts
    const contacts = contactsRes.rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      company: c.company,
      email: c.email,
      phone: c.phone,
      secondaryPhone: c.secondary_phone,
      propertyId: c.property_id,
      propertyName: c.property_name,
      roomId: c.room_id,
      roomName: c.room_name,
      roleOrSpecialty: c.role_or_specialty,
      address: c.address,
      status: c.status,
      hourlyRate: c.hourly_rate ? Number(c.hourly_rate) : undefined,
      rating: c.rating ? Number(c.rating) : undefined,
      emergencyContactName: c.emergency_contact_name,
      emergencyContactPhone: c.emergency_contact_phone,
      notes: c.notes || "",
      paymentStatus: c.payment_status,
      avatarBg: c.avatar_bg || "bg-indigo-600",
      licenseNumber: c.license_number,
      commissionRate: c.commission_rate,
      assignedProperties: c.assigned_properties ? JSON.parse(c.assigned_properties) : undefined,
      assignedPropertyNames: c.assigned_property_names ? JSON.parse(c.assigned_property_names) : undefined,
      activeListingsCount: c.active_listings_count ? Number(c.active_listings_count) : undefined,
      tradeCategory: c.trade_category,
      emergencyAvailable: Boolean(c.emergency_available),
      insurancePolicyExpiry: c.insurance_policy_expiry,
      w9OnRecord: Boolean(c.w9_on_record)
    }));

    // Map activity logs
    const activityLogs = logsRes.rows.map((log: any) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      entityId: log.entity_id,
      timestamp: log.timestamp
    }));

    res.json({
      success: true,
      data: {
        properties,
        rooms,
        renewals,
        workOrders,
        leads,
        contacts,
        activityLogs
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to pull dataset from Cloudflare D1"
    });
  }
});

// Push / Sync Full Dataset to Cloudflare D1
app.post("/api/d1/sync/push", async (req: Request, res: Response) => {
  const {
    properties = [],
    rooms = [],
    renewals = [],
    workOrders = [],
    leads = [],
    contacts = [],
    activityLogs = []
  } = req.body;

  try {
    const now = new Date().toISOString();

    // 1. Properties
    for (const p of properties) {
      await executeD1Query(
        `INSERT OR REPLACE INTO properties (
          id, name, address, city, state, zip, total_rooms, property_type,
          target_occupancy_percent, monthly_target_revenue, notes,
          manager_name, manager_phone, manager_email, amenities, image_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          p.id,
          p.name,
          p.address,
          p.city,
          p.state,
          p.zip,
          p.totalRooms || 0,
          p.propertyType || "Coliving Manor",
          p.targetOccupancyPercent || 100,
          p.monthlyTargetRevenue || 0,
          p.notes || "",
          p.managerName || "",
          p.managerPhone || "",
          p.managerEmail || "",
          JSON.stringify(p.amenities || []),
          p.imageUrl || "",
          now
        ]
      );
    }

    // 2. Rooms
    for (const r of rooms) {
      await executeD1Query(
        `INSERT OR REPLACE INTO rooms (
          id, property_id, property_name, room_number, room_name, floor,
          bathroom_type, dimensions, sq_ft, target_rent, current_rent,
          deposit_amount, status, tenant_name, tenant_email, tenant_phone,
          lease_start, lease_end, payment_status, notes, features, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          r.id,
          r.propertyId,
          r.propertyName,
          r.roomNumber,
          r.roomName,
          r.floor || "",
          r.bathroomType || "",
          r.dimensions || "",
          r.sqFt || 0,
          r.targetRent || 0,
          r.currentRent || null,
          r.depositAmount || null,
          r.status,
          r.tenantName || null,
          r.tenantEmail || null,
          r.tenantPhone || null,
          r.leaseStart || null,
          r.leaseEnd || null,
          r.paymentStatus || null,
          r.notes || "",
          JSON.stringify(r.features || []),
          now
        ]
      );
    }

    // 3. Renewals
    for (const ren of renewals) {
      await executeD1Query(
        `INSERT OR REPLACE INTO renewals (
          id, room_id, property_id, tenant_name, tenant_email, tenant_phone,
          property_name, room_number, lease_end_date, days_until_expiration,
          current_rent, proposed_rent, rent_increase_percent, status,
          proposed_term_months, last_notice_sent_date, notice_count,
          tenant_response_notes, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          ren.id,
          ren.roomId,
          ren.propertyId,
          ren.tenantName,
          ren.tenantEmail,
          ren.tenantPhone,
          ren.propertyName,
          ren.roomNumber,
          ren.leaseEndDate,
          ren.daysUntilExpiration || 0,
          ren.currentRent,
          ren.proposedRent,
          ren.rentIncreasePercent || 0,
          ren.status,
          ren.proposedTermMonths || 12,
          ren.lastNoticeSentDate || null,
          ren.noticeCount || 0,
          ren.tenantResponseNotes || null,
          ren.notes || "",
          now
        ]
      );
    }

    // 4. Work Orders
    for (const w of workOrders) {
      await executeD1Query(
        `INSERT OR REPLACE INTO work_orders (
          id, ticket_number, property_id, property_name, room_id, room_number,
          title, description, category, priority, status, reported_by,
          reporter_type, reporter_contact, reported_date, assigned_vendor_id,
          assigned_vendor_name, vendor_category, vendor_phone, vendor_rate,
          scheduled_date, completed_date, actual_cost, permission_to_enter,
          access_code, resolution_notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          w.id,
          w.ticketNumber,
          w.propertyId,
          w.propertyName,
          w.roomId || null,
          w.roomNumber || null,
          w.title,
          w.description,
          w.category,
          w.priority,
          w.status,
          w.reportedBy,
          w.reporterType,
          w.reporterContact || null,
          w.reportedDate,
          w.assignedVendorId || null,
          w.assignedVendorName || null,
          w.vendorCategory || null,
          w.vendorPhone || null,
          w.vendorRate || null,
          w.scheduledDate || null,
          w.completedDate || null,
          w.actualCost || null,
          w.permissionToEnter ? 1 : 0,
          w.accessCode || null,
          w.resolutionNotes || null,
          now
        ]
      );
    }

    // 5. Leads
    for (const l of leads) {
      await executeD1Query(
        `INSERT OR REPLACE INTO leads (
          id, full_name, email, phone, preferred_property_id,
          preferred_property_name, desired_move_in_date, budget_max,
          stage, source, assigned_agent, background_check_status,
          credit_score, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          l.id,
          l.fullName,
          l.email,
          l.phone,
          l.preferredPropertyId || null,
          l.preferredPropertyName || null,
          l.desiredMoveInDate || null,
          l.budgetMax || 0,
          l.stage,
          l.source || null,
          l.assignedAgent || null,
          l.backgroundCheckStatus || null,
          l.creditScore || null,
          l.notes || "",
          now
        ]
      );
    }

    // 6. Contacts
    for (const c of contacts) {
      await executeD1Query(
        `INSERT OR REPLACE INTO contacts (
          id, name, type, company, email, phone, secondary_phone,
          property_id, property_name, room_id, room_name, role_or_specialty,
          address, status, hourly_rate, rating, emergency_contact_name,
          emergency_contact_phone, notes, payment_status, avatar_bg,
          license_number, commission_rate, assigned_properties,
          assigned_property_names, active_listings_count, trade_category,
          emergency_available, insurance_policy_expiry, w9_on_record, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          c.id,
          c.name,
          c.type,
          c.company || null,
          c.email,
          c.phone,
          c.secondaryPhone || null,
          c.propertyId || null,
          c.propertyName || null,
          c.roomId || null,
          c.roomName || null,
          c.roleOrSpecialty || null,
          c.address || null,
          c.status,
          c.hourlyRate || null,
          c.rating || null,
          c.emergencyContactName || null,
          c.emergencyContactPhone || null,
          c.notes || "",
          c.paymentStatus || null,
          c.avatarBg || "bg-indigo-600",
          c.licenseNumber || null,
          c.commissionRate || null,
          c.assignedProperties ? JSON.stringify(c.assignedProperties) : null,
          c.assignedPropertyNames ? JSON.stringify(c.assignedPropertyNames) : null,
          c.activeListingsCount || null,
          c.tradeCategory || null,
          c.emergencyAvailable ? 1 : 0,
          c.insurancePolicyExpiry || null,
          c.w9OnRecord ? 1 : 0,
          now
        ]
      );
    }

    // 7. Activity Logs
    for (const log of activityLogs.slice(0, 50)) {
      await executeD1Query(
        `INSERT OR REPLACE INTO activity_logs (id, actor, action, entity_id, timestamp, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          log.id,
          log.actor,
          log.action,
          log.entityId || null,
          log.timestamp,
          now
        ]
      );
    }

    res.json({
      success: true,
      message: "Data successfully synced to Cloudflare D1 Database!",
      syncedCounts: {
        properties: properties.length,
        rooms: rooms.length,
        renewals: renewals.length,
        workOrders: workOrders.length,
        leads: leads.length,
        contacts: contacts.length,
        activityLogs: activityLogs.length
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to push dataset to Cloudflare D1"
    });
  }
});

// Single Record Mutation Proxies
app.post("/api/d1/upsert/:table", async (req: Request, res: Response) => {
  const { table } = req.params;
  const item = req.body;

  const validTables = ["properties", "rooms", "renewals", "work_orders", "leads", "contacts", "activity_logs"];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: `Invalid table name: ${table}` });
  }

  try {
    const keys = Object.keys(item);
    if (keys.length === 0) {
      return res.status(400).json({ error: "Empty payload" });
    }

    const placeholders = keys.map(() => "?").join(", ");
    const columns = keys.join(", ");
    const values = keys.map((k) => {
      const val = item[k];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }
      if (typeof val === "boolean") {
        return val ? 1 : 0;
      }
      return val;
    });

    const sql = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders});`;
    await executeD1Query(sql, values);

    res.json({ success: true, table, id: item.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/d1/delete/:table/:id", async (req: Request, res: Response) => {
  const { table, id } = req.params;
  const validTables = ["properties", "rooms", "renewals", "work_orders", "leads", "contacts", "activity_logs"];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: `Invalid table name: ${table}` });
  }

  try {
    await executeD1Query(`DELETE FROM ${table} WHERE id = ?;`, [id]);
    res.json({ success: true, table, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Frontend Middleware / Static Server
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Moyer Property Management CRM server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
