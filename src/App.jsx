import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bell, Check, ChevronDown, CircleUserRound,
  Clock3, Download, FileImage, FileText, Heart, Layers3, Menu, Minus, PackageCheck, Plus, Search, Settings2,
  ShieldCheck, ShoppingBag, Sparkles, Truck, Upload, X,
} from 'lucide-react';
import { calculatePrice, formatMoney, products } from './data.js';

const LOCAL_KEY = 'digital-heroes-demo-v1';
const steps = ['quote', 'order', 'artwork', 'proof', 'production', 'completed'];
const statusNames = { quote: 'Quote', order: 'Order received', artwork: 'Artwork', proof: 'Proof review', production: 'In production', completed: 'Completed' };
const money = formatMoney;

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"orders":[],"saved":[]}');
  } catch {
    return { orders: [], saved: [] };
  }
}

function IconMark({ className = '' }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true"><span /><span /><span /><span /></span>;
}

function ProductArtwork({ product, className = '' }) {
  return (
    <div className={`product-art art-${product.art} ${className}`} aria-label={`${product.name} product preview`}>
      <div className="art-glow" />
      {product.art === 'labels' && <><div className="sticker sticker-one">GOOD<br />THINGS</div><div className="sticker sticker-two">HERO<br /><b>01</b></div><div className="sticker sticker-three">✳</div></>}
      {product.art === 'race' && <div className="race-bib"><span>DH • RACE SERIES</span><strong>284</strong><small>RUN YOUR OWN LINE</small></div>}
      {product.art === 'mtb' && <div className="mtb-plate"><span>TRAIL / 26</span><strong>07</strong><i>RIDE<br />YOUR<br />OWN</i></div>}
      {product.art === 'stamp' && <div className="stamp-paper"><span>HEROES</span><strong>made<br />with care</strong><i>✳</i></div>}
      {product.art === 'trophy' && <div className="trophy-shape"><i>✦</i><b>NO. 01</b></div>}
      {product.art === 'laser' && <div className="laser-sign"><small>STUDIO</small><strong>GOOD<br />FORM</strong><i>◌</i></div>}
      <div className="art-grain" />
    </div>
  );
}

function Header({ page, setPage, cartCount, openLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['Shop', 'shop'], ['Our work', 'work'], ['How it works', 'how']];
  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => setPage('home')} aria-label="Digital Heroes home"><IconMark /><span>DIGITAL<br />HEROES<span className="wordmark-dot">®</span></span></button>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}>
        {links.map(([label, target]) => <button key={target} className={page === target ? 'nav-link active' : 'nav-link'} onClick={() => { setPage(target); setMenuOpen(false); }}>{label}{target === 'shop' && <ChevronDown size={13} />}</button>)}
      </nav>
      <div className="header-actions">
        <button className="header-login" onClick={openLogin}><CircleUserRound size={17} /> <span>My account</span></button>
        <button className="cart-button" onClick={() => setPage('shop')} aria-label={`Cart, ${cartCount} items`}><ShoppingBag size={18} /><span className="cart-count">{cartCount}</span></button>
      </div>
    </header>
  );
}

function ProductCard({ product, onSelect, compact = false }) {
  return (
    <button className={`product-card ${compact ? 'compact' : ''}`} onClick={() => onSelect(product)} aria-label={`Configure ${product.name}`}>
      <div className="card-art-wrap"><ProductArtwork product={product} /><span className="card-number">{String(products.indexOf(product) + 1).padStart(2, '0')}</span><span className="card-open"><ArrowUpRight size={17} /></span></div>
      <div className="card-meta"><span>{product.division}</span><span>From {money(product.basePrice)}</span></div>
      <div className="card-heading"><h3>{product.name}</h3><span>{product.icon}</span></div>
      {!compact && <p>{product.descriptor}</p>}
    </button>
  );
}

function PriceSummary({ price, quantity, compact = false }) {
  return (
    <div className={`price-summary ${compact ? 'compact' : ''}`}>
      {price.discountRate > 0 && <div className="discount-note"><Sparkles size={14} /> {Math.round(price.discountRate * 100)}% bulk saving applied</div>}
      <div className="price-total"><span>{compact ? `${quantity} pcs · incl. tax` : 'Total incl. GST'}</span><strong>{money(price.total)}</strong></div>
      {!compact && <div className="price-breakdown"><span>Subtotal <b>{money(price.subtotal)}</b></span>{price.discount > 0 && <span>Volume discount <b className="discount-value">−{money(price.discount)}</b></span>}<span>GST (18%) <b>{money(price.tax)}</b></span></div>}
    </div>
  );
}

