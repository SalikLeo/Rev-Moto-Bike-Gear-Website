/**
 * ==========================================================================
 * REV MOTO — Modern Responsive Admin Engine (Supabase + Local Fallback)
 * ==========================================================================
 */

// Global State
let supabaseClient = null;
let ordersList = [];
let activeFilter = 'all';
let searchQuery = '';
let soundEnabled = true;
let currentSelectedOrder = null;

// Initial Sample Orders for Rev Moto
const DEFAULT_SAMPLE_ORDERS = [
  {
    id: 'RM-78421',
    customer_name: 'Bilal Haider',
    phone: '03001234567',
    email: 'bilal.h@gmail.com',
    address: 'House 42-B, Sector F-7/2, Islamabad',
    city: 'Islamabad',
    notes: 'Please call before delivery. Rider will pay COD cash.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Armored Mesh Riding Jacket', size: 'M (38–40")', qty: 1, price: 14500 }
    ],
    total_amount: 14850,
    status: 'pending',
    courier_name: '',
    tracking_number: '',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 mins ago
  },
  {
    id: 'RM-78415',
    customer_name: 'Usman Tariq',
    phone: '03219876543',
    email: 'usman.moto@yahoo.com',
    address: 'Flat 402, Al-Razi Heights, Gulberg III, Lahore',
    city: 'Lahore',
    notes: 'Leave package with security if not home.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'Carbon Knuckle Street Gloves', size: 'L (9–9.5")', qty: 1, price: 5800 },
      { name: 'Heavyweight Rider T-Shirt', size: 'L', qty: 2, price: 3200 }
    ],
    total_amount: 12550,
    status: 'confirmed',
    courier_name: 'TCS Express',
    tracking_number: '',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
  },
  {
    id: 'RM-78398',
    customer_name: 'Hamza Khan',
    phone: '03335551234',
    email: 'hamza.k@gmail.com',
    address: 'Plot 18, Street 4, Phase 6 DHA, Karachi',
    city: 'Karachi',
    notes: 'Urgent highway trip planned, expedite if possible.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Standard Tracked Delivery (3–5 Days)',
    delivery_cost: 350,
    items: [
      { name: 'All-Weather Armored Riding Jacket', size: 'XL (44–46")', qty: 1, price: 18500 }
    ],
    total_amount: 18850,
    status: 'dispatched',
    courier_name: 'Trax Logistics',
    tracking_number: 'TRX-94827104',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() // 1 day ago
  },
  {
    id: 'RM-78280',
    customer_name: 'Zain Ul Abideen',
    phone: '03451122334',
    email: 'zain.abideen@gmail.com',
    address: 'Near Model Town Park, Sialkot',
    city: 'Sialkot',
    notes: 'Local rider pickup or dispatch.',
    payment_method: 'Cash on Delivery (COD)',
    delivery_label: 'Local Priority Rider Dispatch',
    delivery_cost: 350,
    items: [
      { name: 'Magnetic Tank & Tail Bag 18L', size: '18 Liter', qty: 1, price: 9200 }
    ],
    total_amount: 9550,
    status: 'delivered',
    courier_name: 'Leopard Courier',
    tracking_number: 'LCS-5542109',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() // 3 days ago
  }
];

// Formatting Helper (PKR)
function formatPKR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-PK');
}

// Relative Time Helper
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

// Web Audio API Synthesizer Chime
function playOrderChime() {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First note: C5 (523.25Hz)
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

    // Second note: E5 (659.25Hz)
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
    console.log('Audio chime not permitted by browser autoplay policy until interaction.');
  }
}

// Initialize Supabase Client
function initSupabase() {
  const url = localStorage.getItem('rm_supabase_url');
  const key = localStorage.getItem('rm_supabase_anon_key');
  
  const statusEl = document.getElementById('connectionStatusPill');
  const bannerEl = document.getElementById('supabaseSetupBanner');

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

  // Fallback to LocalStorage Mode
  statusEl.className = 'status-indicator demo';
  statusEl.innerHTML = '<span class="status-dot"></span> Local Storage (Demo Mode)';
  if (bannerEl) bannerEl.style.display = 'flex';
  return false;
}

// Setup Supabase Realtime Listener
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

