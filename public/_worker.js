// functions/api/[[path]].ts
var SQUARE_VERSION = "2025-02-20";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  "Access-Control-Max-Age": "86400"
};
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  const authHeader = request.headers.get("Authorization") || "";
  const customHeaderToken = request.headers.get("x-square-access-token") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.substring(7).trim() : "";
  const accessToken = (env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || bearerToken || customHeaderToken || "").trim();
  const applicationId = (env.SQUARE_APPLICATION_ID || env.VITE_SQUARE_APPLICATION_ID || "").trim();
  const squareEnv = (env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || "production").toLowerCase();
  const defaultLocationId = (env.SQUARE_DEFAULT_LOCATION_ID || env.VITE_SQUARE_DEFAULT_LOCATION_ID || "LN4WBHANNNZ2Y").trim();
  const isProduction = squareEnv === "production" || squareEnv === "prod";
  const baseUrl = isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  const squareHeaders = {
    "Square-Version": SQUARE_VERSION,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
  if (pathname === "/api/square/status" && request.method === "GET") {
    const hasToken = accessToken.length > 5;
    const tokenSource = env.SQUARE_ACCESS_TOKEN ? "cloudflare_secret" : env.VITE_SQUARE_ACCESS_TOKEN ? "cloudflare_vite_env" : bearerToken ? "request_bearer" : "none";
    return jsonResponse({
      hasToken,
      applicationId: applicationId || null,
      defaultLocationId,
      environment: isProduction ? "production" : "sandbox",
      baseUrl,
      version: SQUARE_VERSION,
      mode: isProduction ? hasToken ? "Production (Live API)" : "Production (Awaiting SQUARE_ACCESS_TOKEN in Cloudflare)" : hasToken ? "Sandbox (Connected on Cloudflare)" : "Sandbox Mode",
      isProduction,
      platform: "cloudflare-pages",
      tokenSource,
      activeLocationsCount: 3
    });
  }
  if (pathname === "/api/square/mode" && request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const targetMode = body.mode === "sandbox" ? "sandbox" : "production";
      const targetBaseUrl = targetMode === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
      return jsonResponse({
        success: true,
        environment: targetMode,
        baseUrl: targetBaseUrl,
        version: SQUARE_VERSION,
        mode: targetMode === "production" ? "Production (Live API)" : "Sandbox Mode",
        isProduction: targetMode === "production",
        hasToken: accessToken.length > 5,
        note: "Note: To permanently set production mode on Cloudflare, set SQUARE_ENVIRONMENT=production in your Cloudflare Pages dashboard."
      });
    } catch {
      return jsonResponse({ success: false, error: "Invalid request" }, 400);
    }
  }
  if (pathname === "/api/square/locations" && request.method === "GET") {
    if (accessToken) {
      try {
        const sqRes = await fetch(`${baseUrl}/v2/locations`, { headers: squareHeaders });
        const data = await sqRes.json();
        if (sqRes.ok && data.locations) {
          return jsonResponse({
            locations: data.locations.map((loc) => ({
              id: loc.id,
              name: loc.name || "Square Merchant Location",
              address: loc.address || {},
              status: loc.status || "ACTIVE"
            })),
            source: "square_live_api"
          });
        }
      } catch (err) {
        console.warn("Square locations fetch failed on Cloudflare, using fallback:", err);
      }
    }
    return jsonResponse({
      locations: [
        { id: "LN4WBHANNNZ2Y", name: "1070 (1070 Yank St, Golden, CO)", address: { address_line_1: "1070 Yank St", locality: "Golden", administrative_district_level_1: "CO", postal_code: "80401-4223" }, status: "ACTIVE" },
        { id: "S2C67DJTB5S53", name: "PWA (ProWeb.Agency)", address: { address_line_1: "1070 Yank St", locality: "Golden", administrative_district_level_1: "CO", postal_code: "80401" }, status: "ACTIVE" },
        { id: "LW2PEV9NMHM5Q", name: "christinescollectibles.com", address: { address_line_1: "1070 Yank St", locality: "Golden", administrative_district_level_1: "CO", postal_code: "80401-4223" }, status: "ACTIVE" }
      ],
      source: "simulated"
    });
  }
  if (pathname === "/api/square/diagnostics") {
    let body = {};
    if (request.method === "POST") {
      body = await request.json().catch(() => ({}));
    }
    const locationIdToCheck = (body.locationId || url.searchParams.get("locationId") || defaultLocationId).trim();
    const envToCheck = (body.environment || url.searchParams.get("environment") || squareEnv).toLowerCase().trim();
    const isTargetProd = envToCheck === "production" || envToCheck === "prod";
    const targetBaseUrl = isTargetProd ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const logs = [];
    const timestamp = () => (/* @__PURE__ */ new Date()).toISOString().substring(11, 19);
    logs.push(`[${timestamp()}] Initializing Square API Diagnostics on Cloudflare Pages...`);
    logs.push(`[${timestamp()}] Active Environment: ${isTargetProd ? "PRODUCTION" : "SANDBOX"}`);
    logs.push(`[${timestamp()}] Square Base URL: ${targetBaseUrl}`);
    logs.push(`[${timestamp()}] Target Location ID to verify: ${locationIdToCheck || "(None specified)"}`);
    const hasToken = accessToken.length > 5;
    const maskedToken = hasToken ? `${accessToken.substring(0, 6)}...${accessToken.substring(accessToken.length - 4)} (Length: ${accessToken.length})` : "No Token Configured";
    logs.push(`[${timestamp()}] Access Token status: ${hasToken ? "Present" : "MISSING"} [${maskedToken}]`);
    let merchantInfo = null;
    let locationsList = [];
    let targetLocationDetails = null;
    let apiPingOk = false;
    let apiPingStatus = 0;
    let apiError = null;
    let isPlaceholderLocation = false;
    const knownPlaceholders = ["LOC_SPEER", "LOC_CAPHILL", "LOC_HIGHLANDS", "LOC_DEMO", "LOC_SAMPLE"];
    if (knownPlaceholders.includes(locationIdToCheck.toUpperCase())) {
      isPlaceholderLocation = true;
      logs.push(`[${timestamp()}] \u26A0\uFE0F WARNING: Location ID "${locationIdToCheck}" is an internal placeholder, NOT a real Square Merchant Location ID!`);
    }
    if (hasToken) {
      const headers = {
        "Square-Version": SQUARE_VERSION,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      };
      try {
        const startTime = Date.now();
        logs.push(`[${timestamp()}] Sending GET ${targetBaseUrl}/v2/locations to verify connectivity & list merchant locations...`);
        const locRes = await fetch(`${targetBaseUrl}/v2/locations`, { headers });
        apiPingStatus = locRes.status;
        const duration = Date.now() - startTime;
        if (locRes.ok) {
          apiPingOk = true;
          const locData = await locRes.json();
          locationsList = locData.locations || [];
          logs.push(`[${timestamp()}] HTTP 200 OK (${duration}ms): Found ${locationsList.length} live location(s) on Square.`);
          if (locationsList.length > 0) {
            const firstLoc = locationsList[0];
            merchantInfo = {
              merchantId: firstLoc.merchant_id || "N/A",
              businessName: firstLoc.business_name || firstLoc.name || "Moyer Property Management",
              country: firstLoc.country || "US",
              currency: firstLoc.currency || "USD"
            };
            logs.push(`[${timestamp()}] Merchant Account: "${merchantInfo.businessName}" (ID: ${merchantInfo.merchantId}, Currency: ${merchantInfo.currency})`);
          }
          const match = locationsList.find((l) => l.id === locationIdToCheck);
          if (match) {
            targetLocationDetails = {
              id: match.id,
              name: match.name,
              businessName: match.business_name,
              status: match.status,
              address: match.address,
              currency: match.currency,
              capabilities: match.capabilities || [],
              isCreditCardProcessing: (match.capabilities || []).includes("CREDIT_CARD_PROCESSING")
            };
            logs.push(`[${timestamp()}] \u2705 Location ID "${locationIdToCheck}" VERIFIED on Square:`);
            logs.push(`[${timestamp()}]    Name: "${match.name}" | Status: ${match.status} | Capabilities: ${(match.capabilities || []).join(", ")}`);
          } else {
            logs.push(`[${timestamp()}] \u274C Location ID "${locationIdToCheck}" was NOT found among the merchant's ${locationsList.length} active Square locations!`);
            logs.push(`[${timestamp()}]    Available Location IDs on Square: ${locationsList.map((l) => `${l.name} (${l.id})`).join(", ")}`);
          }
        } else {
          const errorData = await locRes.json().catch(() => ({}));
          apiError = errorData?.errors?.map((e) => `${e.code}: ${e.detail}`).join("; ") || `HTTP ${locRes.status}`;
          logs.push(`[${timestamp()}] \u274C Square API Error (HTTP ${locRes.status}): ${apiError}`);
        }
      } catch (err) {
        apiError = err?.message || "Network fetch failed";
        logs.push(`[${timestamp()}] \u274C Network error while communicating with Square: ${apiError}`);
      }
    } else {
      logs.push(`[${timestamp()}] \u26A0\uFE0F Cannot test live Square API: No Access Token configured.`);
    }
    const causesOf404 = [];
    let is404Risk = false;
    if (!hasToken) {
      is404Risk = true;
      causesOf404.push("Missing Access Token: When invoices are generated without a live Square token, authentic payment links cannot be minted.");
    }
    if (isPlaceholderLocation) {
      is404Risk = true;
      causesOf404.push(`Invalid Location ID "${locationIdToCheck}": Square API rejects invoice creation for placeholder IDs with "NOT_FOUND: Location with ID ${locationIdToCheck} not found". When invoice creation fails, opening uncreated links produces a 404 Not Found error.`);
    } else if (hasToken && apiPingOk && !targetLocationDetails && locationIdToCheck) {
      is404Risk = true;
      causesOf404.push(`Location ID "${locationIdToCheck}" does not exist on this Square merchant account. Square rejects invoice orders for non-existent locations.`);
    }
    if (targetLocationDetails && targetLocationDetails.status !== "ACTIVE") {
      is404Risk = true;
      causesOf404.push(`Location "${targetLocationDetails.name}" (${locationIdToCheck}) is marked as ${targetLocationDetails.status} on Square. Only ACTIVE locations can accept payments.`);
    }
    if (!is404Risk) {
      logs.push(`[${timestamp()}] \u2705 404 PAYMENT LINK DIAGNOSIS: CLEARED. Live Square invoices will be minted with authentic payment URLs.`);
    } else {
      logs.push(`[${timestamp()}] \u26A0\uFE0F 404 PAYMENT LINK DIAGNOSIS: ACTION REQUIRED to prevent 404 links:`);
      causesOf404.forEach((c) => logs.push(`[${timestamp()}]   - ${c}`));
    }
    return jsonResponse({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: isTargetProd ? "production" : "sandbox",
      baseUrl: targetBaseUrl,
      applicationId: applicationId || null,
      hasToken,
      maskedToken,
      apiPing: {
        ok: apiPingOk,
        statusCode: apiPingStatus,
        error: apiError
      },
      merchant: merchantInfo,
      locationsCount: locationsList.length,
      locations: locationsList.map((loc) => ({
        id: loc.id,
        name: loc.name,
        businessName: loc.business_name,
        status: loc.status,
        address: loc.address,
        currency: loc.currency,
        capabilities: loc.capabilities || []
      })),
      targetLocation: {
        queriedId: locationIdToCheck,
        isPlaceholder: isPlaceholderLocation,
        verified: Boolean(targetLocationDetails),
        details: targetLocationDetails
      },
      paymentLink404Analysis: {
        hasRisk: is404Risk,
        causes: causesOf404,
        recommendedLocationId: locationsList.find((l) => l.status === "ACTIVE")?.id || "LN4WBHANNNZ2Y",
        status: !is404Risk ? "HEALTHY" : "CONFIGURATION_DEFECT"
      },
      logs
    });
  }
  if ((pathname === "/api/square/customers/search-or-create" || pathname === "/api/square/customers" || pathname === "/api/square/customers/search") && (request.method === "POST" || request.method === "GET")) {
    let email = "";
    let firstName = "";
    let lastName = "";
    let phone = "";
    let note = "";
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      email = (body.email || "").trim();
      firstName = (body.firstName || "").trim();
      lastName = (body.lastName || "").trim();
      phone = (body.phone || "").trim();
      note = (body.note || "").trim();
    } else {
      email = (url.searchParams.get("email") || "").trim();
      firstName = (url.searchParams.get("firstName") || "").trim();
      lastName = (url.searchParams.get("lastName") || "").trim();
      phone = (url.searchParams.get("phone") || "").trim();
      note = (url.searchParams.get("note") || "").trim();
    }
    if (!email) {
      if (request.method === "GET") {
        return jsonResponse({
          status: "online",
          endpoint: "/api/square/customers",
          description: "Pass ?email=... to query customer."
        });
      }
      return jsonResponse({ success: false, error: "Email address is required." }, 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const KNOWN_RESIDENT_CUSTOMERS = {
      "jake@proweb.agency": { id: "5H7TD7HACMVSVZQFSJ557GW5XW", given_name: "William", family_name: "Jacobs" },
      "carlosrea@live.com": { id: "AKJ2CWZ97H76E6XG95WP3J35G8", given_name: "Carlos Adrian", family_name: "Rea" },
      "jordanbends@yahoo.com": { id: "BS5346WC6GYXYR7KP7V5QKV2ZG", given_name: "Jordan", family_name: "Bends" },
      "bacaliam28@gmail.com": { id: "NVKKA892W8959GTGYWKJ3F2NZ8", given_name: "Daniel", family_name: "Oliveira" }
    };
    const knownResident = KNOWN_RESIDENT_CUSTOMERS[cleanEmail];
    if (!accessToken) {
      if (knownResident) {
        return jsonResponse({
          success: true,
          customerId: knownResident.id,
          customer: {
            id: knownResident.id,
            given_name: knownResident.given_name,
            family_name: knownResident.family_name,
            email_address: cleanEmail,
            phone_number: phone || ""
          },
          isNew: false,
          source: "verified_resident"
        });
      }
      if (isProduction) {
        return jsonResponse({
          success: false,
          error: "Square Access Token not found in Cloudflare Pages. Please add SQUARE_ACCESS_TOKEN under Cloudflare Pages Settings > Environment variables (for both Production and Preview) and retry deployment.",
          source: "missing_token"
        }, 400);
      }
      const fallbackId = `sq_cust_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
      return jsonResponse({
        success: true,
        customerId: fallbackId,
        customer: {
          id: fallbackId,
          given_name: firstName || "Tenant",
          family_name: lastName || "",
          email_address: cleanEmail,
          phone_number: phone || ""
        },
        isNew: true,
        source: "simulated",
        warning: "Sandbox simulated ID generated (no token configured)."
      });
    }
    try {
      const searchRes = await fetch(`${baseUrl}/v2/customers/search`, {
        method: "POST",
        headers: squareHeaders,
        body: JSON.stringify({
          query: {
            filter: {
              email_address: { exact: cleanEmail }
            }
          }
        })
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) {
        const errMsg = searchData?.errors?.map((e) => `${e.code}: ${e.detail}`).join(", ") || `Square Search HTTP ${searchRes.status}`;
        return jsonResponse({
          success: false,
          error: `Square Customers API Search Error: ${errMsg}`,
          details: searchData?.errors,
          source: "square_api_error"
        }, searchRes.status);
      }
      if (searchData.customers && searchData.customers.length > 0) {
        const customer = searchData.customers[0];
        return jsonResponse({
          success: true,
          customerId: customer.id,
          customer,
          isNew: false,
          source: "square_live_api"
        });
      }
      const createPayload = {
        idempotency_key: crypto.randomUUID(),
        email_address: cleanEmail,
        note: note || "Moyer Property Management Speer House Tenant"
      };
      if (firstName?.trim()) createPayload.given_name = firstName.trim();
      if (lastName?.trim()) createPayload.family_name = lastName.trim();
      if (phone?.trim()) createPayload.phone_number = phone.trim();
      const createRes = await fetch(`${baseUrl}/v2/customers`, {
        method: "POST",
        headers: squareHeaders,
        body: JSON.stringify(createPayload)
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        const errMsg = createData?.errors?.map((e) => `${e.code}: ${e.detail}`).join(", ") || `Square Customer Create HTTP ${createRes.status}`;
        return jsonResponse({
          success: false,
          error: `Square Customer Create Error: ${errMsg}`,
          details: createData?.errors,
          source: "square_api_error"
        }, createRes.status);
      }
      if (createData.customer) {
        return jsonResponse({
          success: true,
          customerId: createData.customer.id,
          customer: createData.customer,
          isNew: true,
          source: "square_live_api"
        });
      }
      return jsonResponse({
        success: false,
        error: "Customer creation succeeded on Square but did not return a customer record.",
        source: "square_api_error"
      }, 500);
    } catch (err) {
      console.warn("Square customer sync network issue on Cloudflare:", err);
      return jsonResponse({
        success: false,
        error: `Square API connection failure: ${err?.message || "Network error"}`,
        source: "network_error"
      }, 502);
    }
  }
  if (pathname === "/api/square/invoices/create-batch" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { invoices } = body;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return jsonResponse({ error: "No invoices provided in payload." }, 400);
    }
    const results = [];
    const errors = [];
    for (const inv of invoices) {
      try {
        let locationId = (inv.squareLocationId || "").trim();
        if (!locationId || locationId.startsWith("LOC_SPEER") || locationId.startsWith("LOC_CAPHILL") || locationId.startsWith("LOC_HIGHLANDS")) {
          locationId = defaultLocationId;
        }
        const cleanEmail = (inv.tenantEmail || "").trim().toLowerCase();
        let customerId = (inv.squareCustomerId || "").trim();
        const isRealSquareCustomerId = customerId && /^[A-Z0-9]{20,32}$/.test(customerId) && !customerId.startsWith("CUST_") && !customerId.startsWith("LOC_") && !customerId.startsWith("PROP_") && !customerId.startsWith("sq_");
        if (!isRealSquareCustomerId) {
          const KNOWN_RESIDENT_MAP = {
            "jake@proweb.agency": "5H7TD7HACMVSVZQFSJ557GW5XW",
            "carlosrea@live.com": "AKJ2CWZ97H76E6XG95WP3J35G8",
            "jordanbends@yahoo.com": "BS5346WC6GYXYR7KP7V5QKV2ZG",
            "bacaliam28@gmail.com": "NVKKA892W8959GTGYWKJ3F2NZ8",
            "marcus.vance@gmail.com": "36F258ZG1M87CWK3TT9RCQHCS0"
          };
          if (cleanEmail && KNOWN_RESIDENT_MAP[cleanEmail]) {
            customerId = KNOWN_RESIDENT_MAP[cleanEmail];
          } else if (accessToken) {
            if (cleanEmail) {
              try {
                const searchCust = await fetch(`${baseUrl}/v2/customers/search`, {
                  method: "POST",
                  headers: squareHeaders,
                  body: JSON.stringify({
                    query: { filter: { email_address: { exact: cleanEmail } } }
                  })
                });
                const searchCustData = await searchCust.json();
                if (searchCust.ok && searchCustData.customers && searchCustData.customers.length > 0) {
                  customerId = searchCustData.customers[0].id;
                }
              } catch (cErr) {
                console.warn("[Cloudflare API] Customer search failed:", cErr);
              }
            }
            if (!customerId) {
              try {
                const nameParts = (inv.tenantName || "Resident").trim().split(/\s+/);
                const createCust = await fetch(`${baseUrl}/v2/customers`, {
                  method: "POST",
                  headers: squareHeaders,
                  body: JSON.stringify({
                    idempotency_key: crypto.randomUUID(),
                    email_address: cleanEmail || void 0,
                    given_name: nameParts[0] || "Resident",
                    family_name: nameParts.slice(1).join(" ") || "",
                    phone_number: inv.tenantPhone ? inv.tenantPhone.replace(/[^+\d]/g, "") : void 0,
                    note: `Coliving tenant at ${inv.propertyName || "1070 Yank St"} - ${inv.roomName || "Bedroom"}`
                  })
                });
                const createCustData = await createCust.json();
                if (createCust.ok && createCustData.customer?.id) {
                  customerId = createCustData.customer.id;
                  console.log(`[Cloudflare API] Created new Square customer for ${inv.tenantName}: ${customerId}`);
                } else {
                  console.error("[Cloudflare API] Customer creation failed on Square:", createCustData);
                  errors.push({
                    id: inv.id,
                    tenant: inv.tenantName,
                    error: `Square Customer creation failed: ${createCustData?.errors?.map((e) => e.detail || e.code).join(", ") || "Unknown error"}`
                  });
                  continue;
                }
              } catch (cErr) {
                console.error("[Cloudflare API] Error creating customer:", cErr);
                errors.push({ id: inv.id, tenant: inv.tenantName, error: `Customer creation error: ${cErr.message}` });
                continue;
              }
            }
          }
        }
        if (!customerId) {
          errors.push({
            id: inv.id,
            tenant: inv.tenantName,
            error: `Could not resolve a valid Square customer for ${inv.tenantName || cleanEmail || "resident"}.`
          });
          continue;
        }
        const amountInCents = Math.round(Number(inv.amount) * 100);
        const title = inv.title || `${inv.invoiceType || "Rental"} Invoice - ${inv.month || ""} ${inv.year || ""}`.trim();
        const lineItemName = inv.lineItemName || title;
        const todayIso = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const targetYear = inv.year || (/* @__PURE__ */ new Date()).getFullYear();
        const targetMonth = String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
        let candidateDueDate = inv.dueDate && !inv.dueDate.includes("undefined") ? inv.dueDate : `${targetYear}-${targetMonth}-01`;
        const validDueDate = candidateDueDate < todayIso ? todayIso : candidateDueDate;
        const orderLineItems = inv.lineItems && Array.isArray(inv.lineItems) && inv.lineItems.length > 0 ? inv.lineItems.map((li) => ({
          name: li.name || lineItemName,
          quantity: String(li.quantity || "1"),
          base_price_money: {
            amount: Math.round(Number(li.amount) * 100),
            currency: "USD"
          },
          note: li.description || `${inv.propertyName || ""} - ${inv.roomName || ""}`
        })) : [
          {
            name: lineItemName,
            quantity: "1",
            base_price_money: { amount: amountInCents, currency: "USD" }
          }
        ];
        if (accessToken) {
          try {
            console.log(`[Cloudflare API] Creating Square Order for bedroom "${inv.roomName}" (${inv.roomId}):`, JSON.stringify({
              locationId,
              customerId,
              lineItems: orderLineItems
            }));
            const orderRes = await fetch(`${baseUrl}/v2/orders`, {
              method: "POST",
              headers: squareHeaders,
              body: JSON.stringify({
                idempotency_key: crypto.randomUUID(),
                order: {
                  location_id: locationId,
                  customer_id: customerId,
                  line_items: orderLineItems
                }
              })
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok || !orderData.order) {
              const errDetail = orderData?.errors?.map((e) => `${e.code}: ${e.detail}`).join(", ") || `HTTP ${orderRes.status}`;
              console.error(`[Cloudflare API] Order creation rejected:`, errDetail);
              errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square Order failed: ${errDetail}` });
              continue;
            }
            const squareOrderId = orderData.order.id;
            const invoiceRes = await fetch(`${baseUrl}/v2/invoices`, {
              method: "POST",
              headers: squareHeaders,
              body: JSON.stringify({
                idempotency_key: crypto.randomUUID(),
                invoice: {
                  order_id: squareOrderId,
                  location_id: locationId,
                  primary_recipient: { customer_id: customerId },
                  payment_requests: [
                    {
                      request_type: "BALANCE",
                      due_date: validDueDate,
                      automatic_payment_source: "NONE"
                    }
                  ],
                  delivery_method: "EMAIL",
                  accepted_payment_methods: {
                    card: true,
                    square_gift_card: false,
                    bank_account: true,
                    buy_now_pay_later: false
                  },
                  title,
                  description: inv.description || `${inv.propertyName} - ${inv.roomName} rent for ${inv.month} ${inv.year}`,
                  sale_or_service_date: validDueDate
                }
              })
            });
            const invoiceData = await invoiceRes.json();
            if (!invoiceRes.ok || !invoiceData.invoice) {
              const errDetail = invoiceData?.errors?.map((e) => `${e.code}: ${e.detail}`).join(", ") || `HTTP ${invoiceRes.status}`;
              console.error(`[Cloudflare API] Invoice creation rejected:`, errDetail);
              errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square Invoice failed: ${errDetail}` });
              continue;
            }
            const squareInvoiceId = invoiceData.invoice.id;
            const version = invoiceData.invoice.version;
            const publishRes = await fetch(`${baseUrl}/v2/invoices/${squareInvoiceId}/publish`, {
              method: "POST",
              headers: squareHeaders,
              body: JSON.stringify({
                idempotency_key: crypto.randomUUID(),
                version
              })
            });
            const publishData = await publishRes.json();
            const finalInv = publishRes.ok && publishData.invoice ? publishData.invoice : invoiceData.invoice;
            results.push({
              clientReferenceId: inv.id,
              squareOrderId,
              squareInvoiceId,
              squareLocationId: locationId,
              squareCustomerId: customerId,
              status: finalInv.status || "UNPAID",
              paymentUrl: finalInv.public_url || `https://squareup.com/pay-invoice/${squareInvoiceId}`,
              viewUrl: finalInv.public_url || `https://squareup.com/pay-invoice/${squareInvoiceId}`,
              source: "square_live_api"
            });
            continue;
          } catch (sqErr) {
            console.error("[Cloudflare API] Square live API network error:", sqErr);
            errors.push({ id: inv.id, tenant: inv.tenantName, error: `Square API error: ${sqErr.message}` });
            continue;
          }
        }
        errors.push({
          id: inv.id,
          tenant: inv.tenantName,
          error: "SQUARE_ACCESS_TOKEN is not configured on Cloudflare Pages."
        });
      } catch (err) {
        errors.push({ id: inv.id, tenant: inv.tenantName, error: err.message || "Unknown error" });
      }
    }
    if (results.length === 0 && errors.length > 0) {
      return jsonResponse({
        success: false,
        error: errors.map((e) => `${e.tenant || e.id}: ${e.error}`).join(" | "),
        results: [],
        errors
      }, 400);
    }
    return jsonResponse({
      success: results.length > 0,
      createdCount: results.length,
      results,
      errors
    });
  }
  const invoiceSyncMatch = pathname.match(/^\/api\/square\/invoices\/([^/]+)\/sync$/);
  if (invoiceSyncMatch && request.method === "GET") {
    const invoiceId = invoiceSyncMatch[1];
    if (accessToken && !invoiceId.startsWith("sq_inv_")) {
      try {
        const res = await fetch(`${baseUrl}/v2/invoices/${encodeURIComponent(invoiceId)}`, {
          headers: squareHeaders
        });
        const data = await res.json();
        if (res.ok && data.invoice) {
          const inv = data.invoice;
          const isPaid = inv.status === "PAID";
          return jsonResponse({
            invoiceId: inv.id,
            status: inv.status,
            isPaid,
            paidAt: inv.payment_requests?.[0]?.computed_amount_money?.amount ? (/* @__PURE__ */ new Date()).toISOString() : null,
            paymentUrl: inv.public_url,
            source: "square_live_api"
          });
        }
      } catch (err) {
        console.warn("Square sync error on Cloudflare:", err);
      }
    }
    return jsonResponse({
      invoiceId,
      status: "UNPAID",
      isPaid: false,
      paidAt: null,
      source: "simulated"
    });
  }
  if ((pathname === "/api/square/invoices/cancel" || pathname === "/api/square/invoices/cancel/") && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { invoiceId, version } = body;
    if (!invoiceId) {
      return jsonResponse({ error: "Missing invoiceId" }, 400);
    }
    if (accessToken && invoiceId.startsWith("inv:")) {
      try {
        let invoiceVersion = version;
        if (invoiceVersion === void 0 || invoiceVersion === null) {
          const getRes = await fetch(`${baseUrl}/v2/invoices/${encodeURIComponent(invoiceId)}`, {
            headers: squareHeaders
          });
          if (getRes.ok) {
            const getData = await getRes.json();
            invoiceVersion = getData.invoice?.version || 0;
          }
        }
        const cancelRes = await fetch(`${baseUrl}/v2/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
          method: "POST",
          headers: squareHeaders,
          body: JSON.stringify({
            version: invoiceVersion ?? 1
          })
        });
        const cancelData = await cancelRes.json();
        return jsonResponse({
          success: cancelRes.ok,
          status: cancelData.invoice?.status || "CANCELED",
          invoice: cancelData.invoice
        });
      } catch (e) {
        console.warn("Square cancel invoice error on Cloudflare:", e);
        return jsonResponse({ error: e?.message || "Failed to cancel Square invoice" }, 500);
      }
    }
    return jsonResponse({ success: true, status: "CANCELED", source: "simulated" });
  }
  if (pathname === "/api/square/late-fees/apply" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { rentAmount, invoiceId } = body;
    const lateFee = Math.max(50, Math.round((Number(rentAmount) || 0) * 0.05 * 100) / 100);
    return jsonResponse({
      success: true,
      invoiceId,
      lateFeeAmount: lateFee,
      totalAmount: (Number(rentAmount) || 0) + lateFee,
      appliedAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: "simulated"
    });
  }
  return jsonResponse({ error: "Endpoint not found on Cloudflare Pages API", pathname }, 404);
}

// src/cloudflare-worker.ts
var cloudflare_worker_default = {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return onRequest({
        request,
        env,
        params: { path: url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean) }
      });
    }
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
export {
  cloudflare_worker_default as default
};