function Configurator({ product, initial, onClose, onCheckout, addSaved }) {
  const [width, setWidth] = useState(initial?.configuration?.width ?? product.width);
  const [height, setHeight] = useState(initial?.configuration?.height ?? product.height);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 100);
  const [material, setMaterial] = useState(initial?.configuration?.material ?? product.materials[0]);
  const [designText, setDesignText] = useState(initial?.artwork?.text ?? 'MADE FOR MORE');
  const [color, setColor] = useState(initial?.artwork?.color ?? '#e95535');
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const price = useMemo(() => calculatePrice(product, width || 0, height || 0, quantity || 1), [product, width, height, quantity]);
  const colorOptions = ['#e95535', '#244d40', '#efbe55', '#24251f'];
  return (
    <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="configurator" role="dialog" aria-modal="true" aria-label={`Configure ${product.name}`}>
        <button className="close-button config-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="configure-art"><ProductArtwork product={product} /><span className="art-caption">PRODUCT 0{products.indexOf(product) + 1} <span>·</span> MADE TO YOUR SPEC</span></div>
        <div className="configure-panel">
          <div className="eyebrow"><span className="live-dot" /> BUILD YOUR ORDER <span> / {product.division.toUpperCase()}</span></div>
          <h2>{product.name}<br /><span>your way.</span></h2>
          <p className="configure-intro">{product.descriptor} Choose your specs and see your price update live.</p>
          <div className="spec-row">
            <label>Width <div className="measure-input"><input aria-label="Width in centimeters" type="number" min="2" max="60" value={width} onChange={(e) => setWidth(e.target.value)} /><span>cm</span></div></label>
            <span className="dimension-x">×</span>
            <label>Height <div className="measure-input"><input aria-label="Height in centimeters" type="number" min="2" max="60" value={height} onChange={(e) => setHeight(e.target.value)} /><span>cm</span></div></label>
          </div>
          <label className="field-label">Choose your material</label>
          <div className="material-options">{product.materials.map((option) => <button key={option} className={material === option ? 'material-option selected' : 'material-option'} onClick={() => setMaterial(option)}>{option}{material === option && <Check size={14} />}</button>)}</div>
          <div className="quantity-row"><label htmlFor="quantity">Quantity</label><div className="quantity-stepper"><button onClick={() => setQuantity(Math.max(1, Number(quantity) - 25))} aria-label="Decrease quantity"><Minus size={14} /></button><input id="quantity" type="number" min="1" max="10000" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))} /><button onClick={() => setQuantity(Math.min(10000, Number(quantity) + 25))} aria-label="Increase quantity"><Plus size={14} /></button></div><span className="quantity-hint">Volume savings at 100+</span></div>
          <div className="design-tools">
            <div className="design-tools-head"><div><span>02 / MAKE IT YOURS</span><h3>Your artwork</h3></div><button onClick={() => setEditing(!editing)} className="edit-toggle"><Settings2 size={14} /> {editing ? 'Done' : 'Edit design'}</button></div>
            <div className="mini-canvas" style={{ '--art-color': color }}><div className="canvas-print-zone"><small>SAFE PRINT AREA</small>{file ? <span className="uploaded-name"><FileImage size={16} />{file}</span> : <strong>{designText || 'YOUR DESIGN'}</strong>}</div></div>
            {editing && <div className="design-editor"><input aria-label="Artwork text" value={designText} onChange={(e) => setDesignText(e.target.value.slice(0, 28))} maxLength="28" placeholder="Type your artwork" /><div className="color-options" aria-label="Design color">{colorOptions.map((swatch) => <button key={swatch} style={{ background: swatch }} className={color === swatch ? 'color-swatch selected' : 'color-swatch'} onClick={() => setColor(swatch)} aria-label={`Choose ${swatch}`} />)}</div></div>}
            <label className="upload-button"><Upload size={15} />{file ? 'Replace artwork' : 'Upload finished artwork'}<input type="file" accept=".pdf,.svg,.ai,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} /></label>
          </div>
          <PriceSummary price={price} quantity={quantity} />
          <div className="configure-ctas"><button className="button button-dark" onClick={() => onCheckout({ product, width, height, quantity, material, price, artwork: { text: designText, color, file } })}>Continue to order <ArrowRight size={16} /></button><button className="save-design" onClick={() => addSaved({ productId: product.id, name: designText || product.name, color, text: designText })}><Heart size={16} /> Save design</button></div>
          <p className="secure-note"><ShieldCheck size={13} /> Every order includes a proof to approve before print.</p>
        </div>
      </section>
    </div>
  );
}

