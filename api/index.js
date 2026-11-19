import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'node:crypto';
import { createProductionArchive, createVariableDataArchive } from '../server/production-files.js';

export const config = { api: { bodyParser: false } };

const divisions = ['Labels & stickers', 'Race & event numbers', 'MTB boards', 'Stamps', 'Trophies', 'Laser-cut work'];
const catalog = [
  { id: 'die-cut-labels', name: 'Die-cut labels', division: divisions[0], description: 'Custom-cut vinyl labels, finished to your shape.', basePrice: 0.24, materials: ['Matte vinyl', 'Gloss vinyl', 'Paper'] },
  { id: 'race-numbers', name: 'Race numbers', division: divisions[1], description: 'Weatherproof bibs and number panels for race day.', basePrice: 0.38, materials: ['Waterproof synthetic', 'Tyvek'] },
  { id: 'mtb-boards', name: 'MTB number boards', division: divisions[2], description: 'Rugged printed plates for your next start line.', basePrice: 12.5, materials: ['White PVC', 'Brushed aluminium'] },
  { id: 'custom-stamp', name: 'Custom stamps', division: divisions[3], description: 'A clean impression, made with your mark.', basePrice: 18, materials: ['Self-inking', 'Wood handle'] },
  { id: 'acrylic-trophy', name: 'Acrylic trophies', division: divisions[4], description: 'Recognise a big moment with a custom-cut award.', basePrice: 32, materials: ['Clear acrylic', 'Frosted acrylic'] },
  { id: 'laser-cut-sign', name: 'Laser-cut signs', division: divisions[5], description: 'Precision-cut signage for studios, shops and homes.', basePrice: 25, materials: ['Birch plywood', 'Clear acrylic', 'Brushed aluminium'] },
];

const dbConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = dbConfigured
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function priceFor(config) {
  const product = catalog.find((item) => item.id === config.productId);
  if (!product) throw new HttpError(400, 'Choose a valid product.');
  const width = Number(config.width);
  const height = Number(config.height);
  const quantity = Number(config.quantity);
  if (![width, height, quantity].every(Number.isFinite) || !Number.isInteger(quantity) || width < 2 || height < 2 || width > 60 || height > 60 || quantity < 1 || quantity > 10000) {
    throw new HttpError(400, 'Enter a size from 2 to 60 cm and a quantity from 1 to 10,000.');
  }
  if (config.material && !product.materials.includes(config.material)) throw new HttpError(400, 'Choose a material offered for this product.');
  const sizeFactor = Math.max(0.65, (width * height) / 100);
  const discountRate = quantity >= 1000 ? 0.2 : quantity >= 500 ? 0.15 : quantity >= 100 ? 0.1 : 0;
  const subtotal = product.basePrice * sizeFactor * quantity;
  const discount = subtotal * discountRate;
  const net = subtotal - discount;
  const tax = net * 0.18;
  return {
    product,
    quantity,
    width,
    height,
    subtotal: round(subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(net + tax),
    discountRate,
  };
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function getIdentity(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !supabase) throw new HttpError(401, 'Please sign in to continue.');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (profileError) throw new HttpError(403, 'Your account profile is not available.');
  return { user, profile };
}

async function requireDatabase() {
  if (!supabase) throw new HttpError(503, 'Connect a Supabase project to enable account and order storage.');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new HttpError(413, 'Request body is too large.');
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function sendFile(res, filename, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

async function getOrderForRequest(id, identity) {
  const query = supabase.from('orders').select('*').eq('id', id);
  if (identity.profile.role !== 'admin') query.eq('customer_id', identity.user.id);
  const { data, error } = await query.single();
  if (error || !data) throw new HttpError(404, 'Order not found.');
  return data;
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const rewrittenPath = requestUrl.searchParams.get('route');
  const path = (rewrittenPath ? `/api/${rewrittenPath}` : requestUrl.pathname).replace(/\/+$/, '') || '/';
  const method = req.method ?? 'GET';
  try {
    if (method === 'GET' && path === '/api') {
      return res.status(200).json({ ok: true, databaseConfigured: dbConfigured, paymentsConfigured: Boolean(process.env.STRIPE_SECRET_KEY), divisions });
    }
    if (method === 'GET' && path === '/api/products') {
      return res.status(200).json({ products: catalog });
    }
    if (method === 'POST' && path === '/api/pricing') {
      return res.status(200).json(priceFor(await readJson(req)));
    }
    if (method === 'POST' && path === '/api/stripe/webhook') {
      await requireDatabase();
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, 'Configure Stripe and its webhook signing secret.');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let event;
      try {
        event = stripe.webhooks.constructEvent(await readRawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
      } catch {
        throw new HttpError(400, 'Stripe webhook signature is invalid.');
      }
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
        const session = event.data.object;
        if (session.payment_status === 'paid' && session.metadata?.order_id) {
          const { error } = await supabase.from('orders')
            .update({ payment_status: 'paid', status: 'production', updated_at: new Date().toISOString() })
            .eq('id', session.metadata.order_id)
            .eq('stripe_session_id', session.id)
            .eq('proof_state', 'approved');
          if (error) throw new HttpError(500, error.message);
        }
      }
      return res.status(200).json({ received: true });
    }
    if (method === 'POST' && (path === '/api/auth/register' || path === '/api/auth/login')) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) throw new HttpError(503, 'Connect Supabase authentication to create an account.');
      const body = await readJson(req);
      const auth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const result = path.endsWith('register')
        ? await auth.auth.signUp({ email: body.email, password: body.password, options: { data: { full_name: body.fullName ?? '' } } })
        : await auth.auth.signInWithPassword({ email: body.email, password: body.password });
      if (result.error) throw new HttpError(400, result.error.message);
      return res.status(200).json({ accessToken: result.data.session?.access_token ?? null, user: result.data.user, confirmationRequired: !result.data.session });
    }
    if (method === 'GET' && path === '/api/me') {
      await requireDatabase();
      const identity = await getIdentity(req);
      return res.status(200).json({ user: { id: identity.user.id, email: identity.user.email, fullName: identity.profile.full_name }, role: identity.profile.role });
    }
    if (method === 'GET' && path === '/api/designs') {
      await requireDatabase();
      const identity = await getIdentity(req);
      const { data, error } = await supabase.from('designs').select('*').eq('customer_id', identity.user.id).order('updated_at', { ascending: false });
      if (error) throw new HttpError(500, error.message);
      return res.status(200).json({ designs: data });
    }
    if (method === 'POST' && path === '/api/designs') {
      await requireDatabase();
      const identity = await getIdentity(req);
      const body = await readJson(req);
      if (!catalog.some((product) => product.id === body.productId)) throw new HttpError(400, 'Choose a valid product for this design.');
      const { data, error } = await supabase.from('designs').insert({
        customer_id: identity.user.id,
        product_id: body.productId,
        name: String(body.name ?? 'My design').slice(0, 80),
        artwork: body.artwork ?? {},
      }).select('*').single();
      if (error) throw new HttpError(500, error.message);
      return res.status(201).json({ design: data });
    }
    if (method === 'GET' && path === '/api/orders') {
      await requireDatabase();
      const identity = await getIdentity(req);
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (identity.profile.role !== 'admin') query = query.eq('customer_id', identity.user.id);
      const { data, error } = await query;
      if (error) throw new HttpError(500, error.message);
      return res.status(200).json({ orders: data });
    }
    if (method === 'POST' && path === '/api/orders') {
      await requireDatabase();
      const identity = await getIdentity(req);
      const body = await readJson(req);
      const price = priceFor(body.configuration ?? {});
      const orderNumber = `DH-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
      const order = {
        order_number: orderNumber,
        customer_id: identity.user.id,
        customer_name: identity.profile.full_name || identity.user.email,
        customer_email: identity.user.email,
        product_id: price.product.id,
        product_name: price.product.name,
        division: price.product.division,
        configuration: { width: price.width, height: price.height, material: body.configuration.material },
        artwork: body.artwork ?? {},
        quantity: price.quantity,
        subtotal: price.subtotal,
        discount: price.discount,
        tax: price.tax,
        total: price.total,
        status: 'proof',
        proof_version: 1,
        proof_state: 'pending',
        payment_status: 'pending',
      };
      const { data, error } = await supabase.from('orders').insert(order).select('*').single();
      if (error) throw new HttpError(500, error.message);
      return res.status(201).json({ order: data });
    }
    const orderMatch = path.match(/^\/api\/orders\/([^/]+)(?:\/(.*))?$/);
    if (orderMatch) {
      await requireDatabase();
      const identity = await getIdentity(req);
      const [, id, action] = orderMatch;
      const order = await getOrderForRequest(id, identity);
      if (method === 'POST' && action === 'proof') {
        const body = await readJson(req);
        if (!['approved', 'changes_requested'].includes(body.action)) throw new HttpError(400, 'Choose approve or request changes.');
        const approvalLog = [...(order.approval_log ?? []), { version: order.proof_version, action: body.action, actor: identity.user.id, at: new Date().toISOString(), note: String(body.note ?? '').slice(0, 500) }];
        const update = body.action === 'changes_requested'
          ? { proof_state: 'changes_requested', proof_version: order.proof_version + 1, status: 'proof', approval_log: approvalLog }
          : { proof_state: 'approved', status: process.env.STRIPE_SECRET_KEY ? 'proof' : 'production', approval_log: approvalLog };
        const { data, error } = await supabase.from('orders').update(update).eq('id', id).select('*').single();
        if (error) throw new HttpError(500, error.message);
        return res.status(200).json({ order: data });
      }
      if (method === 'POST' && action === 'checkout') {
        if (!process.env.STRIPE_SECRET_KEY) throw new HttpError(503, 'Online checkout is not configured for this store.');
        if (order.proof_state !== 'approved') throw new HttpError(409, 'Approve the proof before starting payment.');
        if (order.payment_status === 'paid') throw new HttpError(409, 'This order has already been paid.');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: identity.user.email,
          metadata: { order_id: order.id },
          line_items: [{ quantity: 1, price_data: { currency: 'inr', unit_amount: Math.round(Number(order.total) * 100), product_data: { name: `${order.product_name} · ${order.quantity} units` } } }],
          success_url: `${process.env.APP_URL ?? 'http://localhost:5173'}/?payment=success&order=${order.id}`,
          cancel_url: `${process.env.APP_URL ?? 'http://localhost:5173'}/?payment=cancelled&order=${order.id}`,
        });
        const { error } = await supabase.from('orders').update({ stripe_session_id: session.id, payment_status: 'checkout_pending' }).eq('id', order.id);
        if (error) throw new HttpError(500, error.message);
        return res.status(200).json({ checkoutUrl: session.url });
      }
      if (method === 'PATCH' && action === 'status') {
        if (identity.profile.role !== 'admin') throw new HttpError(403, 'Administrator access is required.');
        const body = await readJson(req);
        if (!['quote', 'order', 'artwork', 'proof', 'production', 'completed'].includes(body.status)) throw new HttpError(400, 'Choose a valid production stage.');
        if (body.status === 'production' && order.proof_state !== 'approved') throw new HttpError(409, 'Approve the proof before starting production.');
        if (body.status === 'production' && process.env.STRIPE_SECRET_KEY && order.payment_status !== 'paid') throw new HttpError(409, 'Payment must be completed before production starts.');
        const { data, error } = await supabase.from('orders').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
        if (error) throw new HttpError(500, error.message);
        return res.status(200).json({ order: data });
      }
      if (method === 'GET' && action === 'files') {
        if (identity.profile.role !== 'admin') throw new HttpError(403, 'Only production staff can download print files.');
        if (order.proof_state !== 'approved') throw new HttpError(409, 'Approve the proof before downloading production files.');
        const archive = await createProductionArchive(order);
        sendFile(res, `${order.order_number}_${order.product_id}_production.zip`, 'application/zip');
        return res.send(archive);
      }
      if (method === 'POST' && action === 'variable-data') {
        if (identity.profile.role !== 'admin') throw new HttpError(403, 'Only production staff can generate variable-data files.');
        if (order.proof_state !== 'approved') throw new HttpError(409, 'Approve the proof before generating production files.');
        const body = await readJson(req);
        if (typeof body.csv !== 'string' || body.csv.length > 500_000) throw new HttpError(400, 'Provide a CSV file under 500 KB.');
        let rows;
        try {
          rows = parse(body.csv, { columns: true, skip_empty_lines: true, bom: true, trim: true, relax_column_count: false });
        } catch {
          throw new HttpError(400, 'CSV must include a header row and consistently formatted data.');
        }
        if (!rows.length || rows.length > 100) throw new HttpError(400, 'Upload a CSV with between 1 and 100 data rows.');
        const archive = await createVariableDataArchive(order, rows);
        sendFile(res, `${order.order_number}_variable_artwork.zip`, 'application/zip');
        return res.send(archive);
      }
    }
    if (method === 'GET' && path === '/api/reports') {
      await requireDatabase();
      const identity = await getIdentity(req);
      if (identity.profile.role !== 'admin') throw new HttpError(403, 'Administrator access is required.');
      const { data, error } = await supabase.from('orders').select('status, total, division');
      if (error) throw new HttpError(500, error.message);
      return res.status(200).json({
        orders: data.length,
        revenue: round(data.reduce((sum, item) => sum + Number(item.total), 0)),
        byDivision: divisions.map((division) => ({ division, orders: data.filter((item) => item.division === division).length })),
        byStatus: Object.fromEntries(['quote', 'order', 'artwork', 'proof', 'production', 'completed'].map((status) => [status, data.filter((item) => item.status === status).length])),
      });
    }
    return res.status(404).json({ error: 'Endpoint not found.' });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error('API error:', error);
    return res.status(status).json({ error: status === 500 ? 'Something went wrong while processing your request.' : error.message });
  }
}
