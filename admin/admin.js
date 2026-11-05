function formatProductBadge(badge) {
  return '';
}

function resolveAdminImgPath(src) {
  if (!src) return '../assets/images/logo.png';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('../')) {
    return src;
  }
  if (src.startsWith('/')) {
    return '..' + src;
  }
  return '../' + src;
}

// Modern Sleek Action SVGs (Feather / Lucide Outline)
const SVG_ICONS = {
  receipt: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>`,
  whatsapp: `<svg width="15" height="15" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`,
  phone: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
};



/**
 * ==========================================================================
 * REV MOTO — Modern Responsive Admin Engine (Supabase + Local Fallback)
 * Includes: Period Time Filters (Daily / Monthly / Annual / All),
 *           Pagination, and 80mm Thermal Paper Receipt (POS)
 * ==========================================================================
 */

// Global State
let supabaseClient = null;
let ordersList = [];
let activeFilter = 'all'; // status filter: 'all' | 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'
let periodMode = 'daily'; // 'daily' | 'monthly' | 'annual' | 'all'
let periodDate = new Date(); // active filter date reference
let includeCarryover = false; // whether to include carryover undelivered orders in table
let searchQuery = '';
let soundEnabled = true;
let currentSelectedOrder = null;
let currentReceiptOrder = null;
let currentPage = 1;
let pageSize = 10;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Dynamic Date Helpers for Sample Orders
const NOW = new Date();
const timeAgo = (mins = 0, hours = 0, days = 0, months = 0) => {
  const d = new Date(NOW.getTime());
  if (months) d.setMonth(d.getMonth() - months);
  if (days) d.setDate(d.getDate() - days);
  if (hours) d.setHours(d.getHours() - hours);
  if (mins) d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
};

// Initial Sample Orders for Rev Moto
const DEFAULT_SAMPLE_ORDERS = [
  // ── TODAY'S ORDERS ──
  {
    id: 'INV-14',
    customer_name: 'Shahid Afridi',
    phone: '03095369472',
    email: 'shahid.afridi@gmail.com',
    address: 'House # 18, Lane # 17, Sector F-10/3',
    city: 'Islamabad',
    notes: 'Please call before delivery. Rider will pay cash on delivery.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Armored Mesh Riding Jacket', size: 'L (41–43")', qty: 1, price: 14500 }
    ],
    total_amount: 14850,
    status: 'pending',
    created_at: timeAgo(25, 0, 0, 0)
  },
  {
    id: 'INV-13',
    customer_name: 'Kamran Akmal',
    phone: '03214567890',
    email: 'kamran.akmal@gmail.com',
    address: 'Street 4, Sector G-11/2',
    city: 'Islamabad',
    notes: 'Urgent weekend tour planned, please dispatch early.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Express Priority Dispatch',
    delivery_cost: 450,
    items: [
      { name: 'Carbon Knuckle Street Gloves', size: 'XL (10–10.5")', qty: 1, price: 5800 },
      { name: 'Thermal Windproof Balaclava', size: 'Universal', qty: 1, price: 1850 }
    ],
    total_amount: 8100,
    status: 'pending',
    created_at: timeAgo(50, 1, 0, 0)
  },
  {
    id: 'INV-12',
    customer_name: 'Bilal Haider',
    phone: '03001234567',
    email: 'bilal.h@gmail.com',
    address: 'House 42-B, Sector F-7/2',
    city: 'Islamabad',
    notes: 'Call 15 mins prior to arrival.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Waterproof Touring Pants', size: '34 (Large)', qty: 1, price: 11500 }
    ],
    total_amount: 11850,
    status: 'confirmed',
    created_at: timeAgo(15, 3, 0, 0)
  },

  // ── YESTERDAY'S ORDERS ──
  {
    id: 'INV-11',
    customer_name: 'Usman Tariq',
    phone: '03219876543',
    email: 'usman.moto@yahoo.com',
    address: 'Flat 402, Al-Razi Heights, Gulberg III',
    city: 'Lahore',
    notes: 'Leave package with building security if unavailable.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Carbon Knuckle Street Gloves', size: 'L (9–9.5")', qty: 1, price: 5800 },
      { name: 'Heavyweight Rider T-Shirt', size: 'L', qty: 2, price: 3200 }
    ],
    total_amount: 12550,
    status: 'confirmed',
    created_at: timeAgo(0, 10, 1, 0)
  },
  {
    id: 'INV-10',
    customer_name: 'Hamza Khan',
    phone: '03335551234',
    email: 'hamza.k@gmail.com',
    address: 'Plot 18, Street 4, Phase 6 DHA',
    city: 'Karachi',
    notes: 'Verify size exchange policy on arrival.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'All-Weather Armored Riding Jacket', size: 'XL (44–46")', qty: 1, price: 18500 }
    ],
    total_amount: 18850,
    status: 'dispatched',
    created_at: timeAgo(0, 16, 1, 0)
  },

  // ── EARLIER THIS WEEK / THIS MONTH ──
  {
    id: 'INV-9',
    customer_name: 'Danyal Baig',
    phone: '03129988776',
    email: 'danyal.b@gmail.com',
    address: 'House 88, Street 12, Cavalry Ground',
    city: 'Lahore',
    notes: 'Cash ready at doorstep.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Magnetic Tank & Tail Bag 18L', size: '18 Liter', qty: 1, price: 9200 }
    ],
    total_amount: 9550,
    status: 'dispatched',
    created_at: timeAgo(0, 0, 3, 0)
  },
  {
    id: 'INV-8',
    customer_name: 'Ahmed Raza',
    phone: '03456677889',
    email: 'ahmed.raza@outlook.com',
    address: 'Near Model Town Park, Circular Road',
    city: 'Sialkot',
    notes: 'Deliver before 5 PM.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Local Priority Rider Dispatch',
    delivery_cost: 250,
    items: [
      { name: 'Kevlar Reinforced Riding Jeans', size: '32 (Medium)', qty: 1, price: 9800 }
    ],
    total_amount: 10050,
    status: 'delivered',
    created_at: timeAgo(0, 0, 4, 0)
  },
  {
    id: 'INV-7',
    customer_name: 'Farhan Ali',
    phone: '03023344556',
    email: 'farhan.ali@gmail.com',
    address: 'B-14, Phase 2 Hayatabad',
    city: 'Peshawar',
    notes: 'Call recipient upon courier arrival.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Armored Mesh Riding Jacket', size: 'M (38–40")', qty: 1, price: 14500 },
      { name: 'Carbon Knuckle Street Gloves', size: 'M (8–8.5")', qty: 1, price: 5800 }
    ],
    total_amount: 20650,
    status: 'delivered',
    created_at: timeAgo(0, 0, 5, 0)
  },
  {
    id: 'INV-6',
    customer_name: 'Zain Ul Abideen',
    phone: '03451122334',
    email: 'zain.abideen@gmail.com',
    address: 'Street 9, Satellite Town',
    city: 'Rawalpindi',
    notes: 'Order confirmed by customer over phone.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Magnetic Tank & Tail Bag 18L', size: '18 Liter', qty: 1, price: 9200 }
    ],
    total_amount: 9550,
    status: 'delivered',
    created_at: timeAgo(0, 0, 10, 0)
  },
  {
    id: 'INV-5',
    customer_name: 'Omer Farooq',
    phone: '03134455667',
    email: 'omer.farooq@live.com',
    address: 'Madina Town, Susan Road',
    city: 'Faisalabad',
    notes: 'Customer requested size check assistance.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Heavyweight Rider T-Shirt', size: 'XL', qty: 3, price: 3200 }
    ],
    total_amount: 9950,
    status: 'delivered',
    created_at: timeAgo(0, 0, 14, 0)
  },
  {
    id: 'INV-4',
    customer_name: 'Waleed Malik',
    phone: '03087788990',
    email: 'waleed.m@gmail.com',
    address: 'Cantt Area, Mall Road',
    city: 'Multan',
    notes: 'Customer changed travel plans, cancelled before dispatch.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'All-Weather Armored Riding Jacket', size: 'L (41–43")', qty: 1, price: 18500 }
    ],
    total_amount: 18850,
    status: 'cancelled',
    created_at: timeAgo(0, 0, 18, 0)
  },

  // ── LAST MONTH (October 2026) ──
  {
    id: 'INV-3',
    customer_name: 'Saad Rafique',
    phone: '03225566778',
    email: 'saad.rafique@gmail.com',
    address: 'Block C, Bahria Town Phase 7',
    city: 'Rawalpindi',
    notes: 'Delivered and verified in October sales run.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Armored Mesh Riding Jacket', size: 'XL (44–46")', qty: 1, price: 14500 }
    ],
    total_amount: 14850,
    status: 'delivered',
    created_at: timeAgo(0, 0, 0, 1)
  },
  {
    id: 'INV-2',
    customer_name: 'Tariq Mehmood',
    phone: '03314455889',
    email: 'tariq.m@yahoo.com',
    address: 'Main Boulevard, Gulshan-e-Iqbal',
    city: 'Karachi',
    notes: 'Payment collected by Rider.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery',
    delivery_cost: 350,
    items: [
      { name: 'Carbon Knuckle Street Gloves', size: 'L (9–9.5")', qty: 2, price: 5800 }
    ],
    total_amount: 11950,
    status: 'delivered',
    created_at: timeAgo(0, 0, 10, 1)
  },

  // ── EARLIER THIS YEAR (Annual 2026) ──
  {
    id: 'INV-1',
    customer_name: 'Hassan Sheikh',
    phone: '03157788991',
    email: 'hassan.sheikh@hotmail.com',
    address: 'Civic Centre, Sector G-6',
    city: 'Islamabad',
    notes: 'Annual record order from Summer batch.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Priority Express',
    delivery_cost: 350,
    items: [
      { name: 'Waterproof Touring Pants', size: '32 (Medium)', qty: 1, price: 11500 },
      { name: 'Thermal Windproof Balaclava', size: 'Universal', qty: 1, price: 1850 }
    ],
    total_amount: 13700,
    status: 'delivered',
    created_at: timeAgo(0, 0, 0, 3)
  }
];

function formatPKR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-PK');
}

function formatOrderDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(isoString);
  }
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDateMMDDYYYY(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

function formatDateYYYYMMDD(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${y}-${m}-${day}`;
}

function formatReceiptDate(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function playOrderChime() {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log('Audio chime not permitted before user interaction.');
  }
}

// ── ORDER NOTIFICATION & CHIME SYSTEM (WEB & ANDROID APK) ──
let knownOrderIdsSet = new Set();
let isInitialOrderFetch = true;

function triggerOrderNotification(order) {
  if (!order) return;

  // 1. Audio chime alert
  playOrderChime();

  const orderId = order.id || 'New';
  const customerName = (order.customer && order.customer.name) ? order.customer.name : (order.name || 'Customer');
  const amountVal = order.total || order.amount || 0;
  const amountStr = typeof formatPKR === 'function' ? formatPKR(amountVal) : ('Rs. ' + amountVal);

  // 2. Native Android App Bridge (if running inside rev-moto-admin.apk)
  try {
    if (window.Android && typeof window.Android.showOrderNotification === 'function') {
      window.Android.showOrderNotification(String(orderId), String(customerName), String(amountVal));
    }
  } catch (err) {
    console.warn('Native Android notification bridge notice:', err);
  }

  // 3. Browser Push / System Notification (Desktop & Mobile Browser)
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('🚨 New Order: #' + orderId, {
        body: customerName + ' • ' + amountStr + '\nTap to open order in Admin',
        icon: '../assets/images/logo.png',
        badge: '../assets/images/logo.png',
        tag: 'order-' + orderId,
        renotify: true
      });
      n.onclick = function() {
        window.focus();
        if (typeof openOrderModal === 'function') {
          openOrderModal(order.id);
        }
      };
    }
  } catch (err) {
    console.warn('Browser system notification notice:', err);
  }

  // 4. In-App Interactive Toast
  if (typeof showToast === 'function') {
    showToast('🔔 New Order #' + orderId + ' (' + amountStr + ') received!', 'success');
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted' && typeof showToast === 'function') {
        showToast('🔔 Order push notifications enabled!', 'success');
      }
    });
  }
}

// ── SUPABASE CONNECTION & SYNC ──────────────────────────────
function initSupabase() {
  const url = localStorage.getItem('rm_supabase_url');
  const key = localStorage.getItem('rm_supabase_anon_key');

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url.trim(), key.trim());
      setupRealtimeSubscription();
      return true;
    } catch (err) {
      console.warn('Supabase silent init:', err);
    }
  }
  return false;
}

function setupRealtimeSubscription() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          triggerOrderNotification(payload.new);
        }
        fetchOrders();
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription notice:', err);
  }
}

// ── INVOICE NUMBER SEQUENCING & NORMALIZATION ──────────────
function getNextInvoiceId(orders) {
  let maxNum = 0;
  (orders || []).forEach(o => {
    if (o && o.id) {
      const match = String(o.id).match(/^INV-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
  });
  return 'INV-' + (maxNum + 1);
}

function normalizeInvoiceNumbers(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const needsMigration = orders.some(o => !o.id || !String(o.id).startsWith('INV-'));
  if (!needsMigration) return orders;

  // Clone array and sort chronologically ascending (earliest order gets INV-1)
  const sorted = [...orders].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return da - db;
  });

  sorted.forEach((order, index) => {
    if (!order.legacy_id) {
      order.legacy_id = order.id;
    }
    order.id = 'INV-' + (index + 1);
  });

  // Re-sort descending (newest order first for UI)
  sorted.sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return db - da;
  });

  try {
    localStorage.setItem('rm_orders', JSON.stringify(sorted));
  } catch (e) {}

  return sorted;
}

async function fetchOrders() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        ordersList = normalizeInvoiceNumbers(data);
        checkNewIncomingOrders();
        renderDashboard();
        return;
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local storage:', e);
    }
  }

  const stored = localStorage.getItem('rm_orders');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ordersList = normalizeInvoiceNumbers(parsed);
      } else {
        ordersList = DEFAULT_SAMPLE_ORDERS;
        saveLocalOrders(ordersList);
      }
    } catch (e) {
      console.error('Failed to parse rm_orders from localStorage:', e);
      ordersList = DEFAULT_SAMPLE_ORDERS;
      saveLocalOrders(ordersList);
    }
  } else {
    ordersList = DEFAULT_SAMPLE_ORDERS;
    saveLocalOrders(ordersList);
  }

  checkNewIncomingOrders();
  renderDashboard();
}

function checkNewIncomingOrders() {
  if (!isInitialOrderFetch && Array.isArray(ordersList)) {
    const freshOrders = ordersList.filter(o => o && o.id && !knownOrderIdsSet.has(String(o.id)));
    if (freshOrders.length > 0) {
      triggerOrderNotification(freshOrders[0]);
    }
  }
  if (Array.isArray(ordersList)) {
    ordersList.forEach(o => {
      if (o && o.id) knownOrderIdsSet.add(String(o.id));
    });
  }
  isInitialOrderFetch = false;
}

function saveLocalOrders(orders) {
  localStorage.setItem('rm_orders', JSON.stringify(orders));
}

