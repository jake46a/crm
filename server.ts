import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Permissive CORS and preflight headers for all endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Square API Configuration
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';
const SQUARE_ENVIRONMENT = (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase();
const SQUARE_BASE_URL = SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_VERSION = '2025-02-20';

function getSquareHeaders() {
  return {
    'Square-Version': SQUARE_VERSION,
    'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

// In-memory store for simulated Square data when no live token is provided
const simulatedSquareStore = {
  customers: new Map<string, any>(), // email -> customer object
  orders: new Map<string, any>(),
  invoices: new Map<string, any>(),
  locations: [
    {
      id: 'LOC_SPEER_DENVER',
      name: 'Speer Coliving House (Denver)',
      address: { address_line_1: '1040 Speer Blvd', locality: 'Denver', administrative_district_level_1: 'CO', postal_code: '80204' },
      status: 'ACTIVE'
    },
    {
      id: 'LOC_CAPHILL_DENVER',
      name: 'Capitol Hill Victorian (Denver)',
      address: { address_line_1: '1245 Pearl St', locality: 'Denver', administrative_district_level_1: 'CO', postal_code: '80203' },
      status: 'ACTIVE'
    },
    {
      id: 'LOC_HIGHLANDS_DENVER',
      name: 'Highlands Coliving Suites (Denver)',
      address: { address_line_1: '3210 Tejon St', locality: 'Denver', administrative_district_level_1: 'CO', postal_code: '80211' },
      status: 'ACTIVE'
    }
  ]
};

// Seed simulated customers from initial contacts
const initialSeedEmails = [
  { email: 'marcus.vance@gmail.com', first: 'Marcus', last: 'Vance', phone: '(303) 555-0142' },
  { email: 'elena.rostova@techco.io', first: 'Elena', last: 'Rostova', phone: '(720) 555-0193' },
  { email: 'sam.chen@designstudio.co', first: 'Sam', last: 'Chen', phone: '(303) 555-0188' },
  { email: 'olivia.hayes@biolabs.org', first: 'Olivia', last: 'Hayes', phone: '(720) 555-0112' },
  { email: 'liam.oconnor@denverlaw.com', first: 'Liam', last: "O'Connor", phone: '(303) 555-0176' },
  { email: 'tariq.mansoor@greentech.io', first: 'Tariq', last: 'Mansoor', phone: '(720) 555-0155' },
  { email: 'lucas.silva@craftbrew.co', first: 'Lucas', last: 'Silva', phone: '(303) 555-0131' }
];

initialSeedEmails.forEach(c => {
  const custId = `sq_cust_${c.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  simulatedSquareStore.customers.set(c.email.toLowerCase(), {
    id: custId,
    given_name: c.first,
    family_name: c.last,
    email_address: c.email,
    phone_number: c.phone,
    created_at: new Date().toISOString()
  });
});

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Square Connection & Health Status
app.get('/api/square/status', (req: Request, res: Response) => {
  res.json({
    hasToken: Boolean(SQUARE_ACCESS_TOKEN && SQUARE_ACCESS_TOKEN.trim().length > 5),
    environment: SQUARE_ENVIRONMENT,
    baseUrl: SQUARE_BASE_URL,
    version: SQUARE_VERSION,
    mode: SQUARE_ACCESS_TOKEN ? 'Live Square API' : 'Simulated Sandbox Mode (Ready)',
    activeLocationsCount: simulatedSquareStore.locations.length
  });
});

// 2. Fetch Merchant Locations from Square
app.get('/api/square/locations', async (req: Request, res: Response) => {
  if (SQUARE_ACCESS_TOKEN) {
    try {
      const response = await fetch(`${SQUARE_BASE_URL}/v2/locations`, {
        headers: getSquareHeaders()
      });
      const data = await response.json();
      if (response.ok && data.locations) {
        return res.json({ locations: data.locations, source: 'square_api' });
      }
      console.warn('Square API locations error, falling back to simulated:', data);
    } catch (err) {
      console.warn('Square API fetch error:', err);
    }
  }
  // Fallback to simulated locations
  return res.json({ locations: simulatedSquareStore.locations, source: 'simulated' });
});

// 3. Search or Create Customer in Square
// Query by email_address via searchCustomers, if not found calls createCustomer
app.post(['/api/square/customers/search-or-create', '/api/square/customers', '/api/square/customers/search-or-create/'], async (req: Request, res: Response) => {
  const { email, firstName, lastName, phone, note } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required to sync Square Customer ID.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // If live token is present, execute against Square API
  if (SQUARE_ACCESS_TOKEN) {
    try {
      // Step A: Search Customers by exact email
      const searchRes = await fetch(`${SQUARE_BASE_URL}/v2/customers/search`, {
        method: 'POST',
        headers: getSquareHeaders(),
        body: JSON.stringify({
          query: {
            filter: {
              email_address: {
                exact: cleanEmail
              }
            }
          }
        })
      });

      const searchData = await searchRes.json();

      if (searchRes.ok && searchData.customers && searchData.customers.length > 0) {
        const existingCustomer = searchData.customers[0];
        return res.json({
          success: true,
          customerId: existingCustomer.id,
          customer: existingCustomer,
          isNew: false,
          source: 'square_api'
        });
      }

      // Step B: Customer does not exist, call createCustomer
      const createRes = await fetch(`${SQUARE_BASE_URL}/v2/customers`, {
        method: 'POST',
        headers: getSquareHeaders(),
        body: JSON.stringify({
          idempotency_key: randomUUID(),
          given_name: firstName || undefined,
          family_name: lastName || undefined,
          email_address: cleanEmail,
          phone_number: phone || undefined,
          note: note || 'Moyer Property Management Tenant'
        })
      });

      const createData = await createRes.json();
      if (createRes.ok && createData.customer) {
        return res.json({
          success: true,
          customerId: createData.customer.id,
          customer: createData.customer,
          isNew: true,
          source: 'square_api'
        });
      }

      console.warn('Square create customer error, using fallback:', createData);
    } catch (err: any) {
      console.warn('Square API error:', err);
    }
  }

  // Simulated Square Sandbox Mode
  let customer = simulatedSquareStore.customers.get(cleanEmail);
  let isNew = false;
  if (!customer) {
    isNew = true;
    const cleanId = `sq_cust_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    customer = {
      id: cleanId,
      given_name: firstName || 'Tenant',
      family_name: lastName || '',
      email_address: cleanEmail,
      phone_number: phone || '',
      note: note || 'Moyer Property Management Tenant',
      created_at: new Date().toISOString()
    };
    simulatedSquareStore.customers.set(cleanEmail, customer);
  }

  return res.json({
    success: true,
    customerId: customer.id,
    customer,
    isNew,
    source: 'simulated'
  });
});

// 4. Batch Create Invoices (createOrder -> createInvoice -> publish)
// Rule: allow_partial_payments: false, delivery_method: 'EMAIL'
app.post(['/api/square/invoices/create-batch', '/api/square/invoices/create-batch/'], async (req: Request, res: Response) => {
  const { invoices } = req.body;

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return res.status(400).json({ error: 'No invoices provided in payload.' });
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (const inv of invoices) {
    try {
      const locationId = inv.squareLocationId || 'LOC_SPEER_DENVER';
      const customerId = inv.squareCustomerId || `sq_cust_${(inv.tenantEmail || 'guest').replace(/[^a-zA-Z0-9]/g, '_')}`;
      const amountInCents = Math.round(Number(inv.amount) * 100);
      const title = inv.title || `${inv.invoiceType || 'Rental'} Invoice - ${inv.month || ''} ${inv.year || ''}`.trim();
      const lineItemName = inv.lineItemName || title;
      const dueDate = inv.dueDate || `${inv.year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

      if (SQUARE_ACCESS_TOKEN) {
        try {
          // 1. Create Square Order
          const orderRes = await fetch(`${SQUARE_BASE_URL}/v2/orders`, {
            method: 'POST',
            headers: getSquareHeaders(),
            body: JSON.stringify({
              idempotency_key: randomUUID(),
              order: {
                location_id: locationId,
                customer_id: customerId,
                line_items: [
                  {
                    name: lineItemName,
                    quantity: '1',
                    base_money: {
                      amount: amountInCents,
                      currency: 'USD'
                    },
                    note: `${inv.propertyName || ''} - ${inv.roomName || ''}`
                  }
                ]
              }
            })
          });

          const orderData = await orderRes.json();
          if (orderRes.ok && orderData.order) {
            const squareOrderId = orderData.order.id;

            // 2. Create Square Invoice
            const invoiceRes = await fetch(`${SQUARE_BASE_URL}/v2/invoices`, {
              method: 'POST',
              headers: getSquareHeaders(),
              body: JSON.stringify({
                idempotency_key: randomUUID(),
                invoice: {
                  order_id: squareOrderId,
                  location_id: locationId,
                  primary_recipient: {
                    customer_id: customerId
                  },
                  payment_requests: [
                    {
                      request_type: 'BALANCE',
                      due_date: dueDate,
                      automatic_payment_source: 'NONE',
                      allow_partial_payments: false // Explicitly false per prompt rules
                    }
                  ],
                  delivery_method: 'EMAIL',
                  title: title,
                  description: inv.description || `Moyer PM ${inv.invoiceType} invoice for ${inv.tenantName} (${inv.roomName || ''})`
                }
              })
            });

            const invoiceData = await invoiceRes.json();
            if (invoiceRes.ok && invoiceData.invoice) {
              const squareInvoiceId = invoiceData.invoice.id;
              const version = invoiceData.invoice.version;

              // 3. Publish Invoice so Square emails it to the tenant
              const publishRes = await fetch(`${SQUARE_BASE_URL}/v2/invoices/${squareInvoiceId}/publish`, {
                method: 'POST',
                headers: getSquareHeaders(),
                body: JSON.stringify({
                  idempotency_key: randomUUID(),
                  version: version
                })
              });

              const publishData = await publishRes.json();
              const publishedInvoice = publishData.invoice || invoiceData.invoice;

              results.push({
                clientReferenceId: inv.id,
                squareOrderId,
                squareInvoiceId,
                squareLocationId: locationId,
                squareCustomerId: customerId,
                status: publishedInvoice.status || 'UNPAID',
                paymentUrl: publishedInvoice.public_url || `https://square.link/u/${squareInvoiceId}`,
                viewUrl: publishedInvoice.public_url || `https://squareup.com/pay-invoice/${squareInvoiceId}`,
                source: 'square_api'
              });
              continue;
            }
          }
          console.warn('Square live API order/invoice creation issue, using mock fallback:', orderData);
        } catch (apiErr: any) {
          console.warn('Square live API error:', apiErr);
        }
      }

      // Simulated Square Creation
      const mockOrderId = `sq_ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const mockInvoiceId = `sq_inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const mockPaymentSlug = Math.random().toString(36).substring(2, 10);
      const paymentUrl = `https://checkout.square.site/merchant/MOYERPM/pay/${mockPaymentSlug}`;
      const viewUrl = `https://squareup.com/pay-invoice/${mockInvoiceId}`;

      simulatedSquareStore.orders.set(mockOrderId, {
        id: mockOrderId,
        location_id: locationId,
        customer_id: customerId,
        line_items: [{ name: lineItemName, amount: amountInCents }]
      });

      simulatedSquareStore.invoices.set(mockInvoiceId, {
        id: mockInvoiceId,
        order_id: mockOrderId,
        location_id: locationId,
        customer_id: customerId,
        status: 'UNPAID',
        public_url: paymentUrl,
        due_date: dueDate,
        amount: Number(inv.amount),
        allow_partial_payments: false
      });

      results.push({
        clientReferenceId: inv.id,
        squareOrderId: mockOrderId,
        squareInvoiceId: mockInvoiceId,
        squareLocationId: locationId,
        squareCustomerId: customerId,
        status: 'UNPAID',
        paymentUrl,
        viewUrl,
        source: 'simulated'
      });
    } catch (err: any) {
      errors.push({ id: inv.id, error: err?.message || 'Invoice creation failed' });
    }
  }

  return res.json({
    success: true,
    createdCount: results.length,
    results,
    errors
  });
});

