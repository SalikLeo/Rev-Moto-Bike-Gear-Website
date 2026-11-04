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
    id: 'RM-85623',
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
    id: 'RM-85619',
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
    id: 'RM-85590',
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
    id: 'RM-85480',
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
    id: 'RM-85442',
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
    id: 'RM-85310',
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
    id: 'RM-85265',
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
    id: 'RM-85199',
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
    id: 'RM-84950',
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
    id: 'RM-84880',
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
    id: 'RM-84720',
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
    id: 'RM-83910',
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
    id: 'RM-83844',
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
    id: 'RM-81200',
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

// ── SUPABASE CONNECTION & SYNC ──────────────────────────────
function initSupabase() {
  const statusEl = document.getElementById('connectionStatusPill');
  const bannerEl = document.getElementById('setupBanner');
  if (!statusEl) return false;

  const url = localStorage.getItem('rm_supabase_url');
  const key = localStorage.getItem('rm_supabase_anon_key');

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url.trim(), key.trim());
      statusEl.className = 'status-indicator live';
      statusEl.innerHTML = '<span class="status-dot pulse"></span> Supabase Connected (Live)';
      if (bannerEl) bannerEl.style.display = 'none';
      setupRealtimeSubscription();
      return true;
    } catch (err) {
      console.error('Supabase init error:', err);
    }
  }

  statusEl.className = 'status-indicator demo';
  statusEl.innerHTML = '<span class="status-dot"></span> Local Storage (Demo Mode)';
  if (bannerEl) bannerEl.style.display = 'flex';
  return false;
}

function setupRealtimeSubscription() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playOrderChime();
          showToast(`⚡ New Order Received: #${payload.new.id}`, 'info');
        }
        fetchOrders();
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription notice:', err);
  }
}

async function fetchOrders() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        ordersList = data;
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
      ordersList = JSON.parse(stored);
      if (!Array.isArray(ordersList) || ordersList.length < 5) {
        ordersList = DEFAULT_SAMPLE_ORDERS;
        saveLocalOrders(ordersList);
      }
    } catch (e) {
      ordersList = DEFAULT_SAMPLE_ORDERS;
      saveLocalOrders(ordersList);
    }
  } else {
    ordersList = DEFAULT_SAMPLE_ORDERS;
    saveLocalOrders(ordersList);
  }

  renderDashboard();
}

function saveLocalOrders(orders) {
  localStorage.setItem('rm_orders', JSON.stringify(orders));
}

// ── PERIOD FILTER LOGIC (Daily / Monthly / Annual / All) ──
function setPeriodMode(mode) {
  periodMode = mode;

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
    periodDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    renderPeriodNavigator();
    currentPage = 1;
    renderDashboard();
  }
}

function onMonthSelectChange(m) {
  const d = new Date(periodDate.getTime());
  d.setMonth(m);
  periodDate = d;
  renderPeriodNavigator();
  currentPage = 1;
  renderDashboard();
}