// ── PERIOD FILTER LOGIC (Daily / Monthly / Annual / All) ──
function setPeriodMode(mode) {
  periodMode = mode;
  includeCarryover = false;

  // Update segmented control buttons
  ['daily', 'monthly', 'annual', 'all'].forEach(m => {
    const btn = document.getElementById('btnPeriod' + m.charAt(0).toUpperCase() + m.slice(1));
    if (btn) btn.classList.toggle('active', m === mode);
  });

  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function isCurrentPeriod() {
  if (periodMode !== 'daily') return false;
  return (
    periodDate.getFullYear() === NOW.getFullYear() &&
    periodDate.getMonth() === NOW.getMonth() &&
    periodDate.getDate() === NOW.getDate()
  );
}

function resetToCurrentPeriod() {
  setPeriodMode('daily');
  jumpToToday();
  showToast('Reset to current date (Today)', 'info');
}

function renderPeriodNavigator() {
  const container = document.getElementById('periodNavigatorBox');
  if (!container) return;

  const currentYear = NOW.getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
    .map(y => `<option value="${y}" ${y === periodDate.getFullYear() ? 'selected' : ''}>${y}</option>`)
    .join('');

  const isCurrent = isCurrentPeriod();
  const resetCrossBtn = !isCurrent ? `
    <button type="button" class="period-reset-cross" onclick="resetToCurrentPeriod()" title="Reset to current (Today)">
      <i class="fas fa-times"></i>
    </button>
  ` : '';

  if (periodMode === 'daily') {
    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(-1)" title="Previous Day">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-date-display" onclick="openDailyPicker()" title="Click to pick a specific date">
        <span>${formatDateMMDDYYYY(periodDate)}</span>
        <i class="far fa-calendar-alt period-calendar-icon"></i>
        <input type="date" id="hiddenDailyPicker" class="hidden-date-picker" value="${formatDateYYYYMMDD(periodDate)}" onchange="onDailyPickerChange(this.value)">
      </div>

      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(1)" title="Next Day">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpToToday()" title="Jump to Today">
        TODAY
      </button>
      ${resetCrossBtn}
    `;
    return;
  }

  if (periodMode === 'monthly') {
    const monthOptions = MONTH_NAMES
      .map((name, idx) => `<option value="${idx}" ${idx === periodDate.getMonth() ? 'selected' : ''}>${name}</option>`)
      .join('');

    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(-1)" title="Previous Month">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-dropdowns-group">
        <select class="period-select" id="periodMonthSelect" onchange="onMonthSelectChange(Number(this.value))">
          ${monthOptions}
        </select>
        <select class="period-select" id="periodYearSelect" onchange="onYearSelectChange(Number(this.value))">
          ${yearOptions}
        </select>
      </div>

      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(1)" title="Next Month">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpToCurrentMonth()" title="Jump to Current Month">
        THIS MONTH
      </button>
      ${resetCrossBtn}
    `;
    return;
  }

  if (periodMode === 'annual') {
    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(-1)" title="Previous Year">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-dropdowns-group">
        <select class="period-select" id="periodYearSelect" onchange="onYearSelectChange(Number(this.value))">
          ${yearOptions}
        </select>
      </div>

      <button type="button" class="period-nav-arrow" onclick="stepPeriodDate(1)" title="Next Year">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpToCurrentYear()" title="Jump to Current Year">
        THIS YEAR
      </button>
      ${resetCrossBtn}
    `;
    return;
  }

  // All mode
  container.innerHTML = `
    <div class="period-all-label">
      <i class="fas fa-layer-group text-cyan"></i> Showing All History
    </div>
    <button type="button" class="period-quick-btn" onclick="setPeriodMode('daily')" title="Switch to Today">
      TODAY
    </button>
    ${resetCrossBtn}
  `;
}

function stepPeriodDate(delta) {
  includeCarryover = false;
  const d = new Date(periodDate.getTime());
  if (periodMode === 'daily') {
    d.setDate(d.getDate() + delta);
  } else if (periodMode === 'monthly') {
    d.setMonth(d.getMonth() + delta);
  } else if (periodMode === 'annual') {
    d.setFullYear(d.getFullYear() + delta);
  }
  periodDate = d;
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function jumpToToday() {
  periodDate = new Date();
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function jumpToCurrentMonth() {
  periodDate = new Date();
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function jumpToCurrentYear() {
  periodDate = new Date();
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function openDailyPicker() {
  const input = document.getElementById('hiddenDailyPicker');
  if (input) {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (e) {
        input.focus();
      }
    } else {
      input.focus();
    }
  }
}

function onDailyPickerChange(val) {
  if (!val) return;
  const parts = val.split('-');
  if (parts.length === 3) {
    includeCarryover = false;
    periodDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    renderPeriodNavigator();
    currentPage = 1;
    renderDashboard();
  }
}

function onMonthSelectChange(m) {
  includeCarryover = false;
  const d = new Date(periodDate.getTime());
  d.setMonth(m);
  periodDate = d;
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function onYearSelectChange(y) {
  includeCarryover = false;
  const d = new Date(periodDate.getTime());
  d.setFullYear(y);
  periodDate = d;
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function matchesPeriodFilter(orderCreatedAt) {
  if (periodMode === 'all') return true;
  if (!orderCreatedAt) return false;

  const orderDate = new Date(orderCreatedAt);

  if (periodMode === 'daily') {
    return (
      orderDate.getFullYear() === periodDate.getFullYear() &&
      orderDate.getMonth() === periodDate.getMonth() &&
      orderDate.getDate() === periodDate.getDate()
    );
  }

  if (periodMode === 'monthly') {
    return (
      orderDate.getFullYear() === periodDate.getFullYear() &&
      orderDate.getMonth() === periodDate.getMonth()
    );
  }

  if (periodMode === 'annual') {
    return orderDate.getFullYear() === periodDate.getFullYear();
  }

  return true;
}

// ── FILTERING & RETRIEVAL ──────────────────────────────────
function getPeriodFilteredOrders() {
  return ordersList.filter(order => matchesPeriodFilter(order.created_at));
}

// Undelivered orders from previous time filters (e.g. before current day/month/year)
function getPreviousUndeliveredOrders() {
  if (periodMode === 'all') return [];

  let periodStart = null;
  if (periodMode === 'daily') {
    periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), periodDate.getDate(), 0, 0, 0, 0);
  } else if (periodMode === 'monthly') {
    periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1, 0, 0, 0, 0);
  } else if (periodMode === 'annual') {
    periodStart = new Date(periodDate.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  if (!periodStart) return [];

  return ordersList.filter(order => {
    if (!order.created_at) return false;
    const orderDate = new Date(order.created_at);
    return orderDate < periodStart && order.status !== 'delivered' && order.status !== 'cancelled';
  });
}

function toggleIncludeCarryover(forceState) {
  if (typeof forceState === 'boolean') {
    includeCarryover = forceState;
  } else {
    includeCarryover = !includeCarryover;
  }
  currentPage = 1;
  renderDashboard();
}

function filterByCarryoverStatus(statusKey) {
  activeFilter = statusKey;
  includeCarryover = true;
  currentPage = 1;
  renderDashboard();
}

function renderCarryoverPill(prevTotal) {
  const container = document.getElementById('carryoverPillContainer');
  if (!container) return;

  if (prevTotal <= 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button type="button" class="carryover-pill-btn ${includeCarryover ? 'active' : ''}" onclick="toggleIncludeCarryover()" title="${includeCarryover ? 'Click to hide earlier carryover orders' : 'Click to view ' + prevTotal + ' undelivered orders from earlier periods in table'}">
      <i class="fas ${includeCarryover ? 'fa-check' : 'fa-clock-rotate-left'}"></i>
      <span>Carryover (${prevTotal})</span>
    </button>
  `;
}

function getFilteredOrders() {
  const periodOrders = getPeriodFilteredOrders();
  let baseOrders = periodOrders;

  if (includeCarryover) {
    const prevUndelivered = getPreviousUndeliveredOrders();
    const seen = new Set(periodOrders.map(o => String(o.id)));
    const carryoverToAdd = prevUndelivered
      .filter(o => !seen.has(String(o.id)))
      .map(o => ({ ...o, _isCarryover: true }));
    baseOrders = [...periodOrders, ...carryoverToAdd];
  }

  return baseOrders.filter(order => {
    // 2. Status Pipeline Filter
    if (activeFilter !== 'all' && order.status !== activeFilter) {
      return false;
    }
    // 3. Search Query
    if (searchQuery) {
      const idMatch = (order.id || '').toLowerCase().includes(searchQuery) || (order.legacy_id || '').toLowerCase().includes(searchQuery);
      const nameMatch = (order.customer_name || '').toLowerCase().includes(searchQuery);
      const phoneMatch = (order.phone || '').toLowerCase().includes(searchQuery);
      const addressMatch = (order.address || '').toLowerCase().includes(searchQuery);
      const cityMatch = (order.city || '').toLowerCase().includes(searchQuery);
      return idMatch || nameMatch || phoneMatch || addressMatch || cityMatch;
    }
    return true;
  });
}

// ── DASHBOARD RENDERING ────────────────────────────────────
function renderDashboard() {
  updateMetrics();
  renderFilterTabs();
  renderDesktopTable();
  renderMobileCards();
  renderPagination();
}

function updateMetrics() {
  // Metrics reflect the active Period (Daily, Monthly, Annual, or All)
  const scopedOrders = getPeriodFilteredOrders();
  const prevUndelivered = getPreviousUndeliveredOrders();

  let totalRev = 0;
  let totalOrders = scopedOrders.length;
  let pendingCount = 0;
  let dispatchedCount = 0;

  scopedOrders.forEach(order => {
    const amt = Number(order.total_amount) || 0;
    if (order.status === 'delivered') {
      totalRev += amt;
    }
    if (order.status === 'pending') pendingCount++;
    if (order.status === 'dispatched') dispatchedCount++;
  });

  const prevTotal = prevUndelivered.length;
  const prevPending = prevUndelivered.filter(o => o.status === 'pending').length;
  const prevDispatched = prevUndelivered.filter(o => o.status === 'dispatched').length;

  const revEl = document.getElementById('metricRevenueVal');
  const ordEl = document.getElementById('metricOrdersVal');
  const penEl = document.getElementById('metricPendingVal');
  const disEl = document.getElementById('metricDispatchedVal');

  if (revEl) revEl.textContent = formatPKR(totalRev);

  // Show previous undelivered count in brackets (e.g. 0 (9) or 12)
  if (ordEl) {
    if (prevTotal > 0) {
      ordEl.innerHTML = `${totalOrders} <span class="metric-bracket-badge" onclick="toggleIncludeCarryover()" title="${prevTotal} undelivered orders from previous periods (${includeCarryover ? 'Showing in table' : 'Click to view in table'})">(${prevTotal})</span>`;
    } else {
      ordEl.textContent = totalOrders;
    }
  }

  if (penEl) {
    if (prevPending > 0) {
      penEl.innerHTML = `${pendingCount} <span class="metric-bracket-badge" onclick="filterByCarryoverStatus('pending')" title="${prevPending} pending confirmation from previous periods (Click to view)">(${prevPending})</span>`;
    } else {
      penEl.textContent = pendingCount;
    }
  }

  if (disEl) {
    if (prevDispatched > 0) {
      disEl.innerHTML = `${dispatchedCount} <span class="metric-bracket-badge" onclick="filterByCarryoverStatus('dispatched')" title="${prevDispatched} dispatched from previous periods (Click to view)">(${prevDispatched})</span>`;
    } else {
      disEl.textContent = dispatchedCount;
    }
  }

  // Dynamic subtitle describing the selected period
  let periodLabelText = '';
  if (periodMode === 'daily') {
    periodLabelText = `Sales for ${formatDateMMDDYYYY(periodDate)}`;
  } else if (periodMode === 'monthly') {
    periodLabelText = `Sales for ${MONTH_NAMES[periodDate.getMonth()]} ${periodDate.getFullYear()}`;
  } else if (periodMode === 'annual') {
    periodLabelText = `Annual Sales for ${periodDate.getFullYear()}`;
  } else {
    periodLabelText = 'All-time total sales';
  }

  const cards = document.querySelectorAll('.metrics-grid .metric-card .metric-sub');
  if (cards && cards[0]) cards[0].textContent = periodLabelText;
  if (cards && cards[1]) {
    cards[1].textContent = prevTotal > 0
      ? `Found ${totalOrders} order(s) in this period • (${prevTotal}) undelivered from earlier`
      : `Found ${totalOrders} order(s) in this period`;
  }
  if (cards && cards[2]) {
    cards[2].textContent = prevPending > 0
      ? `Requires WhatsApp/Call check • (${prevPending}) from earlier`
      : `Requires WhatsApp/Call check`;
  }
  if (cards && cards[3]) {
    cards[3].textContent = prevDispatched > 0
      ? `Booked with Courier • (${prevDispatched}) from earlier`
      : `Booked with Courier`;
  }

  renderCarryoverPill(prevTotal);
}

function renderFilterTabs() {
  const scopedOrders = getPeriodFilteredOrders();
  const prevUndelivered = getPreviousUndeliveredOrders();

  const counts = {
    all: scopedOrders.length,
    pending: scopedOrders.filter(o => o.status === 'pending').length,
    confirmed: scopedOrders.filter(o => o.status === 'confirmed').length,
    dispatched: scopedOrders.filter(o => o.status === 'dispatched').length,
    delivered: scopedOrders.filter(o => o.status === 'delivered').length,
    cancelled: scopedOrders.filter(o => o.status === 'cancelled').length,
  };

  const prevCounts = {
    all: prevUndelivered.length,
    pending: prevUndelivered.filter(o => o.status === 'pending').length,
    confirmed: prevUndelivered.filter(o => o.status === 'confirmed').length,
    dispatched: prevUndelivered.filter(o => o.status === 'dispatched').length,
    delivered: 0,
    cancelled: 0,
  };

  const container = document.getElementById('filterTabsTrack');
  if (!container) return;

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  container.innerHTML = filters.map(f => {
    const c = counts[f.key] || 0;
    const p = prevCounts[f.key] || 0;
    const badgeText = p > 0 ? `${c} <span class="badge-bracket">(${p})</span>` : `${c}`;

    return `
      <button class="filter-pill-btn status-${f.key} ${activeFilter === f.key ? 'active' : ''}" onclick="setFilter('${f.key}', this)">
        ${f.label}
        <span class="filter-count-badge">${badgeText}</span>
      </button>
    `;
  }).join('');
}

function setFilter(key, btnEl) {
  activeFilter = key;
  currentPage = 1;
  const scoped = getPeriodFilteredOrders();
  const c = key === 'all' ? scoped.length : scoped.filter(o => o.status === key).length;
  if (c === 0 && key !== 'delivered' && key !== 'cancelled') {
    const prev = getPreviousUndeliveredOrders();
    const p = key === 'all' ? prev.length : prev.filter(o => o.status === key).length;
    if (p > 0) {
      includeCarryover = true;
    }
  }
  renderDashboard();
  if (btnEl && typeof btnEl.scrollIntoView === 'function') {
    btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  currentPage = 1;
  renderDesktopTable();
  renderMobileCards();
  renderPagination();
}

// ── PAGINATION CONTROLS ────────────────────────────────────
function getPagedOrders(allFiltered) {
  const totalItems = allFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  return {
    items: allFiltered.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalItems,
    totalPages
  };
}

function goToPage(page) {
  currentPage = page;
  renderDesktopTable();
  renderMobileCards();
  renderPagination();

  const anchor = document.getElementById('ordersAnchor');
  if (anchor) {
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function changePageSize(size) {
  pageSize = Number(size) || 10;
  currentPage = 1;
  renderDashboard();
}

function renderPagination() {
  const container = document.getElementById('paginationWrapper');
  if (!container) return;

  const allFiltered = getFilteredOrders();
  const { totalItems, totalPages, startIndex, endIndex } = getPagedOrders(allFiltered);

  if (totalItems === 0) {
    container.innerHTML = `
      <div class="pagination-info">No matching orders in this period.</div>
      <div class="page-size-selector">
        <span>Per page:</span>
        <select class="page-size-select" onchange="changePageSize(this.value)">
          <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
          <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
        </select>
      </div>
    `;
    return;
  }

  let pageButtonsHtml = '';
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    pageButtonsHtml += `<button class="page-num-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) pageButtonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">…</span>`;
  }

  for (let p = startPage; p <= endPage; p++) {
    pageButtonsHtml += `
      <button class="page-num-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">
        ${p}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageButtonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">…</span>`;
    pageButtonsHtml += `<button class="page-num-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  container.innerHTML = `
    <div class="pagination-info">
      Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> orders
    </div>

    <div class="pagination-controls">
      <button class="page-nav-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Previous
      </button>

      <div class="page-numbers-track">
        ${pageButtonsHtml}
      </div>

      <button class="page-nav-btn" onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
        Next <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <div class="page-size-selector">
      <span>Per page:</span>
      <select class="page-size-select" onchange="changePageSize(this.value)">
        <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
        <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
        <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
      </select>
    </div>
  `;
}

// ── DESKTOP TABLE ──────────────────────────────────────────
function renderDesktopTable() {
  const tbody = document.getElementById('desktopOrdersTableBody');
  if (!tbody) return;

  const allFiltered = getFilteredOrders();
  const { items } = getPagedOrders(allFiltered);

  if (items.length === 0) {
    const prevUndelivered = getPreviousUndeliveredOrders();
    const hasCarryover = prevUndelivered.length > 0 && !includeCarryover;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fas fa-inbox" style="font-size: 2.2rem; margin-bottom: 10px; display: block; opacity: 0.45;"></i>
          <div style="font-size: 0.95rem; font-weight: 600; color: #334155;">No orders found for the selected period &amp; filters.</div>
          ${hasCarryover ? `
            <div style="margin-top: 10px; font-size: 0.82rem; color: #64748b;">
              You have <strong style="color: #d97706;">(${prevUndelivered.length}) undelivered orders</strong> carried over from earlier periods.
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="toggleIncludeCarryover(true)" style="margin-top: 12px; font-size: 0.8rem; padding: 7px 16px; font-weight: 700; border-radius: 8px;">
              <i class="fas fa-clock-rotate-left"></i> View (${prevUndelivered.length}) Undelivered Orders
            </button>
          ` : ''}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(order => {
    const itemsSummary = (order.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
    const phoneClean = (order.phone || '').replace(/[^0-9]/g, '');
    const waUrl = getWhatsAppLink(order);

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <a class="order-id-link" onclick="openOrderModal('${order.id}')">${escapeHtml(order.id)}</a>
            ${order._isCarryover ? `<span class="order-carryover-tag" title="Undelivered order from previous period"><i class="fas fa-clock-rotate-left"></i> Carryover</span>` : ''}
          </div>
          <div class="order-table-date">${formatOrderDateTime(order.created_at)}</div>
        </td>
        <td>
          <div class="customer-meta-row">
            <span class="customer-name">${escapeHtml(order.customer_name || 'Guest Rider')}</span>
            <span class="customer-phone">${escapeHtml(order.phone || 'No phone')}</span>
          </div>
        </td>
        <td style="min-width: 180px; max-width: 340px;">
          <div style="display: flex; flex-direction: column; gap: 3px;">
            ${(order.items && order.items.length > 0) ? order.items.map(it => `
              <div style="font-size: 0.82rem; color: #0f172a; font-weight: 600; line-height: 1.35;">
                <span>${escapeHtml(it.name)}</span>
                <span style="color: #2563eb; font-weight: 700; font-size: 0.78rem;">(x${it.qty || 1})</span>
                ${it.size ? `<span style="font-size: 0.72rem; color: #64748b; font-weight: 500;">· ${escapeHtml(it.size)}</span>` : ''}
              </div>
            `).join('') : `
              <div style="font-size: 0.82rem; color: #0f172a; font-weight: 600;">
                ${escapeHtml(itemsSummary || 'Standard Order')}
              </div>
            `}
          </div>
          ${(order.items && order.items.length > 1) ? `
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 3px; font-weight: 600;">
              ${order.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)} items total
            </div>
          ` : ''}
        </td>
        <td>
          <span class="order-price-val">${formatPKR(order.total_amount)}</span>
        </td>
        <td>
          <button type="button" class="status-badge ${order.status || 'pending'} status-badge-btn" onclick="openQuickStatusModal('${order.id}')" title="Click to change status">
            ${order.status || 'pending'}
            <i class="fas fa-chevron-down" style="font-size: 0.58rem; margin-left: 3px; opacity: 0.65;"></i>
          </button>
        </td>
        <td>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <button class="btn-action-icon btn-action-receipt" onclick="openReceiptModal('${order.id}')" title="80mm Thermal Receipt">
              ${SVG_ICONS.receipt}
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-action-icon btn-action-wa" title="Chat on WhatsApp">
              ${SVG_ICONS.whatsapp}
            </a>
            <a href="tel:${phoneClean}" class="btn-action-icon btn-action-call" title="Call Customer">
              ${SVG_ICONS.phone}
            </a>
            <button class="btn-action-icon btn-action-view" onclick="openOrderModal('${order.id}')" title="View Order Details">
              ${SVG_ICONS.eye}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── MOBILE ORDER CARDS ─────────────────────────────────────
function renderMobileCards() {
  const container = document.getElementById('mobileOrdersContainer');
  if (!container) return;

  const allFiltered = getFilteredOrders();
  const { items } = getPagedOrders(allFiltered);

  if (items.length === 0) {
    const prevUndelivered = getPreviousUndeliveredOrders();
    const hasCarryover = prevUndelivered.length > 0 && !includeCarryover;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); color: var(--text-muted);">
        <i class="fas fa-inbox" style="font-size: 2.2rem; margin-bottom: 10px; display: block; opacity: 0.45;"></i>
        <div style="font-size: 0.95rem; font-weight: 600; color: #334155;">No orders found for the selected period &amp; filters.</div>
        ${hasCarryover ? `
          <div style="margin-top: 10px; font-size: 0.82rem; color: #64748b;">
            You have <strong style="color: #d97706;">(${prevUndelivered.length}) undelivered orders</strong> carried over from earlier periods.
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="toggleIncludeCarryover(true)" style="margin-top: 12px; font-size: 0.8rem; padding: 7px 16px; font-weight: 700; border-radius: 8px;">
            <i class="fas fa-clock-rotate-left"></i> View (${prevUndelivered.length}) Undelivered Orders
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(order => {
    const itemsSummary = (order.items || []).map(i => `${i.name} (${i.size || 'M'}) x${i.qty}`).join(', ');
    const phoneClean = (order.phone || '').replace(/[^0-9]/g, '');
    const waUrl = getWhatsAppLink(order);

    return `
      <div class="mobile-order-card">
        <div class="m-order-header">
          <div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="m-order-id" onclick="openOrderModal('${order.id}')">${escapeHtml(order.id)}</span>
              ${order._isCarryover ? `<span class="order-carryover-tag" style="font-size: 0.58rem; padding: 1px 4px;"><i class="fas fa-clock-rotate-left"></i> Earlier</span>` : ''}
            </div>
            <span class="m-order-time">${formatOrderDateTime(order.created_at)}</span>
          </div>
          <button type="button" class="status-badge ${order.status || 'pending'} status-badge-btn" onclick="openQuickStatusModal('${order.id}')" title="Click to change status">
            ${order.status || 'pending'}
            <i class="fas fa-chevron-down" style="font-size: 0.58rem; margin-left: 3px; opacity: 0.65;"></i>
          </button>
        </div>

        <div class="m-customer-row">
          <span class="m-customer-name">${escapeHtml(order.customer_name || 'Guest Rider')}</span>
          <span class="m-order-amount">${formatPKR(order.total_amount)}</span>
        </div>

        <div class="m-order-items">
          <i class="fas fa-vest" style="color: var(--accent-cyan); font-size: 0.75rem; margin-right: 4px;"></i>
          ${escapeHtml(itemsSummary || 'Standard Order')}
        </div>

        <div class="m-order-address">
          <i class="fas fa-location-dot" style="font-size: 0.75rem;"></i>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(order.address || 'Address provided at checkout')}
          </span>
        </div>

        <div class="m-actions-row">
          <button class="btn-action-icon btn-action-receipt" onclick="openReceiptModal('${order.id}')" title="80mm Receipt">
            ${SVG_ICONS.receipt} <span>Slip</span>
          </button>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-action-icon btn-action-wa" title="Chat on WhatsApp">
            ${SVG_ICONS.whatsapp} <span>WhatsApp</span>
          </a>
          <a href="tel:${phoneClean}" class="btn-action-icon btn-action-call" title="Call Customer">
            ${SVG_ICONS.phone} <span>Call</span>
          </a>
          <button class="btn-action-icon btn-action-view" onclick="openOrderModal('${order.id}')" title="View Order">
            ${SVG_ICONS.eye} <span>View</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function getWhatsAppLink(order) {
  let phone = (order.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  }
  const msg = `Salam ${order.customer_name || 'Rider'}! This is Rev Moto regarding your COD order #${order.id} for ${formatPKR(order.total_amount)}. Could you please confirm your delivery address?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ── ORDER DETAILS MODAL ────────────────────────────────────
function openOrderModal(orderId) {
  const order = ordersList.find(o => String(o.id) === String(orderId) || (o.legacy_id && String(o.legacy_id) === String(orderId)));
  if (!order) return;

  currentSelectedOrder = order;

  document.getElementById('modalOrderId').textContent = order.id;
  document.getElementById('modalCustomerName').textContent = order.customer_name || 'Guest Rider';
  document.getElementById('modalPhone').textContent = order.phone || 'No phone';
  document.getElementById('modalEmail').textContent = order.email || 'No email';
  document.getElementById('modalAddress').textContent = order.address || 'No address';
  document.getElementById('modalNotes').textContent = order.notes || 'No customer notes provided.';
  document.getElementById('modalPaymentMethod').textContent = order.payment_method || 'Cash on Delivery (COD)';
  document.getElementById('modalTotal').textContent = formatPKR(order.total_amount);

  const itemsListEl = document.getElementById('modalItemsList');
  if (order.items && order.items.length > 0) {
    itemsListEl.innerHTML = order.items.map(i => `
      <div class="order-item-detail-row">
        <div>
          <strong style="color: var(--text-pure);">${escapeHtml(i.name)}</strong>
          <div style="font-size: 0.76rem; color: var(--text-muted);">Size: ${escapeHtml(i.size || 'Standard')} • Qty: ${i.qty}</div>
        </div>
        <div style="font-weight: 700; color: var(--text-primary);">
          ${formatPKR(i.price * i.qty)}
        </div>
      </div>
    `).join('');
  } else {
    itemsListEl.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 0.85rem;">No specific items listed.</div>`;
  }

  const statusSelect = document.getElementById('orderStatusSelect');
  if (statusSelect) statusSelect.value = order.status || 'pending';

  document.getElementById('orderDetailModal').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('orderDetailModal').classList.remove('open');
  currentSelectedOrder = null;
}

async function saveOrderChanges() {
  if (!currentSelectedOrder) return;

  const newStatus = document.getElementById('orderStatusSelect').value;
  const targetId = currentSelectedOrder.id;

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
    } catch (e) {
      console.warn('Supabase update failed, saving locally:', e);
    }
  }

  const idx = ordersList.findIndex(o => String(o.id) === String(targetId) || (o.legacy_id && String(o.legacy_id) === String(targetId)));
  if (idx !== -1) {
    ordersList[idx].status = newStatus;
    saveLocalOrders(ordersList);
  }

  showToast(`Order #${targetId} updated to ${newStatus.toUpperCase()}`, 'success');
  closeOrderModal();
  renderDashboard();
}

async function deleteOrder() {
  if (!currentSelectedOrder) return;
  if (!confirm(`Are you sure you want to delete Order #${currentSelectedOrder.id}?`)) return;

  const targetId = currentSelectedOrder.id;

  if (supabaseClient) {
    try {
      await supabaseClient.from('orders').delete().eq('id', targetId);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  ordersList = ordersList.filter(o => String(o.id) !== String(targetId) && (!o.legacy_id || String(o.legacy_id) !== String(targetId)));
  saveLocalOrders(ordersList);

  showToast(`Order #${targetId} deleted.`, 'info');
  closeOrderModal();
  renderDashboard();
}

// ── 80MM THERMAL RECEIPT SYSTEM (POS Format) ───────────────
function openReceiptModal(orderId) {
  let order = null;
  if (orderId) {
    order = ordersList.find(o => String(o.id) === String(orderId) || (o.legacy_id && String(o.legacy_id) === String(orderId)));
  }
  if (!order && currentSelectedOrder) {
    order = currentSelectedOrder;
  }
  if (!order) return;

  currentReceiptOrder = order;

  const receiptEl = document.getElementById('receiptPaper');
  if (!receiptEl) return;

  const subtotal = (order.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  const deliveryCost = Number(order.delivery_cost || 350);
  const totalAmount = Number(order.total_amount) || (subtotal + deliveryCost);

    const itemsRowsHtml = (order.items || []).map((it, idx) => `
    <tr>
      <td style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; vertical-align: top; font-weight: 600; color: #000;">${idx + 1}</td>
      <td style="border: 1.2px solid #000; padding: 4px 6px; text-align: left; vertical-align: top;">
        <div style="font-weight: 700; font-size: 11.5px; color: #000; line-height: 1.25;">${escapeHtml(it.name || 'Item')}</div>
        ${it.size ? `<div style="font-size: 10px; font-weight: 600; color: #3f3f46; margin-top: 1px;">Size: ${escapeHtml(it.size)}</div>` : ''}
      </td>
      <td style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; vertical-align: top; font-weight: 700; color: #000;">${it.qty || 1}</td>
      <td style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; vertical-align: top; font-weight: 600; color: #000;">${(Number(it.price) || 0).toLocaleString('en-PK')}</td>
      <td style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; vertical-align: top; font-weight: 700; color: #000;">${((Number(it.price) || 0) * Number(it.qty || 1)).toLocaleString('en-PK')}</td>
    </tr>
  `).join('');

  receiptEl.innerHTML = `
    <div style="font-family: 'Plus Jakarta Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #000;">
      <!-- Store Header -->
      <div style="text-align: center;">
        <h2 style="font-size: 16px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; color: #000; line-height: 1.2;">REV MOTO</h2>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #000; margin-top: 3px;">PREMIUM MOTORCYCLE GEAR &amp; PROTECTION</div>
        <div style="font-size: 10.5px; font-weight: 600; color: #000; margin-top: 3px; line-height: 1.35;">
          Sialkot Manufacturing District, Punjab, Pakistan<br>
          Phone: 0337-4249450
        </div>
        <div style="margin-top: 7px;">
          <span style="display: inline-block; border: 1.2px solid #000; padding: 2px 10px; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #000;">
            ${escapeHtml(order.payment_method || 'CASH ON DELIVERY')}
          </span>
        </div>
      </div>

      <!-- Dashed separator -->
      <div style="border-top: 1px dashed #71717a; margin: 10px 0;"></div>

      <!-- Order Metadata Rows -->
      <div style="font-size: 11.5px; line-height: 1.6; color: #000;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Order ID:</span>
          <span style="font-weight: 800;">${escapeHtml(order.id)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Date &amp; Time:</span>
          <span style="font-weight: 700;">${formatReceiptDate(order.created_at)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Customer:</span>
          <span style="font-weight: 700;">${escapeHtml(order.customer_name || 'Customer')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Phone:</span>
          <span style="font-weight: 700;">${escapeHtml(order.phone || '0337-4249450')}</span>
        </div>
        <div style="margin-top: 2px;">
          <span style="font-weight: 700; display: block;">Delivery Address:</span>
          <span style="display: block; font-size: 11px; font-weight: 500; color: #3f3f46; line-height: 1.35; margin-top: 1px;">
            ${escapeHtml(order.address || 'Address provided at checkout')}${order.city ? ', ' + escapeHtml(order.city) : ''}
          </span>
        </div>
      </div>

      <!-- Dashed separator -->
      <div style="border-top: 1px dashed #71717a; margin: 10px 0;"></div>

      <!-- Itemized Table (Exact border structure) -->
      <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; font-size: 11px; color: #000; margin: 4px 0; background: #fff;">
        <thead>
          <tr style="background: #fff; color: #000;">
            <th style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; width: 24px; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;">#</th>
            <th style="border: 1.2px solid #000; padding: 4px 6px; text-align: left; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;">ITEM</th>
            <th style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; width: 34px; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;">QTY</th>
            <th style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; width: 56px; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;">RATE</th>
            <th style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; width: 64px; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <!-- Totals Breakdown -->
      <div style="margin-top: 8px; font-size: 11.5px; line-height: 1.6; color: #000;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 600;">Subtotal</span>
          <span style="font-weight: 700;">Rs. ${subtotal.toLocaleString('en-PK')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 600;">Delivery Charges</span>
          <span style="font-weight: 700;">Rs. ${deliveryCost.toLocaleString('en-PK')}</span>
        </div>
        <div style="height: 1.5px; background: #000; width: 100%; margin: 4px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 800; font-size: 13.5px; letter-spacing: 0.03em;">TOTAL AMOUNT</span>
          <span style="font-weight: 800; font-size: 13.5px;">Rs. ${totalAmount.toLocaleString('en-PK')}</span>
        </div>
      </div>

      <!-- Dashed separator -->
      <div style="border-top: 1px dashed #71717a; margin: 10px 0;"></div>

      <!-- Centered Footer & Scissor Line -->
      <div style="text-align: center;">
        <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #000;">THANK YOU FOR ORDERING!</div>
        <div style="font-size: 10px; color: #71717a; margin-top: 4px; font-family: monospace;">✂ - - - - - - - - - - - - - - - - - - - - -</div>
      </div>
    </div>
  `;

  document.getElementById('receiptModal').classList.add('open');
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.remove('open');
  currentReceiptOrder = null;
}

function drawRevMotoReceiptCanvas(order, scale = 2) {
  if (!order) return '';
  const baseWidth = 760;
  const width = baseWidth;
  const padX = 48; // Generous 48px padding (identical to 24px at 380px width)
  let curY = 48;

  const items = order.items || [];
  const estimatedHeight = 760 + (items.length * 68) + (order.address ? 60 : 0);
  const baseHeight = Math.max(800, estimatedHeight);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(baseWidth * scale);
  canvas.height = Math.round(baseHeight * scale);
  const ctx = canvas.getContext('2d');

  ctx.scale(scale, scale);

  // Background - Pure Crisp White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  const fontSans = '"Plus Jakarta Sans", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // --- Store Header ---
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // REV MOTO
  ctx.font = `800 32px ${fontSans}`;
  ctx.fillText('REV MOTO', width / 2, curY);
  curY += 28;

  // Subtitle
  ctx.font = `800 20px ${fontSans}`;
  ctx.fillText('PREMIUM MOTORCYCLE GEAR & PROTECTION', width / 2, curY);
  curY += 26;

  // Address & Phone
  ctx.font = `600 18px ${fontSans}`;
  ctx.fillText('Sialkot Manufacturing District, Punjab, Pakistan', width / 2, curY);
  curY += 24;
  ctx.fillText('Phone: 0337-4249450', width / 2, curY);
  curY += 26;

  // Boxed Payment Badge
  const payMethod = (order.payment_method || order.paymentMethod || 'CASH ON DELIVERY (COD)').toUpperCase();
  ctx.font = `800 18px ${fontSans}`;
  const badgeTextW = ctx.measureText(payMethod).width;
  const badgeW = badgeTextW + 44;
  const badgeH = 38;
  const badgeX = (width - badgeW) / 2;
  const badgeY = curY;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(payMethod, width / 2, badgeY + (badgeH / 2) - 1);
  curY = badgeY + badgeH + 26;

  // Dashed Divider Helper
  const drawDashedDivider = (y) => {
    ctx.save();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(width - padX, y);
    ctx.stroke();
    ctx.restore();
  };

  drawDashedDivider(curY);
  curY += 30;

  // --- Order Metadata ---
  ctx.textBaseline = 'alphabetic';
  const drawMetaLine = (label, val) => {
    ctx.textAlign = 'left';
    ctx.font = `700 20px ${fontSans}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(label, padX, curY);

    ctx.textAlign = 'right';
    ctx.font = `800 20px ${fontSans}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(String(val || '-'), width - padX, curY);
    curY += 30;
  };

  const rawId = String(order.id || order.orderId || '0');
  const cleanOrderId = rawId.startsWith('#') ? rawId : `#${rawId}`;
  
  let dateStr = '';
  try {
    const rawDate = order.created_at || order.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    }
  } catch(e) {}
  if (!dateStr) dateStr = 'Nov 4, 2026, 5:32 PM';

  const custName = order.customer_name || order.customerName || 'Customer';
  const custPhone = order.phone || '0337-4249450';
  const custAddr = order.address || (order.city ? `${order.city}, Pakistan` : 'Standard Delivery');

  drawMetaLine('Order ID:', cleanOrderId);
  drawMetaLine('Date & Time:', dateStr);
  drawMetaLine('Customer:', custName);
  drawMetaLine('Phone:', custPhone);

  if (custAddr) {
    ctx.textAlign = 'left';
    ctx.font = `700 20px ${fontSans}`;
    ctx.fillStyle = '#000000';
    ctx.fillText('Delivery Address:', padX, curY);
    curY += 26;
    ctx.font = `500 18px ${fontSans}`;
    ctx.fillStyle = '#3f3f46';
    ctx.fillText(custAddr, padX, curY);
    curY += 30;
  }

  drawDashedDivider(curY);
  curY += 28;

  // --- Table ---
  const tableX = padX;
  const tableW = width - (2 * padX);

  const colW = {
    idx: 52,
    qty: 72,
    rate: 110,
    amt: 120
  };
  const colItemW = tableW - colW.idx - colW.qty - colW.rate - colW.amt;

  const colLeft = {
    idx: tableX,
    item: tableX + colW.idx,
    qty: tableX + colW.idx + colItemW,
    rate: tableX + colW.idx + colItemW + colW.qty,
    amt: tableX + colW.idx + colItemW + colW.qty + colW.rate
  };

  // Header Row
  const headerH = 42;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tableX, curY, tableW, headerH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tableX, curY, tableW, headerH);

  [colLeft.item, colLeft.qty, colLeft.rate, colLeft.amt].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, curY);
    ctx.lineTo(x, curY + headerH);
    ctx.stroke();
  });

  ctx.fillStyle = '#000000';
  ctx.font = `800 18px ${fontSans}`;
  ctx.textBaseline = 'middle';
  const headMidY = curY + (headerH / 2);

  ctx.textAlign = 'center';
  ctx.fillText('#', colLeft.idx + (colW.idx / 2), headMidY);

  ctx.textAlign = 'left';
  ctx.fillText('ITEM', colLeft.item + 12, headMidY);

  ctx.textAlign = 'center';
  ctx.fillText('QTY', colLeft.qty + (colW.qty / 2), headMidY);

  ctx.textAlign = 'right';
  ctx.fillText('RATE', colLeft.rate + colW.rate - 12, headMidY);
  ctx.fillText('AMOUNT', colLeft.amt + colW.amt - 12, headMidY);

  curY += headerH;

  // Items Rows
  items.forEach((it, i) => {
    const hasSize = Boolean(it.size);
    const rowH = hasSize ? 60 : 46;
    const midY = curY + (hasSize ? 22 : rowH / 2);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableX, curY, tableW, rowH);

    [colLeft.item, colLeft.qty, colLeft.rate, colLeft.amt].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, curY);
      ctx.lineTo(x, curY + rowH);
      ctx.stroke();
    });

    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.font = `700 19px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), colLeft.idx + (colW.idx / 2), midY);

    ctx.textAlign = 'left';
    ctx.font = `700 19px ${fontSans}`;
    ctx.fillText(it.name || 'Item', colLeft.item + 12, midY);

    if (hasSize) {
      ctx.font = `600 16px ${fontSans}`;
      ctx.fillStyle = '#3f3f46';
      ctx.fillText(`Size: ${it.size}`, colLeft.item + 12, curY + 44);
    }

    ctx.fillStyle = '#000000';
    ctx.font = `700 19px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(it.qty || 1), colLeft.qty + (colW.qty / 2), midY);

    ctx.textAlign = 'right';
    ctx.font = `600 19px ${fontSans}`;
    ctx.fillText(Number(it.price || 0).toLocaleString('en-PK'), colLeft.rate + colW.rate - 12, midY);

    ctx.font = `700 19px ${fontSans}`;
    ctx.fillText(Number((it.price || 0) * (it.qty || 1)).toLocaleString('en-PK'), colLeft.amt + colW.amt - 12, midY);

    curY += rowH;
  });

  curY += 24;

  // --- Totals Section ---
  const subtotal = items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  const delivery = Number(order.delivery_cost || order.deliveryCost || 350);
  const total = Number(order.total_amount || order.totalAmount || (subtotal + delivery));

  ctx.textBaseline = 'alphabetic';
  const drawTotalLine = (label, val, isBold = false) => {
    ctx.textAlign = 'left';
    ctx.font = `600 20px ${fontSans}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(label, padX, curY);

    ctx.textAlign = 'right';
    ctx.font = isBold ? `800 20px ${fontSans}` : `700 20px ${fontSans}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(val, width - padX, curY);
    curY += 30;
  };

  drawTotalLine('Subtotal', `Rs. ${subtotal.toLocaleString('en-PK')}`);
  drawTotalLine('Delivery Charges', `Rs. ${delivery.toLocaleString('en-PK')}`);

  // Solid Divider Line
  curY += 4;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, curY);
  ctx.lineTo(width - padX, curY);
  ctx.stroke();

  // Total Amount Line
  curY += 32;
  ctx.font = `800 24px ${fontSans}`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL AMOUNT', padX, curY);

  ctx.textAlign = 'right';
  ctx.fillText(`Rs. ${total.toLocaleString('en-PK')}`, width - padX, curY);
  curY += 26;

  // Dashed Divider before Footer
  drawDashedDivider(curY);
  curY += 30;

  // --- Footer ---
  ctx.textAlign = 'center';
  ctx.font = `800 19px ${fontSans}`;
  ctx.fillStyle = '#000000';
  ctx.fillText('THANK YOU FOR ORDERING!', width / 2, curY);
  curY += 26;

  ctx.font = `18px monospace`;
  ctx.fillStyle = '#71717a';
  ctx.fillText('✂ - - - - - - - - - - - - - - - - - - - - -', width / 2, curY);
  curY += 48; // Generous 48px bottom padding!

  // Crop canvas to exact required height
  const trimmed = document.createElement('canvas');
  trimmed.width = Math.round(baseWidth * scale);
  trimmed.height = Math.round(curY * scale);
  const tCtx = trimmed.getContext('2d');
  tCtx.drawImage(canvas, 0, 0);

  return trimmed.toDataURL('image/png', 1.0);
}