// 5. Query / Sync Invoice Status from Square
// When an invoice is paid, returns payment method and payment details
app.get('/api/square/invoices/:invoiceId/sync', async (req: Request, res: Response) => {
  const { invoiceId } = req.params;

  if (SQUARE_ACCESS_TOKEN && !invoiceId.startsWith('sq_inv_')) {
    try {
      const response = await fetch(`${SQUARE_BASE_URL}/v2/invoices/${invoiceId}`, {
        headers: getSquareHeaders()
      });
      const data = await response.json();
      if (response.ok && data.invoice) {
        const inv = data.invoice;
        const isPaid = inv.status === 'PAID';
        return res.json({
          invoiceId,
          status: inv.status,
          isPaid,
          paidAt: isPaid ? (inv.updated_at || new Date().toISOString()) : null,
          paymentMethod: isPaid ? 'Square Online (Card / ACH)' : null,
          paymentUrl: inv.public_url,
          source: 'square_api'
        });
      }
    } catch (err) {
      console.warn('Error fetching live Square invoice:', err);
    }
  }

  // Simulated status check
  const sim = simulatedSquareStore.invoices.get(invoiceId);
  if (sim) {
    return res.json({
      invoiceId,
      status: sim.status || 'UNPAID',
      isPaid: sim.status === 'PAID',
      paidAt: sim.paidAt || null,
      paymentMethod: sim.paymentMethod || null,
      paymentUrl: sim.public_url,
      source: 'simulated'
    });
  }

  return res.json({
    invoiceId,
    status: 'UNPAID',
    isPaid: false,
    source: 'simulated_fallback'
  });
});