// Load Orders (Supabase or LocalStorage)
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

  // LocalStorage handling
  const stored = localStorage.getItem('rm_orders');
  if (stored) {
    try {
      ordersList = JSON.parse(stored);
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

// Render Metrics & Lists
function renderDashboard() {
  updateMetrics();
  renderFilterTabs();
  renderDesktopTable();
  renderMobileCards();
}

// Update Top Metrics
function updateMetrics() {
  let totalRev = 0;
  let totalOrders = ordersList.length;
  let pendingCount = 0;
  let dispatchedCount = 0;

  ordersList.forEach(order => {
    const amt = Number(order.total_amount) || 0;
    if (order.status !== 'cancelled') {
      totalRev += amt;
    }
    if (order.status === 'pending') pendingCount++;
    if (order.status === 'dispatched') dispatchedCount++;
  });

  document.getElementById('metricRevenueVal').textContent = formatPKR(totalRev);
  document.getElementById('metricOrdersVal').textContent = totalOrders;
  document.getElementById('metricPendingVal').textContent = pendingCount;
  document.getElementById('metricDispatchedVal').textContent = dispatchedCount;
}

// Render Filter Tabs with Counts
function renderFilterTabs() {
  const counts = {
    all: ordersList.length,
    pending: ordersList.filter(o => o.status === 'pending').length,
    confirmed: ordersList.filter(o => o.status === 'confirmed').length,
    dispatched: ordersList.filter(o => o.status === 'dispatched').length,
    delivered: ordersList.filter(o => o.status === 'delivered').length,
    cancelled: ordersList.filter(o => o.status === 'cancelled').length,
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
    <button class="filter-pill-btn ${activeFilter === f.key ? 'active' : ''}" onclick="setFilter('${f.key}')">
      ${f.label}
      <span class="filter-count-badge">${counts[f.key] || 0}</span>
    </button>
  `).join('');
}

function setFilter(key) {
  activeFilter = key;
  renderDashboard();
}

function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  renderDesktopTable();
  renderMobileCards();
}

// Filtered Orders List
function getFilteredOrders() {
  return ordersList.filter(order => {
    // Status filter
    if (activeFilter !== 'all' && order.status !== activeFilter) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const idMatch = (order.id || '').toLowerCase().includes(searchQuery);
      const nameMatch = (order.customer_name || '').toLowerCase().includes(searchQuery);
      const phoneMatch = (order.phone || '').toLowerCase().includes(searchQuery);
      const addressMatch = (order.address || '').toLowerCase().includes(searchQuery);
      return idMatch || nameMatch || phoneMatch || addressMatch;
    }
    return true;
  });
}

// Render Desktop Table
function renderDesktopTable() {
  const tbody = document.getElementById('desktopOrdersTableBody');
  if (!tbody) return;

  const filtered = getFilteredOrders();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
          No orders found matching the filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
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
          <div style="display: flex; align-items: center; gap: 6px;">
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-admin btn-whatsapp-sm" style="padding: 6px 10px; font-size: 0.76rem;" title="Chat on WhatsApp">
              <i class="fab fa-whatsapp"></i> WA
            </a>
            <a href="tel:${phoneClean}" class="btn-admin btn-call-sm" style="padding: 6px 10px; font-size: 0.76rem;" title="Call Customer">
              <i class="fas fa-phone"></i>
            </a>
            <button class="btn-admin btn-admin-subtle" style="padding: 6px 10px; font-size: 0.76rem;" onclick="openOrderModal('${order.id}')" title="Manage Order">
              <i class="fas fa-cog"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Mobile Cards
function renderMobileCards() {
  const container = document.getElementById('mobileOrdersContainer');
  if (!container) return;

  const filtered = getFilteredOrders();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); color: var(--text-muted);">
        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
        No orders found matching the filter criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(order => {
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
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-admin btn-whatsapp-sm" style="font-size: 0.78rem;">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
          <a href="tel:${phoneClean}" class="btn-admin btn-call-sm" style="font-size: 0.78rem;">
            <i class="fas fa-phone"></i> Call
          </a>
          <button class="btn-admin btn-admin-subtle" style="font-size: 0.78rem;" onclick="openOrderModal('${order.id}')">
            <i class="fas fa-sliders"></i> Manage
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Generate Pre-Filled WhatsApp Confirmation Link
function getWhatsAppLink(order) {
  let phone = (order.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  }
  const itemsText = (order.items || []).map(i => `• ${i.name} (${i.size || 'Standard'}) x${i.qty}`).join('\n');
  const msg = 
`*REV MOTO ORDER CONFIRMATION*
Hello *${order.customer_name || 'Customer'}*,

We have received your order *#${order.id}*:
${itemsText}

*Total COD Amount:* ${formatPKR(order.total_amount)}
*Delivery Address:* ${order.address || 'Sialkot'}

Could you please confirm if this delivery address and order details are correct? We are preparing your armor for dispatch. Thank you!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Open Order Detail & Management Modal
function openOrderModal(orderId) {
  const order = ordersList.find(o => String(o.id) === String(orderId));
  if (!order) return;
  currentSelectedOrder = order;

  document.getElementById('modalOrderId').textContent = '#' + order.id;
  document.getElementById('modalCustomerName').textContent = order.customer_name || '—';
  document.getElementById('modalPhone').textContent = order.phone || '—';
  document.getElementById('modalEmail').textContent = order.email || '—';
  document.getElementById('modalAddress').textContent = order.address || '—';
  document.getElementById('modalNotes').textContent = order.notes ? `"${order.notes}"` : 'No customer notes.';
  document.getElementById('modalTotal').textContent = formatPKR(order.total_amount);
  document.getElementById('modalPaymentMethod').textContent = order.payment_method || 'Cash on Delivery (COD)';

  // Order Items
  const itemsContainer = document.getElementById('modalItemsList');
  itemsContainer.innerHTML = (order.items || []).map(item => `
    <div class="order-item-detail-row">
      <div>
        <div style="font-weight: 700; color: var(--text-pure);">${escapeHtml(item.name)}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">Size: ${item.size || 'Standard'} • Qty: ${item.qty}</div>
      </div>
      <div style="font-family: var(--font-display); font-weight: 700; color: var(--accent-cyan);">
        ${formatPKR(item.price * item.qty)}
      </div>
    </div>
  `).join('');

  // Form Controls
  document.getElementById('orderStatusSelect').value = order.status || 'pending';

  // Open Dialog
  document.getElementById('orderDetailModal').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('orderDetailModal').classList.remove('open');
  currentSelectedOrder = null;
}

// Save Order Changes (Status & Tracking)
async function saveOrderChanges() {
  if (!currentSelectedOrder) return;

  const newStatus = document.getElementById('orderStatusSelect').value;
  currentSelectedOrder.status = newStatus;

  // Supabase update
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({
          status: newStatus
        })
        .eq('id', currentSelectedOrder.id);

      if (error) throw error;
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }

  // Update in Local Storage
  const idx = ordersList.findIndex(o => String(o.id) === String(currentSelectedOrder.id));
  if (idx !== -1) {
    ordersList[idx] = { ...currentSelectedOrder };
    saveLocalOrders(ordersList);
  }

  showToast(`Order #${currentSelectedOrder.id} updated!`, 'success');
  closeOrderModal();
  renderDashboard();
}

// Delete / Archive Order
async function deleteOrder() {
  if (!currentSelectedOrder) return;
  if (!confirm(`Are you sure you want to delete order #${currentSelectedOrder.id}?`)) return;

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

// Print Order Packing Slip
function printPackingSlip() {
  if (!currentSelectedOrder) return;
  const o = currentSelectedOrder;
  const printWindow = window.open('', '_blank');
  
  const itemsRows = (o.items || []).map(i => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(i.name)} (${i.size || 'M'})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${i.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPKR(i.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPKR(i.price * i.qty)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Packing Slip #${o.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 30px; color: #111; max-width: 700px; margin: 0 auto; }
        .head { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
        th { text-align: left; padding: 8px; background: #f4f4f4; border-bottom: 1px solid #ccc; font-size: 12px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="head">
        <div>
          <h2 style="margin:0; font-size: 22px;">REV MOTO</h2>
          <div style="font-size: 12px; color: #555;">Next-Gen Protection • Sialkot, Pakistan</div>
        </div>
        <div style="text-align: right;">
          <h3 style="margin:0; font-size: 18px;">PACKING SLIP</h3>
          <div style="font-size: 14px; font-weight: bold; color: #0066cc;">#${o.id}</div>
          <div style="font-size: 12px; color: #555;">${new Date(o.created_at || Date.now()).toLocaleDateString()}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
          <strong>Deliver To:</strong><br>
          ${escapeHtml(o.customer_name || 'Customer')}<br>
          ${escapeHtml(o.phone || '')}<br>
          ${escapeHtml(o.address || '')}
        </div>
        <div style="text-align: right;">
          <strong>Payment:</strong> ${o.payment_method || 'Cash on Delivery (COD)'}<br>
          <strong>Status:</strong> ${(o.status || 'pending').toUpperCase()}<br>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Delivery:</td>
            <td style="padding: 8px; text-align: right;">${formatPKR(o.delivery_cost || 350)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-size: 16px; font-weight: bold;">Total Collectible (COD):</td>
            <td style="padding: 10px; text-align: right; font-size: 16px; font-weight: bold; color: #0066cc;">${formatPKR(o.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 12px; color: #666; text-align: center;">
        Thank you for riding with Rev Moto! For sizing exchanges, WhatsApp: +92 337 424 9450.
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Supabase Settings Modal
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

// Copy SQL Table Schema to Clipboard
function copySqlSchema() {
  const sql = `-- Rev Moto Orders Table Setup for Supabase SQL Editor
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  notes text,
  payment_method text default 'Cash on Delivery (COD)',
  delivery_label text default 'Standard Tracked Delivery',
  delivery_cost numeric default 350,
  items jsonb not null,
  total_amount numeric not null,
  status text default 'pending',
  courier_name text,
  tracking_number text,
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

// Simulate New Test Order
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
    courier_name: '',
    tracking_number: '',
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

// Sound Toggle
function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    btn.classList.toggle('active', soundEnabled);
  }
  showToast(soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF', 'info');
}

// Toast Display
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

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  fetchOrders();

  // Search input listener
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Refresh every 30 seconds if not using realtime
  setInterval(() => {
    if (!supabaseClient) {
      fetchOrders();
    }
  }, 30000);
});