function downloadReceiptImage() {
  if (!currentReceiptOrder) return;
  try {
    showToast('Generating 80mm receipt image...', 'info');
    const dataUrl = drawRevMotoReceiptCanvas(currentReceiptOrder);
    const a = document.createElement('a');
    a.download = `RevMoto-Receipt-${currentReceiptOrder.id}.png`;
    a.href = dataUrl;
    a.click();
    showToast(`Receipt #${currentReceiptOrder.id} downloaded!`, 'success');
  } catch (err) {
    console.error('Receipt download error:', err);
    printThermalReceipt();
  }
}

function shareReceiptWhatsApp() {
  if (!currentReceiptOrder) return;
  const o = currentReceiptOrder;

  let phone = (o.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  }

  const subtotal = (o.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  const delivery = Number(o.delivery_cost || 350);
  const total = Number(o.total_amount) || (subtotal + delivery);

  const itemsList = (o.items || []).map((it, idx) => 
    `${idx + 1}. *${it.name}*${it.size ? ' (' + it.size + ')' : ''} x${it.qty} = Rs. ${((Number(it.price) || 0) * Number(it.qty || 1)).toLocaleString('en-PK')}`
  ).join('\n');

  const text = `🧾 *REV MOTO — ORDER RECEIPT*
Order ID: *#${o.id}*
Date: ${formatReceiptDate(o.created_at)}
Customer: *${o.customer_name || 'Rider'}*
Phone: ${o.phone || ''}
Delivery Address: ${o.address || ''}${o.city ? ', ' + o.city : ''}
Payment: *${o.payment_method || 'Cash on Delivery (COD)'}*
------------------------------
*ITEMS:*
${itemsList}
------------------------------
Subtotal: Rs. ${subtotal.toLocaleString('en-PK')}
Delivery Charges: Rs. ${delivery.toLocaleString('en-PK')}
*TOTAL AMOUNT (COD): Rs. ${total.toLocaleString('en-PK')}*
------------------------------
_Thank you for ordering with Rev Moto! Ride Safe._ 🏍️💨`;

  const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

function printThermalReceipt() {
  if (!currentReceiptOrder) return;
  const o = currentReceiptOrder;
  const paperHtml = document.getElementById('receiptPaper').innerHTML;

  const printWindow = window.open('', '_blank', 'width=420,height=680');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt #${o.id} — REV MOTO</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 3mm 4mm;
          background: #ffffff;
          color: #000000;
          font-family: 'Plus Jakarta Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          width: 80mm;
          max-width: 80mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      ${paperHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 200);
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ── SUPABASE CONFIG MODAL ──────────────────────────────────
function openSupabaseModal() {
  document.getElementById('cfgSupabaseUrl').value = localStorage.getItem('rm_supabase_url') || '';
  document.getElementById('cfgSupabaseAnon').value = localStorage.getItem('rm_supabase_anon_key') || '';
  document.getElementById('supabaseConfigModal').classList.add('open');
}

function closeSupabaseModal() {
  document.getElementById('supabaseConfigModal').classList.remove('open');
}

function saveSupabaseConfig() {
  const url = document.getElementById('cfgSupabaseUrl').value.trim();
  const key = document.getElementById('cfgSupabaseAnon').value.trim();

  localStorage.setItem('rm_supabase_url', url);
  localStorage.setItem('rm_supabase_anon_key', key);

  closeSupabaseModal();
  showToast('Connecting to Supabase...', 'info');

  initSupabase();
  fetchOrders();
}

function copySqlSchema() {
  const sql = `-- Rev Moto Orders Table Setup for Supabase SQL Editor
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text,
  notes text,
  payment_method text default 'Cash on Delivery (COD)',
  delivery_label text default 'Standard Tracked Delivery',
  delivery_cost numeric default 350,
  items jsonb not null,
  total_amount numeric not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Enable public checkout insertions and admin updates
alter table public.orders enable row level security;

create policy "Allow public inserts from storefront" 
on public.orders for insert with check (true);

create policy "Allow select and updates" 
on public.orders for all using (true);
`;

  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL Schema copied to clipboard!', 'success');
  }).catch(() => {
    alert(sql);
  });
}

function simulateTestOrder() {
  const testId = getNextInvoiceId(ordersList);
  const testNames = ['Shahid Afridi', 'Kamran Akmal', 'Farhan Ali', 'Ahmed Raza', 'Danyal Baig'];
  const testCities = ['Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad', 'Gujranwala'];
  const randomName = testNames[Math.floor(Math.random() * testNames.length)];
  const randomCity = testCities[Math.floor(Math.random() * testCities.length)];

  const newOrder = {
    id: testId,
    customer_name: randomName,
    phone: '03' + Math.floor(100000000 + Math.random() * 900000000),
    email: randomName.toLowerCase().replace(' ', '.') + '@gmail.com',
    address: `Street ${Math.floor(1 + Math.random() * 20)}, Sector ${randomCity}`,
    city: randomCity,
    notes: 'Test order from Admin simulation.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Armored Mesh Riding Jacket', size: 'L (41–43")', qty: 1, price: 14500 }
    ],
    total_amount: 14850,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  if (supabaseClient) {
    supabaseClient.from('orders').insert([newOrder]).then(({ error }) => {
      if (error) {
        console.warn('Supabase insert failed, adding locally:', error);
        ordersList.unshift(newOrder);
        saveLocalOrders(ordersList);
        playOrderChime();
        renderDashboard();
      }
    });
  } else {
    ordersList.unshift(newOrder);
    saveLocalOrders(ordersList);
    playOrderChime();
    renderDashboard();
  }

  showToast(`⚡ Test order #${testId} created!`, 'success');
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    btn.classList.toggle('active', soundEnabled);
  }
  showToast(soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF', 'info');
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('adminToast');
  if (!toast) return;

  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-bell');
  const color = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#06b6d4');

  toast.innerHTML = `<i class="fas ${icon}" style="color:${color}; font-size: 1.1rem;"></i> <span>${escapeHtml(msg)}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}


// ── QUICK STATUS MODAL & CONFIRMATION ──────────────────────
let qsTargetOrder = null;
let qsSelectedStatus = null;

const STATUS_DEFINITIONS = [
  {
    id: 'pending',
    label: 'Pending',
    desc: 'Call Required (Awaiting Confirmation)',
    icon: 'fa-clock',
    iconBg: '#fef3c7',
    iconColor: '#b45309'
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    desc: 'Call Verified & Ready to Pack',
    icon: 'fa-phone-volume',
    iconBg: '#dbeafe',
    iconColor: '#1d4ed8'
  },
  {
    id: 'dispatched',
    label: 'Dispatched',
    desc: 'Handed to Courier (In Transit)',
    icon: 'fa-truck-fast',
    iconBg: '#f3e8ff',
    iconColor: '#7e22ce'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    desc: 'Order Delivered & Paid (Complete)',
    icon: 'fa-circle-check',
    iconBg: '#d1fae5',
    iconColor: '#047857'
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    desc: 'Customer / Store Cancelled',
    icon: 'fa-ban',
    iconBg: '#fee2e2',
    iconColor: '#b91c1c'
  }
];

function openQuickStatusModal(orderId) {
  const order = ordersList.find(o => String(o.id) === String(orderId) || (o.legacy_id && String(o.legacy_id) === String(orderId)));
  if (!order) return;

  qsTargetOrder = order;
  qsSelectedStatus = null;

  const currentStatus = order.status || 'pending';

  const orderIdEl = document.getElementById('qsModalOrderId');
  if (orderIdEl) orderIdEl.textContent = order.id;

  const nameEl = document.getElementById('qsModalCustomerName');
  if (nameEl) nameEl.textContent = order.customer_name || 'Guest Rider';

  const amtEl = document.getElementById('qsModalAmount');
  if (amtEl) amtEl.textContent = formatPKR(order.total_amount);

  const currentBadgeEl = document.getElementById('qsModalCurrentBadge');
  if (currentBadgeEl) {
    currentBadgeEl.innerHTML = `
      <span class="status-badge ${currentStatus}">
        ${currentStatus}
      </span>
    `;
  }

  // Render status options
  renderQuickStatusOptions(currentStatus);

  // Hide confirmation panels initially
  const confirmPanel = document.getElementById('qsConfirmPanel');
  if (confirmPanel) confirmPanel.style.display = 'none';

  const sameNotice = document.getElementById('qsSameNotice');
  if (sameNotice) sameNotice.style.display = 'none';

  const modal = document.getElementById('quickStatusModal');
  if (modal) modal.classList.add('open');
}

function renderQuickStatusOptions(currentStatus) {
  const listEl = document.getElementById('qsStatusOptions');
  if (!listEl) return;

  listEl.innerHTML = STATUS_DEFINITIONS.map(st => {
    const isCurrent = st.id === currentStatus;
    const isSelected = qsSelectedStatus === st.id;
    const currentClass = isCurrent ? `is-current current-${st.id}` : '';
    const selectedClass = isSelected ? 'selected' : '';
    return `
      <button type="button" class="qs-status-opt ${currentClass} ${selectedClass}" onclick="selectQuickStatusOption('${st.id}')">
        <div class="qs-opt-left">
          <div class="qs-opt-icon" style="background: ${st.iconBg}; color: ${st.iconColor};">
            <i class="fas ${st.icon} fa-fw"></i>
          </div>
          <div>
            <div class="qs-opt-title" style="display: flex; align-items: center; gap: 8px;">
              <span>${st.label}</span>
              ${isCurrent ? `<span class="qs-current-tag"><i class="fas fa-check-circle"></i> Current Status</span>` : ''}
            </div>
            <div class="qs-opt-desc">${st.desc}</div>
          </div>
        </div>
        <div class="qs-opt-right">
          ${isCurrent && !isSelected ? `<span class="qs-active-pill"><i class="fas fa-circle-dot"></i> Active</span>` : ''}
          <div class="qs-opt-check">
            <i class="fas fa-circle-check"></i>
          </div>
        </div>
      </button>
    `;
  }).join('');
}

function selectQuickStatusOption(statusId) {
  if (!qsTargetOrder) return;
  qsSelectedStatus = statusId;
  const currentStatus = qsTargetOrder.status || 'pending';

  // Re-render option states
  renderQuickStatusOptions(currentStatus);

  const confirmPanel = document.getElementById('qsConfirmPanel');
  const sameNotice = document.getElementById('qsSameNotice');

  if (statusId === currentStatus) {
    if (confirmPanel) confirmPanel.style.display = 'none';
    if (sameNotice) {
      sameNotice.style.display = 'block';
      const nameEl = document.getElementById('qsSameStatusName');
      if (nameEl) nameEl.textContent = statusId.toUpperCase();
    }
  } else {
    if (sameNotice) sameNotice.style.display = 'none';
    if (confirmPanel) {
      confirmPanel.style.display = 'block';
      const msg = document.getElementById('qsConfirmMessage');
      if (msg) {
        msg.innerHTML = `Change Order <strong>${qsTargetOrder.id}</strong> status from <span class="status-badge ${currentStatus}" style="font-size: 0.65rem; vertical-align: middle;">${currentStatus}</span> to <span class="status-badge ${statusId}" style="font-size: 0.65rem; vertical-align: middle;">${statusId}</span>?`;
      }
      const actionBtn = document.getElementById('qsConfirmActionBtn');
      if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.innerHTML = `<i class="fas fa-check"></i> Yes, Change to ${statusId.toUpperCase()}`;
      }
    }
  }
}

function closeQuickStatusModal() {
  const modal = document.getElementById('quickStatusModal');
  if (modal) modal.classList.remove('open');
  qsTargetOrder = null;
  qsSelectedStatus = null;
}

async function executeQuickStatusChange() {
  if (!qsTargetOrder || !qsSelectedStatus) return;
  const targetId = qsTargetOrder.id;
  const newStatus = qsSelectedStatus;
  const oldStatus = qsTargetOrder.status || 'pending';

  if (newStatus === oldStatus) {
    closeQuickStatusModal();
    return;
  }

  const actionBtn = document.getElementById('qsConfirmActionBtn');
  if (actionBtn) {
    actionBtn.disabled = true;
    actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  }

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
    } catch (e) {
      console.warn('Supabase update failed, saving locally:', e);
    }
  }

  const idx = ordersList.findIndex(o => String(o.id) === String(targetId) || (o.legacy_id && String(o.legacy_id) === String(targetId)));
  if (idx !== -1) {
    ordersList[idx].status = newStatus;
    saveLocalOrders(ordersList);
  }

  showToast(`Order #${targetId} updated to ${newStatus.toUpperCase()}`, 'success');
  closeQuickStatusModal();
  renderDashboard();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── INITIALIZATION ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPeriodNavigator();
  initSupabase();
  fetchOrders();

  // Global Escape key listener to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeQuickStatusModal();
      closeOrderModal();
      closeReceiptModal();
      closeSupabaseModal();
      closeProductModal();
    }
  });

  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Poll Supabase or check sync every 30s
  setInterval(() => {
    if (!supabaseClient) {
      fetchOrders();
    }
  }, 30000);
});