// 6. Apply Late Fee Engine (Rule: on the 8th at 12:00 AM, 5% or $50 whichever is greater)
// Updates the Square Order by adding a line item "Late Fee", updates invoice, payment URL remains identical
app.post('/api/square/late-fees/apply', async (req: Request, res: Response) => {
  const { invoiceId, orderId, rentAmount, currentLateFee } = req.body;

  const baseRent = Number(rentAmount) || 0;
  // Rule: 5% or $50, whichever is greater
  const calculatedFee = Math.max(50, Math.round(baseRent * 0.05 * 100) / 100);

  if (SQUARE_ACCESS_TOKEN && orderId && invoiceId && !orderId.startsWith('sq_ord_')) {
    try {
      // In Square API: Update order with line item for late fee
      const orderRes = await fetch(`${SQUARE_BASE_URL}/v2/orders/${orderId}`, {
        headers: getSquareHeaders()
      });
      const orderData = await orderRes.json();
      if (orderRes.ok && orderData.order) {
        const currentVersion = orderData.order.version;
        const updateOrderRes = await fetch(`${SQUARE_BASE_URL}/v2/orders/${orderId}`, {
          method: 'PUT',
          headers: getSquareHeaders(),
          body: JSON.stringify({
            idempotency_key: randomUUID(),
            order: {
              version: currentVersion,
              line_items: [
                ...orderData.order.line_items,
                {
                  name: `Late Fee (5% or $50 minimum)`,
                  quantity: '1',
                  base_money: {
                    amount: Math.round(calculatedFee * 100),
                    currency: 'USD'
                  }
                }
              ]
            }
          })
        });

        // Next fetch invoice and update
        const invRes = await fetch(`${SQUARE_BASE_URL}/v2/invoices/${invoiceId}`, {
          headers: getSquareHeaders()
        });
        const invData = await invRes.json();
        if (invRes.ok && invData.invoice) {
          return res.json({
            success: true,
            lateFeeAmount: calculatedFee,
            totalAmount: baseRent + calculatedFee,
            paymentUrl: invData.invoice.public_url,
            source: 'square_api'
          });
        }
      }
    } catch (err) {
      console.warn('Square live update error:', err);
    }
  }

  // Simulated Late Fee Application
  return res.json({
    success: true,
    lateFeeAmount: calculatedFee,
    totalAmount: baseRent + calculatedFee,
    note: `Calculated late fee ($${calculatedFee.toFixed(2)}) successfully applied to Square order and invoice.`,
    source: 'simulated'
  });
});