function Checkout({ cart, onClose, onPlaceOrder }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onPlaceOrder({ ...cart, customerName: name.trim(), customerEmail: email.trim(), notes: notes.trim() });
    setLoading(false);
    if (result?.error) setError(result.error);
  };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Place your order">
      <button className="close-button config-close" onClick={onClose} aria-label="Close"><X /></button>
      <div className="checkout-copy"><div className="eyebrow">ALMOST YOURS <span>/ STEP 03</span></div><h2>Make it<br /><span>official.</span></h2><p>Your artwork isn't sent to print just yet. We'll share a digital proof for your approval first.</p><div className="checkout-summary"><ProductArtwork product={cart.product} className="checkout-product-art" /><div><b>{cart.product.name}</b><span>{cart.width} × {cart.height} cm · {cart.material}</span><span>{cart.quantity} pieces</span></div></div><PriceSummary price={cart.price} quantity={cart.quantity} compact /></div>
      <form className="checkout-form" onSubmit={submit}><div className="eyebrow">YOUR DETAILS <span>/ SAFE & SECURE</span></div><h3>Where should we<br />send your proof?</h3>
        <label>Full name<input required minLength="2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" /></label>
        <label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@example.com" /></label>
        <label>Anything we should know? <span className="optional">OPTIONAL</span><textarea rows="3" maxLength="500" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Event date, delivery details, or a note for our team..." /></label>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="button button-orange full-width" type="submit" disabled={loading}>{loading ? 'Placing order…' : 'Place order'} <ArrowRight size={16} /></button>
        <p className="secure-note"><ShieldCheck size={13} /> No payment yet — approve your proof first.</p>
      </form>
    </section>
  </div>;
}