// ═══════════════════════════════════════════════════════════════
// MULTI-VIEW ADMIN TAB CONTROLLER (Orders / Customers / Reviews / Settings)
// ═══════════════════════════════════════════════════════════════
let currentAdminView = 'orders';

function switchAdminView(viewName) {
  currentAdminView = viewName;

  // Update top header tab classes
  document.querySelectorAll('.admin-top-tab').forEach(tab => tab.classList.remove('active'));
  const activeTabBtn = document.getElementById('tabNav' + viewName.charAt(0).toUpperCase() + viewName.slice(1));
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Show/Hide view panels
  const views = ['orders', 'sales', 'products', 'customers', 'reviews', 'settings'];
  views.forEach(v => {
    const el = document.getElementById(v + 'View');
    if (el) {
      el.style.display = (v === viewName) ? 'block' : 'none';
    }
  });

  if (viewName === 'orders') {
    renderDashboard();
  } else if (viewName === 'sales') {
    renderSalesView();
  } else if (viewName === 'products') {
    renderProductsView();
  } else if (viewName === 'customers') {
    renderCustomersView();
  } else if (viewName === 'reviews') {
    renderReviewsView();
  } else if (viewName === 'settings') {
    loadStoreSettings();
  }
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS MANAGEMENT VIEW
// ═══════════════════════════════════════════════════════════════
let customerSearchQuery = '';

function getAggregatedCustomers() {
  const map = new Map();

  ordersList.forEach(o => {
    if (!o) return;
    const rawPhone = String(o.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const rawEmail = String(o.email || '').trim().toLowerCase();
    const rawName = String(o.customer_name || 'Rider').trim();

    let key = cleanPhone;
    if (!key && rawEmail) key = rawEmail;
    if (!key) key = rawName.toLowerCase();
    if (!key) return;

    const amount = Number(o.total_amount) || 0;
    const orderDate = o.created_at ? new Date(o.created_at) : new Date(0);

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: rawName,
        phone: rawPhone,
        cleanPhone,
        email: rawEmail,
        address: o.address || 'Standard Delivery',
        city: o.city || 'Pakistan',
        ordersCount: 1,
        totalSpent: (o.status !== 'cancelled') ? amount : 0,
        lastOrderDate: orderDate,
        orders: [o]
      });
    } else {
      const c = map.get(key);
      c.ordersCount += 1;
      if (o.status !== 'cancelled') c.totalSpent += amount;
      if (orderDate > c.lastOrderDate) {
        c.lastOrderDate = orderDate;
        if (o.address) c.address = o.address;
        if (o.city) c.city = o.city;
      }
      c.orders.push(o);
    }
  });

  return Array.from(map.values()).sort((a, b) => b.lastOrderDate - a.lastOrderDate);
}