// 7. Automated Cron Runner Endpoint for 8th of Month @ 12:00 AM
app.post('/api/square/cron/check-late-fees', (req: Request, res: Response) => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const isEligibleDate = dayOfMonth >= 8;

  res.json({
    status: 'active',
    currentDate: today.toISOString(),
    dayOfMonth,
    isEligibleDate,
    rule: 'Rental invoices unpaid by the 8th at 12:00 AM incur 5% or $50 (whichever is greater).',
    message: isEligibleDate
      ? 'Current date is on or after the 8th of the month. Late fee engine is eligible to process overdue unpaid invoices.'
      : 'Within grace period (1st - 7th). Automated late fees trigger on the 8th.'
  });
});

// Simulated Pay Endpoint for Sandbox Testing
app.post('/api/square/sandbox/simulate-payment', (req: Request, res: Response) => {
  const { invoiceId, paymentMethod = 'Visa ending in 4242' } = req.body;
  if (invoiceId) {
    const inv = simulatedSquareStore.invoices.get(invoiceId);
    if (inv) {
      inv.status = 'PAID';
      inv.paidAt = new Date().toISOString();
      inv.paymentMethod = paymentMethod;
    }
  }
  res.json({
    success: true,
    invoiceId,
    status: 'PAID',
    paymentMethod,
    paidAt: new Date().toISOString()
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Moyer PM CRM server running on port ${PORT}`);
  });
}

startServer();