function onYearSelectChange(y) {
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

function getFilteredOrders() {
  return ordersList.filter(order => {
    // 1. Period Date Filter
    if (!matchesPeriodFilter(order.created_at)) {
      return false;
    }
    // 2. Status Pipeline Filter
    if (activeFilter !== 'all' && order.status !== activeFilter) {
      return false;
    }
    // 3. Search Query
    if (searchQuery) {
      const idMatch = (order.id || '').toLowerCase().includes(searchQuery);
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
  let totalRev = 0;
  let totalOrders = scopedOrders.length;
  let pendingCount = 0;
  let dispatchedCount = 0;

  scopedOrders.forEach(order => {
    const amt = Number(order.total_amount) || 0;
    if (order.status !== 'cancelled') {
      totalRev += amt;
    }
    if (order.status === 'pending') pendingCount++;
    if (order.status === 'dispatched') dispatchedCount++;
  });

  const revEl = document.getElementById('metricRevenueVal');
  const ordEl = document.getElementById('metricOrdersVal');
  const penEl = document.getElementById('metricPendingVal');
  const disEl = document.getElementById('metricDispatchedVal');

  if (revEl) revEl.textContent = formatPKR(totalRev);
  if (ordEl) ordEl.textContent = totalOrders;
  if (penEl) penEl.textContent = pendingCount;
  if (disEl) disEl.textContent = dispatchedCount;

  // Dynamic subtitle describing the selected period
  let periodLabelText = '';
  if (periodMode === 'daily') {
    periodLabelText = `Volume for ${formatDateMMDDYYYY(periodDate)}`;
  } else if (periodMode === 'monthly') {
    periodLabelText = `Volume for ${MONTH_NAMES[periodDate.getMonth()]} ${periodDate.getFullYear()}`;
  } else if (periodMode === 'annual') {
    periodLabelText = `Annual Volume for ${periodDate.getFullYear()}`;
  } else {
    periodLabelText = 'All-time volume';
  }

  const cards = document.querySelectorAll('.metrics-grid .metric-card .metric-sub');
  if (cards && cards[0]) cards[0].textContent = periodLabelText;
  if (cards && cards[1]) cards[1].textContent = `Found ${totalOrders} order(s) in this period`;
}

function renderFilterTabs() {
  const scopedOrders = getPeriodFilteredOrders();
  const counts = {
    all: scopedOrders.length,
    pending: scopedOrders.filter(o => o.status === 'pending').length,
    confirmed: scopedOrders.filter(o => o.status === 'confirmed').length,
    dispatched: scopedOrders.filter(o => o.status === 'dispatched').length,
    delivered: scopedOrders.filter(o => o.status === 'delivered').length,
    cancelled: scopedOrders.filter(o => o.status === 'cancelled').length,
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

  container.innerHTML = filters.map(f => `
    <button class="filter-pill-btn ${activeFilter === f.key ? 'active' : ''}" onclick="setFilter('${f.key}', this)">
      ${f.label}
      <span class="filter-count-badge">${counts[f.key] || 0}</span>
    </button>
  `).join('');
}

function setFilter(key, btnEl) {
  activeFilter = key;
  currentPage = 1;
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
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
          No orders found for the selected period &amp; filters.
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
          <a class="order-id-link" onclick="openOrderModal('${order.id}')">#${order.id}</a>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${formatTimeAgo(order.created_at)}</div>
        </td>
        <td>
          <div class="customer-meta-row">
            <span class="customer-name">${escapeHtml(order.customer_name || 'Guest Rider')}</span>
            <span class="customer-phone">${escapeHtml(order.phone || 'No phone')}</span>
          </div>
        </td>
        <td style="max-width: 260px;">
          <div style="font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
            ${escapeHtml(itemsSummary || 'Standard Order')}
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">
            ${order.items ? order.items.length : 1} item(s) • COD
          </div>
        </td>
        <td>
          <span class="order-price-val">${formatPKR(order.total_amount)}</span>
        </td>
        <td>
          <span class="status-badge ${order.status || 'pending'}">
            ${order.status || 'pending'}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <button class="btn-admin btn-admin-subtle" style="padding: 6px 10px; font-size: 0.76rem;" onclick="openReceiptModal('${order.id}')" title="80mm Thermal Receipt">
              <i class="fas fa-receipt text-cyan"></i>
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-admin btn-whatsapp-sm" style="padding: 6px 10px; font-size: 0.76rem;" title="Chat on WhatsApp">
              <i class="fab fa-whatsapp"></i> WA
            </a>
            <a href="tel:${phoneClean}" class="btn-admin btn-call-sm" style="padding: 6px 10px; font-size: 0.76rem;" title="Call Customer">
              <i class="fas fa-phone"></i>
            </a>
            <button class="btn-admin btn-admin-subtle" style="padding: 6px 10px; font-size: 0.76rem;" onclick="openOrderModal('${order.id}')" title="Manage Order">
              <i class="fas fa-sliders"></i>
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
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); color: var(--text-muted);">
        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
        No orders found for the selected period &amp; filters.
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
            <span class="m-order-id" onclick="openOrderModal('${order.id}')">#${order.id}</span>
            <span class="m-order-time">• ${formatTimeAgo(order.created_at)}</span>
          </div>
          <span class="status-badge ${order.status || 'pending'}">
            ${order.status || 'pending'}
          </span>
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
          <button class="btn-admin btn-admin-subtle" onclick="openReceiptModal('${order.id}')" title="80mm Receipt">
            <i class="fas fa-receipt text-cyan"></i> Slip
          </button>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-admin btn-whatsapp-sm">
            <i class="fab fa-whatsapp"></i> WA
          </a>
          <a href="tel:${phoneClean}" class="btn-admin btn-call-sm">
            <i class="fas fa-phone"></i> Call
          </a>
          <button class="btn-admin btn-admin-subtle" onclick="openOrderModal('${order.id}')">
            <i class="fas fa-sliders"></i> Edit
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
  const order = ordersList.find(o => String(o.id) === String(orderId));
  if (!order) return;

  currentSelectedOrder = order;

  document.getElementById('modalOrderId').textContent = '#' + order.id;
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

  const idx = ordersList.findIndex(o => String(o.id) === String(targetId));
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

  ordersList = ordersList.filter(o => String(o.id) !== String(targetId));
  saveLocalOrders(ordersList);

  showToast(`Order #${targetId} deleted.`, 'info');
  closeOrderModal();
  renderDashboard();
}

// ── 80MM THERMAL RECEIPT SYSTEM (POS Format) ───────────────
function openReceiptModal(orderId) {
  let order = null;
  if (orderId) {
    order = ordersList.find(o => String(o.id) === String(orderId));
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
      <td style="border: 1px solid #000; padding: 6px 3px; text-align: center; vertical-align: top; font-weight: 700;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top;">
        <div style="font-weight: 700; line-height: 1.25;">${escapeHtml(it.name || 'Item')}</div>
        ${it.size ? `<div style="font-size: 10px; color: #444; margin-top: 2px;">Size: ${escapeHtml(it.size)}</div>` : ''}
      </td>
      <td style="border: 1px solid #000; padding: 6px 3px; text-align: center; vertical-align: top; font-weight: 700;">${it.qty || 1}</td>
      <td style="border: 1px solid #000; padding: 6px 4px; text-align: right; vertical-align: top;">${(Number(it.price) || 0).toLocaleString('en-PK')}</td>
      <td style="border: 1px solid #000; padding: 6px 4px; text-align: right; vertical-align: top; font-weight: 700;">${((Number(it.price) || 0) * Number(it.qty || 1)).toLocaleString('en-PK')}</td>
    </tr>
  `).join('');

  receiptEl.innerHTML = `
    <!-- Centered Store Header -->
    <div style="text-align: center;">
      <h2 style="font-size: 21px; font-weight: 800; letter-spacing: 0.5px; margin: 0; color: #000;">REV MOTO</h2>
      <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.5px; color: #111;">PREMIUM MOTORCYCLE GEAR &amp; PROTECTION</div>
      <div style="font-size: 11px; color: #222; margin-top: 4px;">Sialkot Manufacturing District, Punjab, Pakistan</div>
      <div style="font-size: 11px; color: #222; margin-top: 2px;">Phone: +92 337 424 9450</div>
      <div style="margin-top: 8px;">
        <span style="display: inline-block; border: 1.5px solid #000; padding: 3px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
          ${escapeHtml(order.payment_method || 'CASH ON DELIVERY')}
        </span>
      </div>
    </div>

    <!-- Dashed separator -->
    <div style="border-top: 1.5px dashed #333; margin: 12px 0;"></div>

    <!-- Order Metadata Rows -->
    <div style="font-size: 12px; line-height: 1.6; color: #111;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span>Order ID:</span>
        <span style="font-weight: 800; font-size: 13px;">#${escapeHtml(order.id)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span>Date &amp; Time:</span>
        <span style="font-weight: 500;">${formatReceiptDate(order.created_at)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span>Customer:</span>
        <span style="font-weight: 700;">${escapeHtml(order.customer_name || 'Customer')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span>Phone:</span>
        <span style="font-weight: 700;">${escapeHtml(order.phone || '')}</span>
      </div>
      <div style="margin-top: 3px;">
        <span>Delivery Address:</span>
        <div style="font-size: 11px; color: #333; font-weight: 500; line-height: 1.35; margin-top: 2px;">
          ${escapeHtml(order.address || 'Address provided at checkout')}${order.city ? ', ' + escapeHtml(order.city) : ''}
        </div>
      </div>
    </div>

    <!-- Dashed separator -->
    <div style="border-top: 1.5px dashed #333; margin: 12px 0;"></div>

    <!-- Itemized Table (Exact border structure) -->
    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 11px; color: #000;">
      <thead>
        <tr>
          <th style="border: 1px solid #000; padding: 5px 3px; text-align: center; width: 24px; font-weight: 800;">#</th>
          <th style="border: 1px solid #000; padding: 5px 6px; text-align: left; font-weight: 800;">ITEM</th>
          <th style="border: 1px solid #000; padding: 5px 3px; text-align: center; width: 36px; font-weight: 800;">QTY</th>
          <th style="border: 1px solid #000; padding: 5px 4px; text-align: right; width: 56px; font-weight: 800;">RATE</th>
          <th style="border: 1px solid #000; padding: 5px 4px; text-align: right; width: 62px; font-weight: 800;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <!-- Totals Breakdown -->
    <div style="margin-top: 10px; font-size: 12px; line-height: 1.6; color: #000;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span>Subtotal</span>
        <span style="font-weight: 700;">Rs. ${subtotal.toLocaleString('en-PK')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
        <span>Delivery Charges</span>
        <span style="font-weight: 700;">Rs. ${deliveryCost.toLocaleString('en-PK')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 6px;">
        <span style="font-weight: 800; font-size: 13.5px; letter-spacing: 0.3px;">TOTAL AMOUNT</span>
        <span style="font-weight: 800; font-size: 15px;">Rs. ${totalAmount.toLocaleString('en-PK')}</span>
      </div>
    </div>

    <!-- Dashed separator -->
    <div style="border-top: 1.5px dashed #333; margin: 12px 0 8px 0;"></div>

    <!-- Centered Footer & Scissor Line -->
    <div style="text-align: center;">
      <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">THANK YOU FOR ORDERING!</div>
      <div style="font-size: 11px; color: #777; margin-top: 4px; letter-spacing: 2px;">✂ - - - - - - - - - - - - - - - - - -</div>
    </div>
  `;

  document.getElementById('receiptModal').classList.add('open');
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.remove('open');
  currentReceiptOrder = null;
}

async function downloadReceiptImage() {
  if (!currentReceiptOrder) return;
  const paperEl = document.getElementById('receiptPaper');
  if (!paperEl) return;

  if (typeof html2canvas === 'undefined') {
    showToast('html2canvas library not ready, triggering print instead...', 'info');
    printThermalReceipt();
    return;
  }

  showToast('Generating 80mm receipt image...', 'info');
  try {
    const canvas = await html2canvas(paperEl, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('receiptPaper');
        if (el) {
          el.style.padding = '26px 20px 24px 20px';
          el.style.margin = '0 auto';
          el.style.boxSizing = 'border-box';
          el.style.width = '380px';
          el.style.maxWidth = '380px';
          el.style.background = '#ffffff';
        }
      }
    });

    const a = document.createElement('a');
    a.download = `RevMoto-Receipt-${currentReceiptOrder.id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast(`Receipt #${currentReceiptOrder.id} downloaded!`, 'success');
  } catch (err) {
    console.error('Receipt download error:', err);
    showToast('Could not save image. Try Print instead.', 'error');
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
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
  const testId = 'RM-' + Math.floor(10000 + Math.random() * 90000);
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