function renderCustomersView() {
  const customers = getAggregatedCustomers();

  // Metrics
  const totalCust = customers.length;
  const repeatCust = customers.filter(c => c.ordersCount > 1).length;
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpend = totalCust > 0 ? Math.round(totalSpentAll / totalCust) : 0;

  const totalEl = document.getElementById('custMetricTotal');
  if (totalEl) totalEl.textContent = totalCust;

  const repeatEl = document.getElementById('custMetricRepeat');
  if (repeatEl) repeatEl.textContent = repeatCust;

  const avgEl = document.getElementById('custMetricAvgSpend');
  if (avgEl) avgEl.textContent = formatPKR(avgSpend);

  // Filter
  const filtered = customers.filter(c => {
    if (!customerSearchQuery) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  // Table Body
  const tbody = document.getElementById('customersTableBody');
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">No customers found matching search.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(c => {
        const phoneDigits = c.cleanPhone.startsWith('0') ? '92' + c.cleanPhone.substring(1) : c.cleanPhone;
        const waLink = c.cleanPhone ? `https://wa.me/${phoneDigits}?text=Hello%20${encodeURIComponent(c.name)}%2C%20Rev%20Moto%20Customer%20Care` : '#';
        const callLink = c.cleanPhone ? `tel:${c.cleanPhone}` : '#';

        return `
          <tr>
            <td>
              <strong style="color: var(--text-pure); font-size: 0.88rem;">${escapeHtml(c.name)}</strong>
              
            </td>
            <td>
              <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                ${escapeHtml(c.phone || 'No phone')}
              </div>
              <div style="display: flex; gap: 6px;">
                <a href="${waLink}" target="_blank" rel="noopener" class="btn-action-icon btn-action-wa" style="width: 30px; height: 30px;" title="Chat on WhatsApp">
                  ${SVG_ICONS.whatsapp}
                </a>
                <a href="${callLink}" class="btn-action-icon btn-action-call" style="width: 30px; height: 30px;" title="Call Customer">
                  ${SVG_ICONS.phone}
                </a>
              </div>
            </td>
            <td>
              <div style="font-size: 0.82rem; color: var(--text-primary); max-width: 260px; line-height: 1.35;">
                ${escapeHtml(c.address)}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(c.city)}</div>
            </td>
            <td>
              <span class="status-badge confirmed" style="font-size: 0.68rem;">
                ${c.ordersCount} ${c.ordersCount === 1 ? 'Order' : 'Orders'}
              </span>
            </td>
            <td>
              <strong style="color: var(--accent-blue); font-size: 0.88rem;">${formatPKR(c.totalSpent)}</strong>
            </td>
            <td>
              <span style="font-size: 0.76rem; color: var(--text-secondary);">${formatOrderDateTime(c.lastOrderDate)}</span>
            </td>
            <td style="text-align: right;">
              <button class="btn-admin btn-admin-subtle" style="padding: 6px 10px; font-size: 0.76rem;" onclick="viewCustomerOrders('${escapeHtml(c.name)}')" title="Filter orders for this rider">
                <i class="fas fa-list text-cyan"></i> Orders
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Mobile Cards
  const mobileContainer = document.getElementById('mobileCustomersContainer');
  if (mobileContainer) {
    if (filtered.length === 0) {
      mobileContainer.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">No customers found.</div>`;
    } else {
      mobileContainer.innerHTML = filtered.map(c => `
        <div class="mobile-order-card">
          <div class="m-order-header">
            <div>
              <strong style="font-size: 0.95rem; color: var(--text-pure);">${escapeHtml(c.name)}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(c.phone)}</div>
            </div>
            <span class="status-badge confirmed">${c.ordersCount} Orders</span>
          </div>
          <div style="padding: 8px 0; font-size: 0.8rem; color: var(--text-secondary); border-top: 1px dashed var(--border-subtle); margin: 6px 0;">
            ${escapeHtml(c.address)} • ${escapeHtml(c.city)}
          </div>
          <div class="m-order-actions">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Total Spend:</span>
              <strong style="color: var(--accent-blue); font-size: 0.95rem;">${formatPKR(c.totalSpent)}</strong>
            </div>
            <button class="btn-admin btn-admin-primary" style="padding: 6px 12px; font-size: 0.78rem;" onclick="viewCustomerOrders('${escapeHtml(c.name)}')">
              View Orders
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

function handleCustomerSearch() {
  customerSearchQuery = document.getElementById('custSearchInput')?.value || '';
  renderCustomersView();
}

function viewCustomerOrders(customerName) {
  switchAdminView('orders');
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.value = customerName;
    searchQuery = customerName.toLowerCase();
    activeFilter = 'all';
    periodMode = 'all';
    renderDashboard();
    showToast(`Filtering orders for "${customerName}"`, 'info');
  }
}

// ═══════════════════════════════════════════════════════════════
// REVIEWS MANAGEMENT VIEW
// ═══════════════════════════════════════════════════════════════
let activeReviewFilter = 'all';

function getAdminReviews() {
  try {
    const raw = localStorage.getItem('revmoto_reviews');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const defaults = [
    {
      id: 'rev-1',
      orderId: 'INV-14',
      customerName: 'Shahid Afridi',
      rating: 5,
      comment: 'The Armored Mesh Riding Jacket is top tier! Ventilation is amazing on highway rides in Islamabad heat, and CE armor fits snugly.',
      date: 'Nov 4, 2026, 2:37 PM'
    },
    {
      id: 'rev-2',
      orderId: 'INV-13',
      customerName: 'Kamran Akmal',
      rating: 5,
      comment: 'Carbon knuckle gloves fit like a glove! Fast 3-day delivery to Islamabad and clean COD packaging.',
      date: 'Nov 4, 2026, 1:15 PM'
    },
    {
      id: 'rev-3',
      orderId: 'INV-12',
      customerName: 'Bilal Haider',
      rating: 5,
      comment: 'Touring pants kept me completely dry during heavy rain. Material and stitching quality is 10/10.',
      date: 'Nov 4, 2026, 11:40 AM'
    },
    {
      id: 'rev-4',
      orderId: 'INV-11',
      customerName: 'Usman Tariq',
      rating: 4,
      comment: 'Magnetic tank bag has very strong grip even at 120 km/h. Clear mobile touch window works perfectly.',
      date: 'Nov 3, 2026, 6:20 PM'
    },
    {
      id: 'rev-5',
      orderId: 'INV-10',
      customerName: 'Zain Ali',
      rating: 5,
      comment: 'Thermal windproof balaclava cuts cold wind completely on morning commutes. Great customer service.',
      date: 'Nov 3, 2026, 2:10 PM'
    }
  ];

  localStorage.setItem('revmoto_reviews', JSON.stringify(defaults));
  return defaults;
}

function renderReviewsView() {
  const reviews = getAdminReviews();

  // Metrics
  const total = reviews.length;
  const sumRatings = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
  const avg = total > 0 ? (sumRatings / total).toFixed(1) : '5.0';
  const fiveStars = reviews.filter(r => Number(r.rating) === 5).length;
  const fourStars = reviews.filter(r => Number(r.rating) === 4).length;
  const threeBelow = reviews.filter(r => Number(r.rating) <= 3).length;
  const satisfactionPct = total > 0 ? Math.round(((fiveStars + fourStars) / total) * 100) : 100;

  const avgEl = document.getElementById('revMetricAvg');
  if (avgEl) avgEl.textContent = `${avg} ★`;

  const totalEl = document.getElementById('revMetricTotal');
  if (totalEl) totalEl.textContent = total;

  const pctEl = document.getElementById('revMetric5StarPct');
  if (pctEl) pctEl.textContent = `${satisfactionPct}%`;

  const countAll = document.getElementById('revCountAll');
  if (countAll) countAll.textContent = total;

  const count5 = document.getElementById('revCount5');
  if (count5) count5.textContent = fiveStars;

  const count4 = document.getElementById('revCount4');
  if (count4) count4.textContent = fourStars;

  const count3 = document.getElementById('revCount3');
  if (count3) count3.textContent = threeBelow;

  // Filter
  const filtered = reviews.filter(r => {
    const rate = Number(r.rating) || 5;
    if (activeReviewFilter === 'all') return true;
    if (activeReviewFilter === 5) return rate === 5;
    if (activeReviewFilter === 4) return rate === 4;
    if (activeReviewFilter === 3) return rate <= 3;
    return true;
  });

  // Table
  const tbody = document.getElementById('reviewsTableBody');
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">No reviews found for this rating filter.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(r => `
        <tr>
          <td>
            <strong style="color: var(--text-pure); font-size: 0.88rem;">${escapeHtml(r.customerName || 'Verified Rider')}</strong>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(r.date || 'Recent')}</div>
          </td>
          <td>
            <div style="color: #f59e0b; font-size: 0.82rem;">
              ${Array(Number(r.rating) || 5).fill('<i class="fas fa-star"></i>').join('')}
            </div>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-secondary);">${r.rating} Out of 5</span>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: var(--text-pure); line-height: 1.45;">
              ${escapeHtml(r.comment || '')}
            </div>
          </td>
          <td>
            ${r.orderId ? `<span class="order-id-badge" onclick="viewCustomerOrders('${escapeHtml(r.customerName)}')" style="cursor: pointer;">#${escapeHtml(r.orderId)}</span>` : '<span style="color: var(--text-muted); font-size: 0.76rem;">General Store</span>'}
          </td>
          <td style="text-align: right;">
            <button class="btn-admin btn-admin-subtle" style="padding: 6px 10px; color: #ef4444;" onclick="deleteAdminReview('${escapeHtml(r.id)}')" title="Delete Review">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Mobile Cards
  const mobileContainer = document.getElementById('mobileReviewsContainer');
  if (mobileContainer) {
    if (filtered.length === 0) {
      mobileContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No reviews found.</div>`;
    } else {
      mobileContainer.innerHTML = filtered.map(r => `
        <div class="mobile-order-card">
          <div class="m-order-header">
            <div>
              <strong style="color: var(--text-pure); font-size: 0.9rem;">${escapeHtml(r.customerName || 'Rider')}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 6px;">${escapeHtml(r.date || 'Recent')}</span>
            </div>
            <div style="color: #f59e0b; font-size: 0.8rem;">
              ${Array(Number(r.rating) || 5).fill('<i class="fas fa-star"></i>').join('')}
            </div>
          </div>
          <p style="margin: 8px 0; font-size: 0.82rem; color: var(--text-primary); line-height: 1.4;">
            ${escapeHtml(r.comment || '')}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-subtle); padding-top: 6px;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">${r.orderId ? 'Order #' + r.orderId : 'Store Review'}</span>
            <button class="btn-admin btn-admin-subtle" style="padding: 4px 8px; color: #ef4444; font-size: 0.75rem;" onclick="deleteAdminReview('${escapeHtml(r.id)}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

function filterReviewsByRating(rating, btn) {
  activeReviewFilter = rating;
  document.querySelectorAll('#reviewFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderReviewsView();
}

function deleteAdminReview(reviewId) {
  if (!confirm('Are you sure you want to delete this customer review?')) return;
  const reviews = getAdminReviews().filter(r => String(r.id) !== String(reviewId));
  localStorage.setItem('revmoto_reviews', JSON.stringify(reviews));
  showToast('Customer review deleted.', 'info');
  renderReviewsView();
}

function simulateTestReview() {
  const riders = ['Haris Rauf', 'Shaheen Afridi', 'Naseem Shah', 'Fakhar Zaman', 'Babar Azam'];
  const comments = [
    'Amazing armor fit! Saved my elbow during a track slide. Incredibly durable Kevlar lining.',
    'Fast delivery to Lahore in 2 days. The carbon knuckle gloves look and feel high end.',
    'Rain suit kept me completely warm on the northern bypass ride. Worth every rupee.',
    'Super breathable summer riding jacket. Great airflow and solid back protector.'
  ];
  const name = riders[Math.floor(Math.random() * riders.length)];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const reviews = getAdminReviews();
  reviews.unshift({
    id: 'rev-' + Date.now(),
    orderId: 'RM-' + Math.floor(85000 + Math.random() * 1000),
    customerName: name,
    rating: 5,
    comment: comment,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  });
  localStorage.setItem('revmoto_reviews', JSON.stringify(reviews));
  showToast(`Added test review from ${name}`, 'love');
  renderReviewsView();
}

// ═══════════════════════════════════════════════════════════════
// STORE SETTINGS MANAGEMENT (DELIVERY FEES, STATUS, CONTACT)
// ═══════════════════════════════════════════════════════════════
function loadStoreSettings() {
  try {
    const raw = localStorage.getItem('revmoto_store_settings');
    const settings = raw ? JSON.parse(raw) : {};

    const feeEl = document.getElementById('settingDeliveryFee');
    if (feeEl) feeEl.value = (settings.deliveryFee !== undefined) ? settings.deliveryFee : 350;

    const freeThreshEl = document.getElementById('settingFreeDeliveryThreshold');
    if (freeThreshEl) freeThreshEl.value = settings.freeDeliveryThreshold || 0;

    const timelineEl = document.getElementById('settingDeliveryTimeline');
    if (timelineEl) timelineEl.value = settings.deliveryLabel || 'Standard Tracked Delivery (3–5 Days)';

    const phoneEl = document.getElementById('settingPhone');
    if (phoneEl) phoneEl.value = settings.phone || '0337-4249450';

    const waEl = document.getElementById('settingWhatsApp');
    if (waEl) waEl.value = settings.whatsapp || '923374249450';

    const emailEl = document.getElementById('settingEmail');
    if (emailEl) emailEl.value = settings.email || 'revmoto.pk@gmail.com';

    const addrEl = document.getElementById('settingAddress');
    if (addrEl) addrEl.value = settings.address || 'Sialkot Manufacturing District, Punjab, Pakistan';

    const isClosed = settings.isStoreClosed === true;
    const openRadio = document.getElementById('storeStatusOpen');
    const closedRadio = document.getElementById('storeStatusClosed');
    if (openRadio && closedRadio) {
      openRadio.checked = !isClosed;
      closedRadio.checked = isClosed;
    }

    const closedNoticeGroup = document.getElementById('closedNoticeGroup');
    if (closedNoticeGroup) {
      closedNoticeGroup.style.display = isClosed ? 'block' : 'none';
    }
  } catch (e) {
    console.error('Error loading store settings:', e);
  }
}

function saveStoreSettings() {
  const deliveryFee = Number(document.getElementById('settingDeliveryFee')?.value || 350);
  const freeThreshold = Number(document.getElementById('settingFreeDeliveryThreshold')?.value || 0);
  const deliveryLabel = document.getElementById('settingDeliveryTimeline')?.value || 'Standard Tracked Delivery (3–5 Days)';
  const phone = document.getElementById('settingPhone')?.value || '0337-4249450';
  const whatsapp = document.getElementById('settingWhatsApp')?.value || '923374249450';
  const email = document.getElementById('settingEmail')?.value || 'revmoto.pk@gmail.com';
  const address = document.getElementById('settingAddress')?.value || 'Sialkot Manufacturing District, Punjab, Pakistan';
  const isStoreClosed = document.getElementById('storeStatusClosed')?.checked === true;
  const closedNotice = document.getElementById('settingClosedNotice')?.value || '';

  const settingsObj = {
    deliveryFee,
    freeDeliveryThreshold: freeThreshold,
    deliveryLabel,
    phone,
    whatsapp,
    email,
    address,
    isStoreClosed,
    closedNotice,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('revmoto_store_settings', JSON.stringify(settingsObj));
  showToast(`Settings saved! Standard delivery fee set to Rs. ${deliveryFee}`, 'success');
}


// ═══════════════════════════════════════════════════════════════
// SALES MANAGEMENT VIEW (ITEM-WISE SALES & TIME FILTERS)
// ═══════════════════════════════════════════════════════════════
let salesPeriodMode = 'daily'; // 'daily' | 'monthly' | 'annual' | 'all'
let salesPeriodDate = new Date();
let salesSearchQuery = '';
let salesSortOrder = 'rev_desc'; // 'rev_desc' | 'qty_desc' | 'name_asc'

function setSalesPeriod(mode, btn) {
  salesPeriodMode = mode;
  document.querySelectorAll('#salesPeriodPills .period-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderSalesPeriodNavigator();
  renderSalesView();
}

function isSalesCurrentPeriod() {
  if (salesPeriodMode === 'all') return false;
  if (salesPeriodMode === 'daily') {
    return (
      salesPeriodDate.getFullYear() === NOW.getFullYear() &&
      salesPeriodDate.getMonth() === NOW.getMonth() &&
      salesPeriodDate.getDate() === NOW.getDate()
    );
  }
  if (salesPeriodMode === 'monthly') {
    return (
      salesPeriodDate.getFullYear() === NOW.getFullYear() &&
      salesPeriodDate.getMonth() === NOW.getMonth()
    );
  }
  if (salesPeriodMode === 'annual') {
    return salesPeriodDate.getFullYear() === NOW.getFullYear();
  }
  return true;
}

function openSalesDailyPicker() {
  const el = document.getElementById('salesNativeDatePicker');
  if (el) {
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch (e) {}
    }
    el.focus();
    el.click();
  }
}

function jumpSalesToToday() {
  salesPeriodDate = new Date();
  renderSalesPeriodNavigator();
  renderSalesView();
}

function jumpSalesToCurrentMonth() {
  salesPeriodDate = new Date();
  renderSalesPeriodNavigator();
  renderSalesView();
}

function jumpSalesToCurrentYear() {
  salesPeriodDate = new Date();
  renderSalesPeriodNavigator();
  renderSalesView();
}

function resetSalesToCurrentPeriod() {
  setSalesPeriod('daily');
  jumpSalesToToday();
  showToast('Sales reset to current date (Today)', 'info');
}

function onSalesMonthSelectChange(m) {
  salesPeriodDate.setMonth(m);
  renderSalesPeriodNavigator();
  renderSalesView();
}

function onSalesYearSelectChange(y) {
  salesPeriodDate.setFullYear(y);
  renderSalesPeriodNavigator();
  renderSalesView();
}

function shiftSalesPeriod(direction) {
  if (salesPeriodMode === 'daily') {
    salesPeriodDate.setDate(salesPeriodDate.getDate() + direction);
  } else if (salesPeriodMode === 'monthly') {
    salesPeriodDate.setMonth(salesPeriodDate.getMonth() + direction);
  } else if (salesPeriodMode === 'annual') {
    salesPeriodDate.setFullYear(salesPeriodDate.getFullYear() + direction);
  }
  renderSalesPeriodNavigator();
  renderSalesView();
}

function handleSalesNativeDateChange(val) {
  if (!val) return;
  const parts = val.split('-');
  if (parts.length === 3) {
    salesPeriodDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    renderSalesPeriodNavigator();
    renderSalesView();
  }
}

function setSalesPeriod(mode, btn) {
  salesPeriodMode = mode;
  document.querySelectorAll('#salesPeriodSegmentedControl .period-segment-btn, #salesPeriodPills .period-pill').forEach(b => b.classList.remove('active'));
  const targetBtn = btn || document.getElementById(`btnSalesPeriod${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
  if (targetBtn) targetBtn.classList.add('active');
  renderSalesPeriodNavigator();
  renderSalesView();
}

function renderSalesPeriodNavigator() {
  const container = document.getElementById('salesPeriodNavigatorBox') || document.getElementById('salesDateNavWrap');
  if (!container) return;

  const currentYear = NOW.getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
    .map(y => `<option value="${y}" ${y === salesPeriodDate.getFullYear() ? 'selected' : ''}>${y}</option>`)
    .join('');

  const isCurrent = isSalesCurrentPeriod();
  const resetCrossBtn = !isCurrent ? `
    <button type="button" class="period-reset-cross" onclick="resetSalesToCurrentPeriod()" title="Reset to current (Today)">
      <i class="fas fa-times"></i>
    </button>
  ` : '';

  if (salesPeriodMode === 'all') {
    container.innerHTML = `
      <div class="period-all-label">
        <i class="fas fa-infinity"></i>
        <span>All-Time Sales History</span>
      </div>
    `;
    return;
  }

  if (salesPeriodMode === 'daily') {
    const y = salesPeriodDate.getFullYear();
    const m = String(salesPeriodDate.getMonth() + 1).padStart(2, '0');
    const d = String(salesPeriodDate.getDate()).padStart(2, '0');
    const inputVal = `${y}-${m}-${d}`;

    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(-1)" title="Previous Day">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-date-display" onclick="openSalesDailyPicker()" title="Click to pick a specific date">
        <span>${formatDateMMDDYYYY(salesPeriodDate)}</span>
        <i class="far fa-calendar-alt period-calendar-icon"></i>
        <input type="date" id="salesNativeDatePicker" class="hidden-date-picker" value="${inputVal}" onchange="handleSalesNativeDateChange(this.value)">
      </div>

      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(1)" title="Next Day">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpSalesToToday()" title="Jump to Today">
        TODAY
      </button>
      ${resetCrossBtn}
    `;
    return;
  }

  if (salesPeriodMode === 'monthly') {
    const monthOptions = MONTH_NAMES
      .map((name, idx) => `<option value="${idx}" ${idx === salesPeriodDate.getMonth() ? 'selected' : ''}>${name}</option>`)
      .join('');

    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(-1)" title="Previous Month">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-dropdowns-group">
        <select class="period-select" id="salesPeriodMonthSelect" onchange="onSalesMonthSelectChange(Number(this.value))">
          ${monthOptions}
        </select>
        <select class="period-select" id="salesPeriodYearSelect" onchange="onSalesYearSelectChange(Number(this.value))">
          ${yearOptions}
        </select>
      </div>

      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(1)" title="Next Month">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpSalesToCurrentMonth()" title="Jump to Current Month">
        THIS MONTH
      </button>
      ${resetCrossBtn}
    `;
    return;
  }

  if (salesPeriodMode === 'annual') {
    container.innerHTML = `
      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(-1)" title="Previous Year">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="period-dropdowns-group">
        <select class="period-select" id="salesPeriodYearSelect" onchange="onSalesYearSelectChange(Number(this.value))">
          ${yearOptions}
        </select>
      </div>

      <button type="button" class="period-nav-arrow" onclick="shiftSalesPeriod(1)" title="Next Year">
        <i class="fas fa-chevron-right"></i>
      </button>

      <button type="button" class="period-quick-btn" onclick="jumpSalesToCurrentYear()" title="Jump to This Year">
        THIS YEAR
      </button>
      ${resetCrossBtn}
    `;
    return;
  }
}


function getFilteredSalesOrders() {
  if (salesPeriodMode === 'all') {
    return ordersList.filter(o => o.status === 'delivered');
  }

  return ordersList.filter(o => {
    if (!o.created_at || o.status !== 'delivered') return false;
    const od = new Date(o.created_at);

    if (salesPeriodMode === 'daily') {
      return (
        od.getFullYear() === salesPeriodDate.getFullYear() &&
        od.getMonth() === salesPeriodDate.getMonth() &&
        od.getDate() === salesPeriodDate.getDate()
      );
    }
    if (salesPeriodMode === 'monthly') {
      return (
        od.getFullYear() === salesPeriodDate.getFullYear() &&
        od.getMonth() === salesPeriodDate.getMonth()
      );
    }
    if (salesPeriodMode === 'annual') {
      return od.getFullYear() === salesPeriodDate.getFullYear();
    }
    return true;
  });
}

function aggregateItemSales(scopedOrders) {
  const map = {};

  scopedOrders.forEach(o => {
    const items = o.items || [];
    items.forEach(it => {
      const name = (it.name || 'Motorcycle Gear').trim();
      const qty = Number(it.qty) || 1;
      const price = Number(it.price) || 0;
      const size = it.size || 'Standard';

      if (!map[name]) {
        // Smart product image and category lookup
        const lowerName = name.toLowerCase();
        const catalogProd = getAdminProducts().find(p => {
          const pName = p.name.toLowerCase();
          return pName === lowerName || pName.includes(lowerName) || lowerName.includes(pName);
        });

        let img = catalogProd ? catalogProd.img : '';
        if (!img) {
          if (lowerName.includes('jacket')) img = 'assets/images/jacket_cyber.jpg';
          else if (lowerName.includes('glove')) img = 'assets/images/gloves_carbon.jpg';
          else if (lowerName.includes('pant')) img = 'assets/images/jacket.jpeg';
          else if (lowerName.includes('bag') || lowerName.includes('pack')) img = 'assets/images/tankbag.jpeg';
          else if (lowerName.includes('mask') || lowerName.includes('balaclava')) img = 'assets/images/halfmask.jpeg';
          else if (lowerName.includes('tee') || lowerName.includes('shirt')) img = 'assets/images/tshirt.jpeg';
          else img = 'assets/images/jacket_cyber.jpg';
        }

        const category = catalogProd ? catalogProd.categoryLabel || catalogProd.category : 'Motorcycle Gear';

        map[name] = {
          name,
          category,
          image: img,
          totalQty: 0,
          totalRevenue: 0,
          sizes: {},
          lastSoldAt: o.created_at
        };
      }

      map[name].totalQty += qty;
      map[name].totalRevenue += (price * qty);
      map[name].sizes[size] = (map[name].sizes[size] || 0) + qty;

      if (new Date(o.created_at) > new Date(map[name].lastSoldAt || 0)) {
        map[name].lastSoldAt = o.created_at;
      }
    });
  });

  return Object.values(map);
}

function renderSalesView() {
  renderSalesPeriodNavigator();
  const scopedOrders = getFilteredSalesOrders();
  const aggregated = aggregateItemSales(scopedOrders);

  // Calculate Metrics
  const totalUnits = aggregated.reduce((sum, i) => sum + i.totalQty, 0);
  const totalRevenue = aggregated.reduce((sum, i) => sum + i.totalRevenue, 0);
  const totalSkus = aggregated.length;

  let topItemName = '—';
  let topItemQty = 0;
  if (aggregated.length > 0) {
    const sortedByQty = [...aggregated].sort((a, b) => b.totalQty - a.totalQty);
    topItemName = sortedByQty[0].name;
    topItemQty = sortedByQty[0].totalQty;
  }

  const unitsEl = document.getElementById('salesMetricUnits');
  if (unitsEl) unitsEl.textContent = totalUnits;

  const revEl = document.getElementById('salesMetricRevenue');
  if (revEl) revEl.textContent = formatPKR(totalRevenue);

  const topEl = document.getElementById('salesMetricTopItem');
  if (topEl) topEl.textContent = topItemName;

  const topHintEl = document.getElementById('salesMetricTopItemHint');
  if (topHintEl) topHintEl.textContent = topItemQty > 0 ? `${topItemQty} units sold` : 'No sales in period';

  const skusEl = document.getElementById('salesMetricSkus');
  if (skusEl) skusEl.textContent = totalSkus;

  // Filter & Sort Items
  let list = aggregated.filter(i => {
    if (!salesSearchQuery) return true;
    const q = salesSearchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
  });

  if (salesSortOrder === 'rev_desc') {
    list.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } else if (salesSortOrder === 'qty_desc') {
    list.sort((a, b) => b.totalQty - a.totalQty);
  } else if (salesSortOrder === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Table Body
  const tbody = document.getElementById('salesTableBody');
  if (tbody) {
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">No gear sales recorded in this period.</td></tr>`;
    } else {
      tbody.innerHTML = list.map((item, idx) => {
        const sharePct = totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100) : 0;
        const avgPrice = item.totalQty > 0 ? Math.round(item.totalRevenue / item.totalQty) : 0;
        const rankClass = idx === 0 ? 'top-1' : (idx === 1 ? 'top-2' : (idx === 2 ? 'top-3' : ''));

        // Sizes string
        const sizeBadges = Object.entries(item.sizes).map(([sz, q]) => `
          <span style="font-size: 0.72rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: var(--text-secondary); margin-right: 4px;">
            ${escapeHtml(sz)} (${q})
          </span>
        `).join('');

        return `
          <tr>
            <td>
              <div class="sales-rank-badge ${rankClass}">#${idx + 1}</div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${resolveAdminImgPath(item.image)}" alt="${escapeHtml(item.name)}" class="product-table-img" onerror="this.onerror=null; this.src='../assets/images/logo.png';">
                <div>
                  <strong style="color: var(--text-pure); font-size: 0.88rem;">${escapeHtml(item.name)}</strong>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(item.category)}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="status-badge confirmed" style="font-size: 0.74rem; font-weight: 800;">
                ${item.totalQty} Units Sold
              </span>
            </td>
            <td>
              <strong style="color: var(--accent-blue); font-size: 0.92rem;">${formatPKR(item.totalRevenue)}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${formatPKR(avgPrice)} / unit</div>
            </td>
            <td>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${sizeBadges}
              </div>
            </td>
            <td>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary);">${sharePct}%</div>
              <div class="sales-progress-wrap">
                <div class="sales-progress-bar" style="width: ${sharePct}%;"></div>
              </div>
            </td>
            <td>
              <span style="font-size: 0.76rem; color: var(--text-secondary);">${formatOrderDateTime(item.lastSoldAt)}</span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Mobile Cards
  const mobileContainer = document.getElementById('mobileSalesContainer');
  if (mobileContainer) {
    if (list.length === 0) {
      mobileContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No sales in this period.</div>`;
    } else {
      mobileContainer.innerHTML = list.map((item, idx) => `
        <div class="mobile-order-card">
          <div class="m-order-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="sales-rank-badge ${idx < 3 ? 'top-' + (idx + 1) : ''}">#${idx + 1}</span>
              <strong style="font-size: 0.9rem; color: var(--text-pure);">${escapeHtml(item.name)}</strong>
            </div>
            <span class="status-badge confirmed">${item.totalQty} Sold</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px dashed var(--border-subtle); padding-top: 6px;">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Item Revenue:</span>
              <strong style="color: var(--accent-blue); font-size: 0.95rem;">${formatPKR(item.totalRevenue)}</strong>
            </div>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${item.category}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

function handleSalesSearch() {
  salesSearchQuery = document.getElementById('salesSearchInput')?.value || '';
  renderSalesView();
}

function handleSalesSortChange() {
  salesSortOrder = document.getElementById('salesSortSelect')?.value || 'rev_desc';
  renderSalesView();
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT DATA LAYER & ACTIONS
// ═══════════════════════════════════════════════════════════════
const DEFAULT_CATEGORIES = [
  { id: 'jackets', label: 'Riding Jackets', shortName: 'Jackets' },
  { id: 'gloves', label: 'Motorcycle Gloves', shortName: 'Gloves' },
  { id: 'packs', label: 'Bags & Packs', shortName: 'Bags' },
  { id: 'masks', label: 'Face Masks & Balaclavas', shortName: 'Masks' },
  { id: 'apparel', label: 'Apparel & Accessories', shortName: 'Apparel' }
];

function getAdminCategories() {
  try {
    const raw = localStorage.getItem('revmoto_catalog_categories');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  localStorage.setItem('revmoto_catalog_categories', JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}

function saveAdminCategories(cats) {
  localStorage.setItem('revmoto_catalog_categories', JSON.stringify(cats));
  renderCategoryPills();
  populateProductCategorySelect();
  renderProductsView();
}

function renderCategoryPills() {
  const container = document.getElementById('prodCategoryPills');
  if (!container) return;

  const cats = getAdminCategories();
  const isAll = activeProductCategoryFilter === 'all';

  let html = `<button class="filter-tab ${isAll ? 'active' : ''}" onclick="filterProductsByCategory('all', this)">All</button>`;
  cats.forEach(c => {
    const isActive = activeProductCategoryFilter === c.id;
    html += `<button class="filter-tab ${isActive ? 'active' : ''}" onclick="filterProductsByCategory('${escapeHtml(c.id)}', this)">${escapeHtml(c.shortName || c.label)}</button>`;
  });

  container.innerHTML = html;
}

function populateProductCategorySelect(selectedId = '') {
  const select = document.getElementById('prodCategorySelect');
  if (!select) return;

  const cats = getAdminCategories();
  select.innerHTML = cats.map(c => `
    <option value="${escapeHtml(c.id)}" ${c.id === selectedId ? 'selected' : ''}>
      ${escapeHtml(c.label)}
    </option>
  `).join('');
}

function openCategoryManagerModal() {
  const modal = document.getElementById('categoryManagerModal');
  if (!modal) return;

  renderCategoryManagerList();
  modal.classList.add('open');
}

function closeCategoryManagerModal() {
  const modal = document.getElementById('categoryManagerModal');
  if (modal) modal.classList.remove('open');
}

function autoSuggestCatSlug() {
  const labelInput = document.getElementById('newCatLabelInput');
  const shortInput = document.getElementById('newCatShortInput');
  if (!labelInput || !shortInput) return;

  if (!shortInput.dataset.touched) {
    const parts = labelInput.value.trim().split(/\s+/);
    shortInput.value = parts[0] || '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const shortInput = document.getElementById('newCatShortInput');
  if (shortInput) {
    shortInput.addEventListener('input', () => {
      shortInput.dataset.touched = 'true';
    });
  }
});

function handleCreateCategory(e) {
  e.preventDefault();
  const label = document.getElementById('newCatLabelInput')?.value.trim();
  const shortName = document.getElementById('newCatShortInput')?.value.trim();

  if (!label || !shortName) {
    showToast('Please enter both category name and short pill label', 'warning');
    return;
  }

  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('cat-' + Date.now());
  const cats = getAdminCategories();

  if (cats.some(c => c.id === slug || c.label.toLowerCase() === label.toLowerCase())) {
    showToast('A category with this name already exists', 'warning');
    return;
  }

  cats.push({
    id: slug,
    label,
    shortName
  });

  saveAdminCategories(cats);
  renderCategoryManagerList();

  // Reset form
  const form = document.getElementById('addCategoryForm');
  if (form) form.reset();
  const sInput = document.getElementById('newCatShortInput');
  if (sInput) delete sInput.dataset.touched;

  showToast(`Category "${label}" created successfully!`, 'success');
}

function renderCategoryManagerList() {
  const container = document.getElementById('categoryManagerList');
  const countEl = document.getElementById('catManagerCount');
  if (!container) return;

  const cats = getAdminCategories();
  const products = getAdminProducts();
  if (countEl) countEl.textContent = cats.length;

  if (cats.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.84rem;">No categories defined.</div>`;
    return;
  }

  container.innerHTML = cats.map(c => {
    const prodCount = products.filter(p => p.category === c.id).length;
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(37,99,235,0.08); color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 0.88rem; flex-shrink: 0;">
            <i class="fas fa-folder"></i>
          </div>
          <div style="min-width: 0;">
            <div style="font-weight: 700; color: var(--text-pure); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(c.label)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 8px; align-items: center;">
              <span style="background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Pill: ${escapeHtml(c.shortName)}</span>
              <span>• ${prodCount} product${prodCount === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button type="button" class="btn-table-edit" style="padding: 4px 8px; font-size: 0.72rem;" onclick="editCategoryName('${escapeHtml(c.id)}')" title="Rename Category">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button type="button" class="btn-table-delete" style="padding: 4px 8px; font-size: 0.72rem;" onclick="deleteCategory('${escapeHtml(c.id)}')" title="Delete Category">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function editCategoryName(catId) {
  const cats = getAdminCategories();
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;

  const newLabel = prompt(`Edit full name for category "${cat.label}":`, cat.label);
  if (!newLabel || !newLabel.trim()) return;

  const newShort = prompt(`Edit filter pill short label (e.g. for button):`, cat.shortName || newLabel.trim().split(/\s+/)[0]);
  if (!newShort || !newShort.trim()) return;

  cat.label = newLabel.trim();
  cat.shortName = newShort.trim();

  // Also update existing products categoryLabel
  const products = getAdminProducts();
  let updatedAny = false;
  products.forEach(p => {
    if (p.category === catId) {
      p.categoryLabel = cat.label;
      updatedAny = true;
    }
  });

  if (updatedAny) {
    saveAdminProducts(products);
  }

  saveAdminCategories(cats);
  renderCategoryManagerList();
  showToast(`Category updated to "${cat.label}"!`, 'success');
}

function deleteCategory(catId) {
  const cats = getAdminCategories();
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;

  if (cats.length <= 1) {
    showToast('Store catalog must have at least one category', 'warning');
    return;
  }

  const products = getAdminProducts();
  const assigned = products.filter(p => p.category === catId);

  if (assigned.length > 0) {
    const fallbackCat = cats.find(c => c.id !== catId);
    const confirmMsg = `There are ${assigned.length} product(s) in "${cat.label}".

Deleting will move them to "${fallbackCat.label}". Are you sure?`;
    if (!confirm(confirmMsg)) return;

    assigned.forEach(p => {
      p.category = fallbackCat.id;
      p.categoryLabel = fallbackCat.label;
    });
    saveAdminProducts(products);
  } else {
    if (!confirm(`Delete category "${cat.label}"?`)) return;
  }

  const updatedCats = cats.filter(c => c.id !== catId);
  saveAdminCategories(updatedCats);
  renderCategoryManagerList();
  showToast(`Category "${cat.label}" deleted`, 'info');
}


// PRODUCTS & CATALOG MANAGEMENT ENGINE
// ═══════════════════════════════════════════════════════════════
const DEFAULT_CATALOG_PRODUCTS = [
  {
    id: 'rm-cyber-jacket-01',
    name: 'Armored Mesh Riding Jacket',
    category: 'jackets',
    categoryLabel: 'Riding Jackets',
    price: 14500,
    oldPrice: 18000,
    rating: 5.0,
    reviews: 48,
    inStock: true,
    isVariable: true,
    sizes: 'M (38-40"), L (41-43"), XL (44-46"), XXL (47-49")',
    variants: [
      { size: 'M (38-40")', price: 14500, oldPrice: 18000 },
      { size: 'L (41-43")', price: 15200, oldPrice: 18800 },
      { size: 'XL (44-46")', price: 15800, oldPrice: 19500 },
      { size: 'XXL (47-49")', price: 16500, oldPrice: 20500 },
    ],
    img: 'assets/images/jacket_cyber.jpg',
    tagline: 'Molded Carbon Armor Plates · High-Flow Airflow Mesh · 360° Reflective',
    desc: 'The pinnacle of motorcycle street armor. Features genuine vacuum-infused carbon fiber shoulder impact shields, ultra-durable 1000D ballistic mesh chassis for maximum hot-climate airflow.'
  },
  {
    id: 'rm-carbon-gloves-01',
    name: 'Carbon Fiber Riding Gloves',
    category: 'gloves',
    categoryLabel: 'Motorcycle Gloves',
    price: 5200,
    oldPrice: 6500,
    rating: 4.9,
    reviews: 64,
    inStock: true,
    isVariable: true,
    sizes: 'M (Palm 8.0-8.5"), L (Palm 8.5-9.0"), XL (Palm 9.0-9.5")',
    variants: [
      { size: 'M (Palm 8.0-8.5")', price: 5200, oldPrice: 6500 },
      { size: 'L (Palm 8.5-9.0")', price: 5500, oldPrice: 6900 },
      { size: 'XL (Palm 9.0-9.5")', price: 5900, oldPrice: 7400 },
    ],
    img: 'assets/images/gloves_carbon.jpg',
    tagline: 'Carbon Knuckle Shield · Palm Slider · Touchscreen Controls',
    desc: 'Crafted for instant throttle sensitivity and high-level protection. Molded carbon-fiber knuckles with shock-absorbing silicone gel underlay deflect impacts.'
  },
  {
    id: 'rm-nomad-tankbag-01',
    name: 'Magnetic Tank Bag (Modular)',
    category: 'packs',
    categoryLabel: 'Bags & Packs',
    price: 8200,
    oldPrice: 9900,
    rating: 4.8,
    reviews: 31,
    inStock: true,
    isVariable: true,
    sizes: '14L Streamline Urban, 18L Expandable Modular, 24L Long-Haul Touring',
    variants: [
      { size: '14L Streamline Urban', price: 8200, oldPrice: 9900 },
      { size: '18L Expandable Modular', price: 8900, oldPrice: 10500 },
      { size: '24L Long-Haul Touring', price: 9800, oldPrice: 11900 },
    ],
    img: 'assets/images/tankbag.jpeg',
    tagline: 'High-Strength Rare-Earth Magnets · Waterproof Cockpit Shell',
    desc: 'Four multi-directional high-flux rare-earth neodymium magnetic flaps clamp securely onto any steel fuel tank.'
  },
  {
    id: 'rm-touring-pants-01',
    name: 'Waterproof Touring Pants',
    category: 'jackets',
    categoryLabel: 'Riding Pants',
    price: 11500,
    oldPrice: 14000,
    rating: 4.9,
    reviews: 52,
    inStock: true,
    isVariable: false,
    sizes: '30, 32, 34, 36, 38',
    variants: [],
    img: 'assets/images/jacket.jpeg',
    tagline: 'HydraShield 10K Membrane · Adjustable CE Armor Pockets',
    desc: 'Engineered for cross-country highway endurance in torrential weather with reinforced knee abrasion pads.'
  },
  {
    id: 'rm-balaclava-01',
    name: 'Thermal Windproof Balaclava',
    category: 'masks',
    categoryLabel: 'Face Masks',
    price: 1850,
    oldPrice: 2400,
    rating: 4.8,
    reviews: 29,
    inStock: true,
    isVariable: true,
    sizes: 'Standard (Single PM0.1 Filter), Twin-Pack (3x Carbon Filters), Winter Pro (Thermal + 5x Filters)',
    variants: [
      { size: 'Standard (Single PM0.1 Filter)', price: 1850, oldPrice: 2400 },
      { size: 'Twin-Pack (3x Carbon Filters)', price: 2600, oldPrice: 3200 },
      { size: 'Winter Pro (Thermal + 5x Filters)', price: 3400, oldPrice: 4200 },
    ],
    img: 'assets/images/halfmask.jpeg',
    tagline: 'Laser Micro-Vents · Ergonomic Thermal Throat Gaiter',
    desc: 'Stops biting highway crosswinds while channeling exhalation away from helmet visors to eliminate fogging.'
  },
  {
    id: 'rm-street-gloves-02',
    name: 'Titanium Palm Short Gloves',
    category: 'gloves',
    categoryLabel: 'Motorcycle Gloves',
    price: 4200,
    oldPrice: 5500,
    rating: 4.9,
    reviews: 36,
    inStock: true,
    isVariable: false,
    sizes: 'M, L, XL',
    variants: [],
    img: 'assets/images/glove.jpeg',
    tagline: 'Titanium Slider Pucks · Perforated Airflow Leather',
    desc: 'Short aggressive urban cuff for everyday warm weather city riding.'
  },
  {
    id: 'rm-performance-tee-01',
    name: 'Rev Moto Performance Rider Tee',
    category: 'apparel',
    categoryLabel: 'Apparel',
    price: 3200,
    oldPrice: 3900,
    rating: 4.9,
    reviews: 42,
    inStock: true,
    isVariable: true,
    sizes: 'S (Drop Shoulder), M (Drop Shoulder), L (Drop Shoulder), XL (Drop Shoulder)',
    variants: [
      { size: 'S (Drop Shoulder)', price: 3200, oldPrice: 3900 },
      { size: 'M (Drop Shoulder)', price: 3200, oldPrice: 3900 },
      { size: 'L (Drop Shoulder)', price: 3450, oldPrice: 4200 },
      { size: 'XL (Drop Shoulder)', price: 3650, oldPrice: 4400 },
    ],
    img: 'assets/images/tshirt.jpeg',
    tagline: 'Moisture-Wicking Technical Poly · Antimicrobial Silver Fibers',
    desc: 'High-breathability base layer designed to be worn comfortably underneath armored jackets.'
  }
];

let activeProductCategoryFilter = 'all';
let productSearchQuery = '';

function getAdminProducts() {
  try {
    const raw = localStorage.getItem('revmoto_custom_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migration / enrichment: ensure default catalog products inherit variants if previously missing
        return parsed.map(p => {
          const defaultMatch = DEFAULT_CATALOG_PRODUCTS.find(d => d.id === p.id);
          return {
            ...p,
            inStock: p.inStock !== false,
            rating: p.rating || (defaultMatch && defaultMatch.rating) || 5.0,
            reviews: p.reviews || (defaultMatch && defaultMatch.reviews) || 36,
            isVariable: (p.isVariable !== undefined) ? p.isVariable : (defaultMatch ? defaultMatch.isVariable : false),
            variants: (p.variants && p.variants.length > 0) ? p.variants : (defaultMatch ? defaultMatch.variants : [])
          };
        });
      }
    }
  } catch (e) {}

  localStorage.setItem('revmoto_custom_products', JSON.stringify(DEFAULT_CATALOG_PRODUCTS));
  return DEFAULT_CATALOG_PRODUCTS;
}

function saveAdminProducts(products) {
  localStorage.setItem('revmoto_custom_products', JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('revmoto_products_updated', { detail: products }));
}

function renderProductsView() {
  renderCategoryPills();
  const products = getAdminProducts();

  // Metrics
  const total = products.length;
  const inStockCount = products.filter(p => p.inStock !== false).length;
  const categoriesCount = new Set(products.map(p => p.category)).size;

  const totalEl = document.getElementById('prodMetricTotal');
  if (totalEl) totalEl.textContent = total;

  const unitsEl = document.getElementById('prodMetricUnits');
  if (unitsEl) unitsEl.textContent = inStockCount;

  const catEl = document.getElementById('prodMetricCategories');
  if (catEl) catEl.textContent = categoriesCount;

  // Filter
  const filtered = products.filter(p => {
    const matchesCat = (activeProductCategoryFilter === 'all') || (p.category === activeProductCategoryFilter);
    const matchesQuery = !productSearchQuery || 
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
            (p.categoryLabel && p.categoryLabel.toLowerCase().includes(productSearchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Table
  const tbody = document.getElementById('productsTableBody');
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">No products found matching filters.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(p => {
        const inStock = p.inStock !== false;
        const stockLabel = inStock ? 'In Stock' : 'Out of Stock';

        // Check if variable pricing
        let priceHtml = `<strong style="color: var(--accent-blue); font-size: 0.92rem;">${formatPKR(p.price)}</strong>`;
        if (p.isVariable && Array.isArray(p.variants) && p.variants.length > 1) {
          const prices = p.variants.map(v => Number(v.price)).filter(n => !isNaN(n) && n > 0);
          if (prices.length > 0) {
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            if (minP !== maxP) {
              priceHtml = `<strong style="color: var(--accent-blue); font-size: 0.92rem;">From ${formatPKR(minP)}</strong>`;
            }
          }
        }
        if (p.oldPrice) {
          priceHtml += ` <span style="font-size: 0.75rem; text-decoration: line-through; color: var(--text-muted); margin-left: 4px;">${formatPKR(p.oldPrice)}</span>`;
        }

        return `
          <tr>
            <td>
              <img src="${resolveAdminImgPath(p.img)}" alt="${escapeHtml(p.name)}" class="product-table-img" onerror="this.onerror=null; this.src='../assets/images/logo.png';">
            </td>
            <td>
              <strong style="color: var(--text-pure); font-size: 0.88rem;">${escapeHtml(p.name)}</strong>
              
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(p.tagline || '')}</div>
            </td>
            <td>
              <span style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600;">${escapeHtml(p.categoryLabel || p.category)}</span>
            </td>
            <td>
              ${priceHtml}
              ${p.isVariable && Array.isArray(p.variants) && p.variants.length > 1 ? `<div style="font-size: 0.68rem; color: #2563eb; font-weight: 700; margin-top: 2px;"><i class="fas fa-layer-group"></i> ${p.variants.length} Sizes (Variable)</div>` : ''}
            </td>
            <td>
              <span style="font-size: 0.76rem; color: var(--text-secondary); max-width: 220px; display: block; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(p.sizes || 'Standard')}
              </span>
            </td>
            <td>
              <button type="button" class="stock-pill-btn ${inStock ? 'in-stock' : 'out-of-stock'}" onclick="toggleProductStock('${escapeHtml(p.id)}')" title="Click to toggle stock status">
                <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>${stockLabel}</span>
              </button>
            </td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 6px; justify-content: flex-end;">
                <button class="btn-table-edit" onclick="openProductModal('${escapeHtml(p.id)}')" title="Edit Product">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-table-delete" onclick="deleteProduct('${escapeHtml(p.id)}')" title="Delete Product">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Mobile Cards
  const mobileContainer = document.getElementById('mobileProductsContainer');
  if (mobileContainer) {
    if (filtered.length === 0) {
      mobileContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No products found.</div>`;
    } else {
      mobileContainer.innerHTML = filtered.map(p => {
        const inStock = p.inStock !== false;
        let priceDisplay = formatPKR(p.price);
        if (p.isVariable && Array.isArray(p.variants) && p.variants.length > 1) {
          const prices = p.variants.map(v => Number(v.price)).filter(n => !isNaN(n) && n > 0);
          if (prices.length > 0 && Math.min(...prices) !== Math.max(...prices)) {
            priceDisplay = `From ${formatPKR(Math.min(...prices))}`;
          }
        }
        return `
          <div class="mobile-order-card">
            <div style="display: flex; gap: 12px; align-items: center;">
              <img src="${resolveAdminImgPath(p.img)}" alt="${escapeHtml(p.name)}" class="product-table-img" style="width: 52px; height: 52px;" onerror="this.onerror=null; this.src='../assets/images/logo.png';">
              <div style="flex: 1;">
                <strong style="color: var(--text-pure); font-size: 0.92rem;">${escapeHtml(p.name)}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(p.categoryLabel || p.category)}</div>
                <strong style="color: var(--accent-blue); font-size: 0.95rem; margin-top: 2px; display: block;">${priceDisplay}</strong>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px dashed var(--border-subtle); padding-top: 8px;">
              <button type="button" class="stock-pill-btn ${inStock ? 'in-stock' : 'out-of-stock'}" onclick="toggleProductStock('${escapeHtml(p.id)}')">
                <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>${inStock ? 'In Stock' : 'Out of Stock'}</span>
              </button>
              <div style="display: flex; gap: 6px;">
                <button class="btn-admin btn-admin-subtle" style="padding: 5px 10px; font-size: 0.75rem;" onclick="openProductModal('${escapeHtml(p.id)}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-admin btn-admin-subtle" style="padding: 5px 10px; font-size: 0.75rem; color: #ef4444;" onclick="deleteProduct('${escapeHtml(p.id)}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function filterProductsByCategory(cat, btn) {
  activeProductCategoryFilter = cat;
  document.querySelectorAll('#prodCategoryPills .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProductsView();
}

function handleProductSearch() {
  productSearchQuery = document.getElementById('prodSearchInput')?.value || '';
  renderProductsView();
}

function toggleProductStock(productId) {
  const products = getAdminProducts();
  const prod = products.find(p => String(p.id) === String(productId));
  if (!prod) return;

  const currentStatus = prod.inStock !== false;
  prod.inStock = !currentStatus;
  showToast(`"${prod.name}" marked ${prod.inStock ? 'In Stock' : 'Out of Stock'}`, prod.inStock ? 'success' : 'info');

  saveAdminProducts(products);
  renderProductsView();
}

function deleteProduct(productId) {
  const products = getAdminProducts();
  const prod = products.find(p => String(p.id) === String(productId));
  if (!prod) return;

  if (!confirm(`Are you sure you want to delete "${prod.name}" from the store catalog?`)) return;

  const updated = products.filter(p => String(p.id) !== String(productId));
  saveAdminProducts(updated);
  showToast(`"${prod.name}" removed from catalog.`, 'info');
  renderProductsView();
}

// ── PRODUCT PRICING & VARIANT CONTROLLERS ──
let currentProductPricingMode = 'simple';

function setProductPricingMode(mode) {
  currentProductPricingMode = mode;
  const btnSimple = document.getElementById('btnModeSimple');
  const btnVariable = document.getElementById('btnModeVariable');
  const simpleSec = document.getElementById('simplePricingSection');
  const varSec = document.getElementById('variablePricingSection');
  const typeInput = document.getElementById('prodPricingType');

  if (typeInput) typeInput.value = mode;

  if (mode === 'variable') {
    if (btnSimple) btnSimple.classList.remove('active');
    if (btnVariable) btnVariable.classList.add('active');
    if (simpleSec) simpleSec.style.display = 'none';
    if (varSec) varSec.style.display = 'block';

    // If container has no rows yet, populate default rows based on current simple inputs
    const container = document.getElementById('variantRowsContainer');
    if (container && container.children.length === 0) {
      const curPrice = Number(document.getElementById('prodPriceInput')?.value) || 0;
      const curOldPrice = Number(document.getElementById('prodOldPriceInput')?.value) || 0;
      const sizesStr = document.getElementById('prodSizesInput')?.value || '';
      const sizesArr = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
      if (sizesArr.length > 0) {
        renderVariantRows(sizesArr.map(s => ({ size: s, price: curPrice || 14500, oldPrice: curOldPrice || 18000 })));
      } else {
        renderVariantRows([
          { size: 'M (38-40")', price: curPrice || 14500, oldPrice: curOldPrice || 18000 },
          { size: 'L (41-43")', price: (curPrice || 14500) + 700, oldPrice: (curOldPrice || 18000) + 800 }
        ]);
      }
    }
  } else {
    if (btnSimple) btnSimple.classList.add('active');
    if (btnVariable) btnVariable.classList.remove('active');
    if (simpleSec) simpleSec.style.display = 'block';
    if (varSec) varSec.style.display = 'none';

    // If switching back to simple, derive base price & sizes string from first variant
    const container = document.getElementById('variantRowsContainer');
    if (container && container.children.length > 0) {
      const rows = getVariantRowsData();
      if (rows.length > 0) {
        const priceInput = document.getElementById('prodPriceInput');
        const oldPriceInput = document.getElementById('prodOldPriceInput');
        const sizesInput = document.getElementById('prodSizesInput');
        if (priceInput && (!priceInput.value || Number(priceInput.value) === 0)) {
          priceInput.value = rows[0].price || '';
        }
        if (oldPriceInput && !oldPriceInput.value) {
          oldPriceInput.value = rows[0].oldPrice || '';
        }
        if (sizesInput) {
          sizesInput.value = rows.map(r => r.size).join(', ');
        }
      }
    }
  }
}

function renderVariantRows(variants = []) {
  const container = document.getElementById('variantRowsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!variants || variants.length === 0) {
    addEmptyVariantRow();
    return;
  }
  variants.forEach(v => {
    addVariantRow(v.size || '', v.price !== undefined ? v.price : '', v.oldPrice !== undefined ? v.oldPrice : '');
  });
}

function addVariantRow(size = '', price = '', oldPrice = '') {
  const container = document.getElementById('variantRowsContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'variant-row';
  row.innerHTML = `
    <div>
      <input type="text" class="admin-search-input var-size-input" placeholder="e.g. M (38-40&quot;)" value="${escapeHtml(size)}" required style="width: 100%; height: 36px; font-size: 0.84rem; font-weight: 600;">
    </div>
    <div style="position: relative;">
      <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Rs.</span>
      <input type="number" class="admin-search-input var-price-input" placeholder="14500" value="${price !== '' ? price : ''}" min="0" required style="width: 100%; height: 36px; padding-left: 32px; font-size: 0.84rem; font-weight: 700; color: #0f172a;">
    </div>
    <div style="position: relative;">
      <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: #94a3b8; font-weight: 700;">Rs.</span>
      <input type="number" class="admin-search-input var-oldprice-input" placeholder="18000" value="${oldPrice !== '' ? oldPrice : ''}" min="0" style="width: 100%; height: 36px; padding-left: 32px; font-size: 0.84rem;">
    </div>
    <div style="text-align: center;">
      <button type="button" class="btn-var-delete" onclick="removeVariantRow(this)" title="Remove size variant">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
  container.appendChild(row);
}

function addEmptyVariantRow() {
  const basePrice = Number(document.getElementById('prodPriceInput')?.value) || '';
  const baseOldPrice = Number(document.getElementById('prodOldPriceInput')?.value) || '';
  addVariantRow('', basePrice, baseOldPrice);
}

function removeVariantRow(btn) {
  const container = document.getElementById('variantRowsContainer');
  if (!container) return;
  const row = btn.closest('.variant-row');
  if (row) {
    if (container.querySelectorAll('.variant-row').length <= 1) {
      showToast('At least one size variant is required for variable products.', 'warning');
      return;
    }
    row.remove();
  }
}

function getVariantRowsData() {
  const container = document.getElementById('variantRowsContainer');
  if (!container) return [];
  const rows = container.querySelectorAll('.variant-row');
  const data = [];
  rows.forEach(r => {
    const size = r.querySelector('.var-size-input')?.value.trim();
    const price = Number(r.querySelector('.var-price-input')?.value || 0);
    const oldPrice = Number(r.querySelector('.var-oldprice-input')?.value || 0);
    if (size) {
      data.push({ size, price, oldPrice });
    }
  });
  return data;
}

function applySimpleSizesPreset(presetStr) {
  const input = document.getElementById('prodSizesInput');
  if (input) {
    input.value = presetStr;
    input.focus();
  }
}

function loadVariantPreset(type) {
  const basePrice = Number(document.getElementById('prodPriceInput')?.value) || 0;
  const baseOld = Number(document.getElementById('prodOldPriceInput')?.value) || 0;

  let presets = [];
  if (type === 'jackets') {
    const p = basePrice || 14500;
    const op = baseOld || 18000;
    presets = [
      { size: 'M (38-40")', price: p, oldPrice: op },
      { size: 'L (41-43")', price: p + 700, oldPrice: op + 800 },
      { size: 'XL (44-46")', price: p + 1300, oldPrice: op + 1500 },
      { size: 'XXL (47-49")', price: p + 2000, oldPrice: op + 2500 },
    ];
  } else if (type === 'gloves') {
    const p = basePrice || 5200;
    const op = baseOld || 6500;
    presets = [
      { size: 'M (Palm 8.0-8.5")', price: p, oldPrice: op },
      { size: 'L (Palm 8.5-9.0")', price: p + 300, oldPrice: op + 400 },
      { size: 'XL (Palm 9.0-9.5")', price: p + 700, oldPrice: op + 900 },
    ];
  } else if (type === 'packs') {
    const p = basePrice || 8200;
    const op = baseOld || 9900;
    presets = [
      { size: '14L Streamline Urban', price: p, oldPrice: op },
      { size: '18L Expandable Modular', price: p + 700, oldPrice: op + 600 },
      { size: '24L Long-Haul Touring', price: p + 1600, oldPrice: op + 2000 },
    ];
  } else if (type === 'masks') {
    const p = basePrice || 1850;
    const op = baseOld || 2400;
    presets = [
      { size: 'Standard (Single PM0.1 Filter)', price: p, oldPrice: op },
      { size: 'Twin-Pack (3x Carbon Filters)', price: p + 750, oldPrice: op + 800 },
      { size: 'Winter Pro (Thermal + 5x Filters)', price: p + 1550, oldPrice: op + 1800 },
    ];
  }

  renderVariantRows(presets);
}

// ── PRODUCT MODAL CONTROLLER ──
function openProductModal(productId = null) {
  populateProductCategorySelect();
  const modal = document.getElementById('productModal');
  if (!modal) return;

  const titleEl = document.getElementById('productModalTitle');
  const idInput = document.getElementById('editingProductId');
  const nameInput = document.getElementById('prodNameInput');
  const catSelect = document.getElementById('prodCategorySelect');
    const priceInput = document.getElementById('prodPriceInput');
  const oldPriceInput = document.getElementById('prodOldPriceInput');
  const sizesInput = document.getElementById('prodSizesInput');
  const imgUrlInput = document.getElementById('prodImageUrlInput');
  const taglineInput = document.getElementById('prodTaglineInput');
  const descInput = document.getElementById('prodDescInput');
  const previewBox = document.getElementById('productModalImgPreview');

  if (productId) {
    const products = getAdminProducts();
    const prod = products.find(p => String(p.id) === String(productId));
    if (!prod) return;

    if (titleEl) titleEl.textContent = 'Edit Product: ' + prod.name;
    if (idInput) idInput.value = prod.id;
    if (nameInput) nameInput.value = prod.name;
    if (catSelect) catSelect.value = prod.category || 'jackets';
        if (priceInput) priceInput.value = prod.price || '';
    if (oldPriceInput) oldPriceInput.value = prod.oldPrice || '';
    if (sizesInput) sizesInput.value = prod.sizes || '';
    if (imgUrlInput) imgUrlInput.value = prod.img || '';
    if (taglineInput) taglineInput.value = prod.tagline || '';
    if (descInput) descInput.value = prod.desc || '';

    if (previewBox) {
      previewBox.innerHTML = prod.img ? `<img src="${resolveAdminImgPath(prod.img)}" alt="Preview" onerror="this.onerror=null; this.src='../assets/images/logo.png';" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-image" style="color: var(--text-muted); font-size: 1.5rem;"></i>`;
    }

    // Determine pricing mode: is it variable product?
    const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
    const isVariable = prod.isVariable === true || (hasVariants && (prod.variants.length > 1 || prod.variants.some((v, _, arr) => v.price !== arr[0].price)));

    if (isVariable && hasVariants) {
      setProductPricingMode('variable');
      renderVariantRows(prod.variants);
    } else {
      setProductPricingMode('simple');
      if (hasVariants) {
        renderVariantRows(prod.variants);
      } else {
        renderVariantRows([]);
      }
    }
  } else {
    if (titleEl) titleEl.textContent = 'Add New Product to Catalog';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (catSelect) catSelect.value = 'jackets';
    if (badgeInput) badgeInput.value = 'New Arrival';
    if (priceInput) priceInput.value = '';
    if (oldPriceInput) oldPriceInput.value = '';
    if (sizesInput) sizesInput.value = 'M, L, XL, XXL';
    if (imgUrlInput) imgUrlInput.value = 'assets/images/jacket_cyber.jpg';
    if (taglineInput) taglineInput.value = '';
    if (descInput) descInput.value = '';

    if (previewBox) {
      previewBox.innerHTML = `<img src="assets/images/jacket_cyber.jpg" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    setProductPricingMode('simple');
    renderVariantRows([]);
  }

  modal.classList.add('open');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('open');
}

function handleProductImageFile(e) {
  const file = e.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;
    const urlInput = document.getElementById('prodImageUrlInput');
    if (urlInput) urlInput.value = dataUrl;
    updateProductImagePreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function updateProductImagePreview(url) {
  const previewBox = document.getElementById('productModalImgPreview');
  if (!previewBox) return;
  if (url && url.trim()) {
    previewBox.innerHTML = `<img src="${url.trim()}" alt="Preview" onerror="this.onerror=null; this.src='assets/images/jacket_cyber.jpg'" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    previewBox.innerHTML = `<i class="fas fa-image" style="color: var(--text-muted); font-size: 1.5rem;"></i>`;
  }
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editingProductId')?.value;
  const name = document.getElementById('prodNameInput')?.value.trim();
  const category = document.getElementById('prodCategorySelect')?.value || 'jackets';
    const mode = currentProductPricingMode;
  const img = document.getElementById('prodImageUrlInput')?.value.trim() || 'assets/images/jacket_cyber.jpg';
  const tagline = document.getElementById('prodTaglineInput')?.value.trim();
  const desc = document.getElementById('prodDescInput')?.value.trim();

  let price = 0;
  let oldPrice = 0;
  let sizes = '';
  let variants = [];
  let isVariable = false;

  if (mode === 'variable') {
    variants = getVariantRowsData();
    if (variants.length === 0) {
      showToast('Please add at least one size variant with a price.', 'warning');
      return;
    }
    isVariable = true;
    const validPrices = variants.map(v => v.price).filter(p => p > 0);
    price = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    oldPrice = variants[0]?.oldPrice || 0;
    sizes = variants.map(v => v.size).join(', ');
  } else {
    price = Number(document.getElementById('prodPriceInput')?.value || 0);
    oldPrice = Number(document.getElementById('prodOldPriceInput')?.value || 0);
    sizes = document.getElementById('prodSizesInput')?.value.trim() || 'Standard';
    isVariable = false;
    const sizesArr = sizes.split(',').map(s => s.trim()).filter(Boolean);
    variants = sizesArr.map(s => ({
      size: s,
      price,
      oldPrice: oldPrice || (price > 0 ? Math.round(price * 1.25) : 0)
    }));
  }

  const adminCats = getAdminCategories();
  const matchedCat = adminCats.find(c => c.id === category);
  const resolvedCategoryLabel = matchedCat ? matchedCat.label : (category.charAt(0).toUpperCase() + category.slice(1));

  const products = getAdminProducts();

  if (id) {
    // Edit existing product
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      const existing = products[idx];
      products[idx] = {
        ...existing,
        name,
        category,
        categoryLabel: resolvedCategoryLabel,
        badge,
        price,
        oldPrice: oldPrice || (price > 0 ? Math.round(price * 1.25) : 0),
        inStock: existing.inStock !== false,
        stockCount: 99,
        isVariable,
        sizes,
        variants,
        img,
        tagline,
        desc
      };
      showToast(`Product "${name}" updated!`, 'success');
    }
  } else {
    // Create new product
    const newId = 'rm-custom-' + Date.now();
    const newProd = {
      id: newId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      categoryLabel: resolvedCategoryLabel,
      badge: badge || 'New Arrival',
      price,
      oldPrice: oldPrice || (price > 0 ? Math.round(price * 1.25) : 0),
      inStock: true,
      stockCount: 99,
      isVariable,
      sizes,
      variants,
      img,
      images: [img],
      tagline: tagline || 'High-Performance Motorcycle Gear',
      desc: desc || `${name} engineered for superior protection and rider comfort.`,
      rating: 5.0,
      reviews: 24,
      featured: true
    };
    products.unshift(newProd);
    showToast(`"${name}" added to catalog!`, 'success');
  }

  saveAdminProducts(products);
  closeProductModal();
  renderProductsView();
}

// ── DOWNLOAD MOBILE APP MODAL CONTROLS ─────────────────────
function openDownloadAppModal() {
  const modal = document.getElementById('downloadAppModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  requestNotificationPermission();
}

function closeDownloadAppModal() {
  const modal = document.getElementById('downloadAppModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function handleDownloadApk(e) {
  if (e && e.preventDefault) e.preventDefault();

  const isLocalFile = window.location.protocol === 'file:' || window.location.origin === 'null' || !window.location.origin;
  const directCdnUrl = 'https://github.com/SalikLeo/Rev-Moto-Bike-Gear-Website/raw/main/rev-moto-admin.apk';
  
  if (isLocalFile) {
    showToast('APK is saved in folder: APK_FOR_MOBILE and on your Desktop!', 'info');
    window.open(directCdnUrl, '_blank');
    return;
  }

  const siteUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '') + '/rev-moto-admin.apk';
  
  // Try direct anchor download
  try {
    const a = document.createElement('a');
    a.href = siteUrl;
    a.download = 'rev-moto-admin.apk';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloading Rev Moto Admin APK...', 'success');
  } catch(err) {
    window.open(directCdnUrl, '_blank');
  }
}

function copyApkLink() {
  const isLocalFile = window.location.protocol === 'file:' || window.location.origin === 'null' || !window.location.origin;
  const fullUrl = isLocalFile
    ? 'https://github.com/SalikLeo/Rev-Moto-Bike-Gear-Website/raw/main/rev-moto-admin.apk'
    : (window.location.origin + window.location.pathname.replace(/\/+$/, '') + '/rev-moto-admin.apk');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('APK download link copied to clipboard!', 'success');
    }).catch(() => {
      prompt('Copy APK Download URL:', fullUrl);
    });
  } else {
    prompt('Copy APK Download URL:', fullUrl);
  }
}

// Auto-request notifications on first user gesture
document.addEventListener('click', function autoReqNotifOnce() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  document.removeEventListener('click', autoReqNotifOnce);
}, { once: true });

// Auto background sync interval every 25 seconds for reliable mobile sync
setInterval(() => {
  if (document.visibilityState === 'visible' || (window.Android)) {
    fetchOrders();
  }
}, 25000);