function LoginModal({ onClose, onLogin, dbEnabled }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onLogin({ mode, fullName, email, password });
    setLoading(false);
    if (result?.error) setError(result.error);
    else onClose();
  };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="login-modal" role="dialog" aria-modal="true" aria-label="Customer account">
    <button className="close-button config-close" onClick={onClose} aria-label="Close"><X /></button><IconMark /><div className="eyebrow">YOUR PRINTWORKS ACCOUNT</div><h2>{mode === 'login' ? 'Welcome back.' : 'Make room for good ideas.'}</h2><p>{dbEnabled ? 'Sign in to manage proofs, designs and orders.' : 'Try the customer account demo. Your sample orders stay in this browser.'}</p>
    <form className="login-form" onSubmit={submit}>{mode === 'register' && <label>Full name<input required minLength="2" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" /></label>}<label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input required type="password" minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button button-dark full-width" disabled={loading}>{loading ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></button></form>
    <button className="text-button login-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
  </section></div>;
}

function Dashboard({ orders, saved, isAdmin, onProof, onReorder, onAdminStatus, onPay, onDownload, onVariableData, dbEnabled, paymentsEnabled, setPage }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const filtered = orders.filter((order) => {
    const matchesText = `${order.order_number ?? order.id} ${order.product_name ?? order.product?.name} ${order.customer_name ?? ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesText && (filter === 'all' || order.status === filter);
  });
  const setStage = async (order, status) => {
    const result = await onAdminStatus(order, status);
    setMessage(result?.error ?? result?.message ?? 'Production status updated.');
    window.setTimeout(() => setMessage(''), 3500);
  };
  return <main className="dashboard-page"><div className="dashboard-top"><div><div className="eyebrow"><span className="live-dot" /> {isAdmin ? 'STUDIO OPERATIONS' : 'YOUR ACCOUNT'}</div><h1>{isAdmin ? 'The workbench.' : 'Good to see you.'}</h1><p>{isAdmin ? 'Your production floor, from a single clear view.' : 'Your projects, proofs and little details — all in one place.'}</p></div><button className="button button-dark" onClick={() => setPage('shop')}>Start something new <ArrowRight size={15} /></button></div>
    {message && <div className="dashboard-notice"><BadgeCheck size={16} />{message}</div>}
    <div className="dashboard-stats">{(isAdmin ? [['OPEN JOBS', orders.filter((order) => order.status !== 'completed').length], ['IN PRODUCTION', orders.filter((order) => order.status === 'production').length], ['COMPLETED', orders.filter((order) => order.status === 'completed').length], ['TOTAL ORDERS', orders.length]] : [['TOTAL PROJECTS', orders.length], ['NEEDS YOUR EYES', orders.filter((order) => order.proof_state === 'pending' || !order.proof_state).length], ['SAVED DESIGNS', saved.length], ['COMPLETED', orders.filter((order) => order.status === 'completed').length]]).map(([label, value], index) => <div className="stat-card" key={label}><span>{label}</span><strong>{String(value).padStart(2, '0')}</strong><i>{['↗', '✳', '○', '✓'][index]}</i></div>)}</div>
    <div className="orders-toolbar"><div><h2>{isAdmin ? 'Production pipeline' : 'Your orders'}</h2><span>{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span></div><div className="toolbar-filters"><label className="search-field"><Search size={16} /><input placeholder="Find an order…" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All stages</option>{steps.map((step) => <option value={step} key={step}>{statusNames[step]}</option>)}</select></div></div>
    <div className="order-list">{filtered.map((order) => {
      const product = products.find((item) => item.id === (order.product_id ?? order.productId ?? order.product?.id)) ?? products[0];
      const status = order.status ?? 'proof';
      const state = order.proof_state ?? order.proofState ?? 'pending';
      return <article className="order-card" key={order.id ?? order.order_number}><ProductArtwork product={product} className="order-art" /><div className="order-main"><div className="order-id">{order.order_number ?? order.id}<span>{new Date(order.created_at ?? order.createdAt ?? Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div><h3>{product.name}</h3><p>{order.configuration?.width ?? order.width ?? product.width} × {order.configuration?.height ?? order.height ?? product.height} cm <i /> {Number(order.quantity).toLocaleString('en-IN')} pcs <i /> {order.configuration?.material ?? order.material ?? product.materials[0]}</p>{isAdmin && <small className="customer-email">{order.customer_name ?? order.customerName ?? 'Customer'} · {order.customer_email ?? order.customerEmail}</small>}<div className="pipeline-line">{steps.map((step, index) => { const complete = steps.indexOf(status) >= index; return <span key={step} className={`${complete ? 'step-done' : ''} ${status === step ? 'step-current' : ''}`} title={statusNames[step]} />; })}</div></div><div className="order-side"><span className={`status-pill status-${status}`}>{statusNames[status] ?? status}</span><strong>{money(order.total ?? order.price?.total ?? 0)}</strong><span className="proof-status">{state === 'approved' ? 'Proof approved' : state === 'changes_requested' ? 'Changes requested' : 'Proof v' + (order.proof_version ?? 1)}</span></div>
      <div className="order-actions">{isAdmin ? <><select aria-label={`Update status for ${order.order_number}`} value={status} onChange={(e) => setStage(order, e.target.value)}>{steps.map((step) => <option key={step} value={step}>{statusNames[step]}</option>)}</select>{state === 'approved' && dbEnabled && <><button className="icon-action" onClick={() => onDownload(order)} title="Download production PDF and PNG"><Download size={15} /></button><label className="icon-action" title="Merge CSV into per-row production artwork"><FileText size={15} /><input aria-label="Upload CSV for variable-data merge" type="file" accept=".csv,text/csv" className="visually-hidden-file" onChange={(e) => { if (e.target.files?.[0]) onVariableData(order, e.target.files[0]); e.target.value = ''; }} /></label></>}</> : <>{state === 'pending' && <button className="button button-orange small-button" onClick={() => onProof(order, 'approved')}>Approve proof <Check size={14} /></button>}{state === 'pending' && <button className="icon-action" onClick={() => onProof(order, 'changes_requested')} title="Request proof changes"><ArrowLeft size={15} /></button>}{state === 'approved' && paymentsEnabled && order.payment_status !== 'paid' && <button className="button button-orange small-button" onClick={() => onPay(order)}>Pay now <ArrowRight size={14} /></button>}{state === 'approved' && order.payment_status === 'paid' && <span className="status-pill status-production">Paid</span>}<button className="icon-action" onClick={() => onReorder(order)} title="Reorder this product"><PackageCheck size={15} /></button></>}</div>
      </article>;
    })}{filtered.length === 0 && <div className="empty-orders"><PackageCheck size={25} /><h3>{orders.length ? 'Nothing matches just yet.' : 'Your next big idea starts here.'}</h3><p>{orders.length ? 'Try another search or stage.' : 'Once you place your first order, its proof and progress will find a home right here.'}{!orders.length && <button className="text-button" onClick={() => setPage('shop')}>Explore the collection <ArrowRight size={14} /></button>}</p></div>}</div>
    <section className="saved-section"><div className="section-title-small"><div><span>FROM YOUR DESK</span><h2>Saved designs</h2></div><span>{saved.length} saved</span></div>{saved.length ? <div className="saved-cards">{saved.map((item, index) => { const product = products.find((entry) => entry.id === item.productId) ?? products[0]; return <button className="saved-card" key={item.id ?? index} onClick={() => onReorder({ productId: product.id, product, quantity: 100, configuration: {}, artwork: item, total: 0 })}><ProductArtwork product={product} /><div><b>{item.name || product.name}</b><span>{product.name} <ArrowRight size={13} /></span></div></button>; })}</div> : <p className="saved-empty">Good ideas worth keeping? Save a design from the configurator and it will be waiting here.</p>}</section>
    {!dbEnabled && <div className="demo-notice"><ShieldCheck size={16} /><span><b>DEMO WORKSPACE</b> Your sample orders are saved only in this browser. Connect Supabase for secure accounts and persistent production data.</span></div>}
  </main>;
}

function Footer({ setPage }) {
  return <footer className="site-footer"><button className="footer-wordmark" onClick={() => setPage('home')}><IconMark /> DIGITAL HEROES®</button><span>GOOD PRINT MAKES GOOD THINGS HAPPEN.</span><div><button onClick={() => setPage('shop')}>Shop all</button><button onClick={() => setPage('account')}>Your account</button></div><small>© 2026 DIGITAL HEROES · MADE WITH INTENTION.</small></footer>;
}

export default function App() {
  const [page, setPage] = useState('home');
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [orders, setOrders] = useState(() => readStore().orders);
  const [saved, setSaved] = useState(() => readStore().saved);
  const [admin, setAdmin] = useState(false);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [reorderDefaults, setReorderDefaults] = useState(null);
  const [notice, setNotice] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All work');
  const [query, setQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ orders, saved }));
  }, [orders, saved]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const healthResponse = await fetch('/api');
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          if (active) {
            setDbEnabled(Boolean(health.databaseConfigured));
            setPaymentsEnabled(Boolean(health.paymentsConfigured));
          }
        }
        const paymentState = new URLSearchParams(window.location.search).get('payment');
        if (active && paymentState === 'success') setNotice('Payment received. Your order is moving into production.');
        if (active && paymentState === 'cancelled') setNotice('Payment was cancelled. Your approved proof is still saved.');
        const token = localStorage.getItem('dh_access_token');
        if (!token) return;
        const [ordersResponse, profileResponse, designsResponse] = await Promise.all([
          fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/designs', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (ordersResponse.ok && active) setOrders((await ordersResponse.json()).orders);
        if (profileResponse.ok && active) setAdmin((await profileResponse.json()).role === 'admin');
        if (designsResponse.ok && active) {
          const { designs } = await designsResponse.json();
          setSaved(designs.map((design) => ({ id: design.id, productId: design.product_id, name: design.name, ...(design.artwork ?? {}) })));
        }
      } catch {
        if (active) setNotice('The account service is unavailable. You can still explore demo mode.');
      }
    };
    initialize();
    return () => { active = false; };
  }, []);

  const visibleProducts = products.filter((product) => (selectedDivision === 'All work' || product.division === selectedDivision) && `${product.name} ${product.division}`.toLowerCase().includes(query.toLowerCase()));
  const flash = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200); };
  const saveDesign = async (item) => {
  if (dbEnabled) {
    const token = localStorage.getItem('dh_access_token');
    if (!token) return flash('Sign in before saving a design.');
    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: item.productId, name: item.name, artwork: { text: item.text, color: item.color } }),
      });
      const result = await response.json();
      if (!response.ok) return flash(result.error || 'We could not save this design.');
      setSaved((current) => [result.design, ...current]);
      return flash('Saved to your designs.');
    } catch {
      return flash('We could not reach the design service. Please try again.');
    }
  };
  setSaved((current) => [{ ...item, id: crypto.randomUUID() }, ...current]);
  flash('Saved to your designs.');
  };

  const placeOrder = async (details) => {
    if (!details.customerEmail || !details.customerName) return { error: 'Please enter your name and a valid email address.' };
    const apiStatus = await fetch('/api').then((r) => r.ok ? r.json() : null).catch(() => null);
    if (apiStatus?.databaseConfigured) {
      const token = localStorage.getItem('dh_access_token');
      if (!token) return { error: 'Sign in to place an order. Your details are ready — open My account first.' };
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ configuration: { productId: details.product.id, width: details.width, height: details.height, quantity: details.quantity, material: details.material }, artwork: { ...details.artwork, notes: details.notes } }),
        });
        const data = await response.json();
        if (!response.ok) return { error: data.error || 'We could not place the order.' };
        if (data.checkoutUrl) window.location.assign(data.checkoutUrl);
        setOrders((current) => [data.order, ...current]);
        setCart(null);
        setSelected(null);
        setPage('account');
        return {};
      } catch {
        return { error: 'We could not reach the order service. Please try again.' };
      }
    }
    const record = {
      id: `DH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      order_number: `DH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      product_id: details.product.id,
      product_name: details.product.name,
      customer_name: details.customerName,
      customer_email: details.customerEmail,
      configuration: { width: details.width, height: details.height, material: details.material },
      artwork: { ...details.artwork, notes: details.notes },
      quantity: Number(details.quantity),
      subtotal: details.price.subtotal,
      discount: details.price.discount,
      tax: details.price.tax,
      total: details.price.total,
      status: 'proof',
      proof_state: 'pending',
      proof_version: 1,
      created_at: new Date().toISOString(),
    };
    setOrders((current) => [record, ...current]);
    setCart(null);
    setSelected(null);
    setPage('account');
    flash('Your order is in. Your proof will be ready for review here.');
    return {};
  };

  const signIn = async ({ mode, fullName, email, password }) => {
    if (!dbEnabled) {
      setAdmin(email.toLowerCase().includes('admin'));
      flash(email.toLowerCase().includes('admin') ? 'Demo studio view enabled.' : 'You’re in. Welcome to your demo account.');
      return {};
    }
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'We could not sign you in.' };
      if (data.confirmationRequired) return { error: 'Check your email to confirm your new account, then sign in.' };
      localStorage.setItem('dh_access_token', data.accessToken);
      const result = await fetch('/api/orders', { headers: { Authorization: `Bearer ${data.accessToken}` } });
      if (result.ok) setOrders((await result.json()).orders);
      const [profileResponse, designsResponse] = await Promise.all([
        fetch('/api/me', { headers: { Authorization: `Bearer ${data.accessToken}` } }),
        fetch('/api/designs', { headers: { Authorization: `Bearer ${data.accessToken}` } }),
      ]);
      if (profileResponse.ok) setAdmin((await profileResponse.json()).role === 'admin');
      if (designsResponse.ok) {
        const { designs } = await designsResponse.json();
        setSaved(designs.map((design) => ({ id: design.id, productId: design.product_id, name: design.name, ...(design.artwork ?? {}) })));
      }
      flash('You are signed in.');
      return {};
    } catch {
      return { error: 'We could not reach the sign-in service. Please try again.' };
    }
  };

  const handleProof = async (order, action) => {
    if (dbEnabled) {
      const token = localStorage.getItem('dh_access_token');
      if (!token) return flash('Sign in before approving your proof.');
      const response = await fetch(`/api/orders/${order.id}/proof`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) return flash(result.error || 'Proof update failed.');
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
    } else {
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, proof_state: action, status: action === 'approved' ? 'production' : 'proof', proof_version: action === 'changes_requested' ? item.proof_version + 1 : item.proof_version } : item));
    }
    flash(action === 'approved' ? 'Proof approved — your print is cleared for production.' : 'Change request added. A new proof version is ready to review.');
  };

  const updateStatus = async (order, status) => {
    if (dbEnabled) {
      const token = localStorage.getItem('dh_access_token');
      const response = await fetch(`/api/orders/${order.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) return { error: result.error };
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      return { message: 'Production status updated.' };
    }
    if (status === 'production' && (order.proof_state ?? order.proofState) !== 'approved') return { error: 'Approve the proof before moving this job to production.' };
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
    return { message: 'Production status updated.' };
  };

  const reorder = (order) => {
    const product = products.find((entry) => entry.id === (order.productId ?? order.product_id ?? order.product?.id));
    if (!product) return;
    setReorderDefaults(order);
    setSelected(product);
    setPage('shop');
    flash('Your previous product is ready to configure again.');
  };

  const payForOrder = async (order) => {
    const token = localStorage.getItem('dh_access_token');
    if (!token) return flash('Sign in before paying for your order.');
    try {
      const response = await fetch(`/api/orders/${order.id}/checkout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) return flash(result.error || 'We could not start checkout.');
      window.location.assign(result.checkoutUrl);
    } catch {
      flash('We could not reach checkout. Please try again.');
    }
  };

  const downloadProduction = async (order) => {
    const token = localStorage.getItem('dh_access_token');
    try {
      const response = await fetch(`/api/orders/${order.id}/files`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const result = await response.json();
        return flash(result.error || 'We could not download production files.');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${order.order_number}_production.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      flash('We could not reach the production-file service.');
    }
  };

  const generateVariableFiles = async (order, file) => {
    if (file.size > 500_000) return flash('Please choose a CSV smaller than 500 KB.');
    try {
      const response = await fetch(`/api/orders/${order.id}/variable-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('dh_access_token')}` },
        body: JSON.stringify({ csv: await file.text() }),
      });
      if (!response.ok) {
        const result = await response.json();
        return flash(result.error || 'We could not merge this CSV.');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${order.order_number}_variable_artwork.zip`;
      link.click();
      URL.revokeObjectURL(url);
      flash('Variable-data production files are ready.');
    } catch {
      flash('We could not reach the variable-data service.');
    }
  };

  return <>
    <Header page={page} setPage={setPage} cartCount={cart ? 1 : 0} openLogin={() => setLoginOpen(true)} />
    {page === 'home' && <>
      <main>
        <section className="hero-section"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> YOUR IDEA, ALL THE WAY TO PRINT.</div><h1>Make good<br />things <span>real.</span></h1><p>From the first spark to the final print — thoughtful, custom-made printwork for people with something to say.</p><div className="hero-actions"><button className="button button-dark" onClick={() => setPage('shop')}>Find your print <ArrowRight size={16} /></button><button className="button button-quiet" onClick={() => setPage('how')}><span className="play-dot">↗</span> See how it works</button></div><div className="hero-footnote"><div className="avatar-stack"><span>A</span><span>M</span><span>J</span><i>✳</i></div><span><b>Made with you, not just for you.</b><br />A real proof before every print.</span></div></div>
          <div className="hero-visual"><div className="hero-image-card"><div className="hero-scene-top"><span>OBJECTS WITH A LITTLE MORE MEANING</span><span>FIG. 01 — 06</span></div><div className="hero-composition"><div className="scene-sticker">GOOD<br /><span>FORM</span><b>®</b></div><div className="scene-bib"><small>RACE / SERIES 06</small><strong>284</strong><i>FIND YOUR<br />OWN PACE</i></div><div className="scene-sign"><div>STUDIO<br /><b>NO. 04</b></div><span>✳</span></div><div className="scene-circle">MAKE<br />ROOM<br /><span>FOR<br />GOOD.</span></div><div className="scene-caption-card">YOUR IDEA<br /><strong>IN GOOD<br />COMPANY.</strong></div><div className="hero-orbit"><span>MADE TO STICK · MADE TO LAST · MADE WITH YOU</span></div></div><div className="hero-image-foot"><span>PRINTED WITH PURPOSE</span><span>51° 30' N · EVERYWHERE</span></div></div><div className="floating-note"><span className="floating-note-icon"><Sparkles size={18} /></span><span>Good things<br /><b>get made.</b></span></div><div className="hero-vertical-label">A LITTLE LESS ORDINARY — SINCE DAY ONE</div></div>
        </section>
        <div className="trust-strip"><span>THE LITTLE DETAILS MATTER</span><div><span><Check size={14} /> A real proof before we print</span><span><Check size={14} /> Made to your measurements</span><span><Check size={14} /> People here to help</span></div><span>INDEPENDENT BY DESIGN</span></div>
        <section className="collection-section" id="collection"><div className="section-heading"><div><div className="eyebrow">THE GOOD STUFF <span>/ SIX WAYS TO MAKE IT YOURS</span></div><h2>A good idea has<br />a lot of <span>formats.</span></h2></div><button className="text-button" onClick={() => setPage('shop')}>See all printwork <ArrowRight size={15} /></button></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onSelect={(item) => { setSelected(item); setPage('shop'); }} />)}</div></section>
        <section className="manifesto-section"><div className="manifesto-symbol">“</div><div><span className="eyebrow">PRINT THAT GETS THE POINT.</span><h2>Not another tab in a catalogue.<br /><span>Your idea, made real.</span></h2><p>Six specialist print divisions. One human team. A proper digital proof to approve before the ink hits paper.</p></div><button className="button button-orange" onClick={() => setPage('how')}>A little about us <ArrowUpRight size={16} /></button><div className="manifesto-tape">PRINTED<br />WITH INTENTION</div></section>
        <section className="work-section"><div className="work-image-stack"><div className="work-tile work-stamp"><span>GOOD<br /><b>ENERGY</b></span><i>®</i></div><div className="work-tile work-race"><small>DH / RACE SERIES</small><strong>284</strong><span>GO YOUR OWN WAY →</span></div><div className="work-tile work-trophy"><i>✳</i><b>WELL<br />DONE.</b></div></div><div className="work-copy"><div className="eyebrow">REAL PEOPLE. REAL PRINT. <span>/ SINCE THE FIRST SPARK</span></div><h2>Proof that good<br />work speaks <span>up.</span></h2><p>Big race. Little brand. The thing you haven't thought of yet. Whatever you've got in mind, we're here for the hands-on part.</p><div className="work-stats"><div><strong>06</strong><span>PRINT DIVISIONS</span></div><div><strong>01</strong><span>VERY HUMAN TEAM</span></div><div><strong>∞</strong><span>WAYS TO MAKE IT YOURS</span></div></div><button className="button button-dark" onClick={() => setPage('work')}>See what we make <ArrowRight size={15} /></button></div></section>
        <section className="cta-section"><div className="eyebrow"><span className="live-dot" /> GOT A GOOD ONE?</div><h2>Let's make it<br /><span>something.</span></h2><button className="button button-light" onClick={() => setPage('shop')}>Start with an idea <ArrowRight size={16} /></button><div className="cta-rings"><i /><i /><i /><b>DH<br />®</b></div><span className="cta-side-note">A LITTLE SOMETHING<br />GOES A LONG WAY.</span></section>
      </main><Footer setPage={setPage} />
    </>}
    {page === 'shop' && <main className="shop-page"><div className="shop-heading"><div className="eyebrow"><span className="live-dot" /> MAKE IT YOURS <span>/ 01 — 06</span></div><div className="shop-title-line"><h1>Whats are we<br />making <span>today?</span></h1><p>Six ways to make an idea real. Choose what fits, make it yours, and see what it'll cost — instantly.</p></div><div className="shop-controls"><div className="division-tabs"><button className={selectedDivision === 'All work' ? 'active' : ''} onClick={() => setSelectedDivision('All work')}>All work <span>06</span></button>{products.map((product) => <button key={product.division} className={selectedDivision === product.division ? 'active' : ''} onClick={() => setSelectedDivision(product.division)}>{product.division}</button>)}</div><label className="search-field shop-search"><Search size={16} /><input aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find your print…" /></label></div></div><div className="product-grid shop-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelected} />)}</div>{visibleProducts.length === 0 && <div className="empty-orders"><Search size={23} /><h3>No printwork found.</h3><p>Try a different search or product family.</p></div>}<div className="proof-callout"><span><ShieldCheck size={22} /></span><div><b>Nothing prints without your say-so.</b><p>Every order comes with a digital proof for you to approve first.</p></div><button className="text-button" onClick={() => setPage('how')}>How it works <ArrowRight size={14} /></button></div></main>}
    {page === 'work' && <main className="gallery-page"><div className="eyebrow">GOOD WORK, OUT IN THE WORLD <span>/ MADE WITH YOU</span></div><div className="gallery-heading"><h1>Things we're<br />proud to <span>make.</span></h1><p>A little collection of the details, deadlines and big ideas we've helped bring to life.</p></div><div className="division-tabs gallery-tabs"><button className={selectedDivision === 'All work' ? 'active' : ''} onClick={() => setSelectedDivision('All work')}>All work <span>06</span></button>{products.map((product) => <button key={product.division} onClick={() => setSelectedDivision(product.division)} className={selectedDivision === product.division ? 'active' : ''}>{product.division}</button>)}</div><div className="gallery-grid">{products.filter((product) => selectedDivision === 'All work' || product.division === selectedDivision).map((product, index) => <button className={`gallery-card gallery-card-${index % 3}`} key={product.id} onClick={() => { setSelected(product); setPage('shop'); }}><ProductArtwork product={product} /><div><span>{product.division} / 0{index + 1}</span><h3>{['A sticker that sticks around.', 'Race day, reimagined.', 'A little thing to celebrate.'][index % 3]}</h3><span>EXPLORE THE PRODUCT <ArrowUpRight size={13} /></span></div></button>)}</div></main>}
    {page === 'how' && <main className="how-page"><div className="eyebrow"><span className="live-dot" /> THE PROCESS <span>/ NICE AND SIMPLE, PROMISE</span></div><h1>From idea to<br /><span>in your hands.</span></h1><p className="how-intro">No mystery, no waiting for a quote. Just good people, clear steps, and the print you had in mind.</p><div className="how-steps">{[['01', 'Pick your print.', 'Choose a product, set the size and quantity, and watch your price update as you go.', <Settings2 />], ['02', 'Make it yours.', 'Design something right here or send us the artwork you already love. The choice is yours.', <Layers3 />], ['03', 'Give the proof a look.', 'We send a digital proof for your approval. Need a tweak? Just tell us before anything prints.', <FileImage />], ['04', 'We make it happen.', 'Once you’re happy, your job goes into production. Follow every step from your account.', <Truck />]].map(([number, title, copy, icon]) => <article key={number}><span className="how-number">{number}</span><span className="how-icon">{icon}</span><h2>{title}</h2><p>{copy}</p><i>→</i></article>)}</div><div className="how-bottom"><div><span>GOOD PRINT IS A TEAM SPORT.</span><h2>You bring the idea.<br /><span>We've got the rest.</span></h2></div><button className="button button-dark" onClick={() => setPage('shop')}>Find your print <ArrowRight size={15} /></button></div></main>}
    {page === 'account' && <Dashboard orders={orders} saved={saved} isAdmin={admin} onProof={handleProof} onReorder={reorder} onAdminStatus={updateStatus} onPay={payForOrder} onDownload={downloadProduction} onVariableData={generateVariableFiles} dbEnabled={dbEnabled} paymentsEnabled={paymentsEnabled} setPage={setPage} />}
    {page !== 'home' && page !== 'account' && <Footer setPage={setPage} />}
    {selected && <Configurator product={selected} initial={reorderDefaults} onClose={() => { setSelected(null); setReorderDefaults(null); }} onCheckout={(item) => setCart(item)} addSaved={saveDesign} />}
    {cart && <Checkout cart={cart} onClose={() => setCart(null)} onPlaceOrder={placeOrder} />}
    {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={signIn} dbEnabled={dbEnabled} />}
    {notice && <div className="toast-message" role="status"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}
  </>;
}
