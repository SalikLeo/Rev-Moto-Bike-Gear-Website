/**
 * ==========================================================================
 * REV MOTO — Customer User Profile, Google Auth & Reviews Engine
 * Ported from Salik Foods architecture with Google GIS, Recent Orders,
 * 80mm Thermal Receipt, Reviews & Checkout Auto-Fill.
 * ==========================================================================
 */

const GOOGLE_CLIENT_ID = '272845957801-6kr91o68g9m00acgmhboi1opc1kp32mt.apps.googleusercontent.com';
const STORAGE_USER_KEY = 'revmoto_customer_user';
const STORAGE_PROFILE_KEY = 'revmoto_user_profile';
const STORAGE_REVIEWS_KEY = 'revmoto_reviews';
const STORAGE_MY_ORDER_IDS = 'revmoto_my_order_ids';

// ── DEFAULT INITIAL REVIEWS ──
const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    orderId: 'INV-14',
    customerName: 'Shahid Afridi',
    rating: 5,
    comment: 'The Armored Mesh Riding Jacket is top tier! Ventilation is amazing on highway rides in Islamabad heat, and CE armor fits snugly.',
    date: 'Nov 4, 2026, 2:37 PM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-2',
    orderId: 'INV-13',
    customerName: 'Kamran Akmal',
    rating: 5,
    comment: 'Carbon knuckle gloves fit like a glove! Fast 3-day delivery to Islamabad and clean COD packaging.',
    date: 'Nov 4, 2026, 1:15 PM',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'rev-3',
    orderId: 'INV-12',
    customerName: 'Bilal Haider',
    rating: 5,
    comment: 'Touring pants kept me completely dry during heavy rain. Material and stitching quality is 10/10.',
    date: 'Nov 4, 2026, 11:40 AM',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'rev-4',
    orderId: 'INV-11',
    customerName: 'Usman Tariq',
    rating: 4,
    comment: 'Magnetic tank bag has very strong grip even at 120 km/h. Clear mobile touch window works perfectly.',
    date: 'Nov 3, 2026, 6:20 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'rev-5',
    orderId: 'INV-10',
    customerName: 'Zain Ali',
    rating: 5,
    comment: 'Thermal windproof balaclava cuts cold wind completely on morning commutes. Great customer service.',
    date: 'Nov 3, 2026, 2:10 PM',
    createdAt: new Date(Date.now() - 100000000).toISOString()
  }
];

// ── GOOGLE AUTH HELPERS ──
function getStoredCustomerUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setStoredCustomerUser(user) {
  try {
    if (user && user.email) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
    window.dispatchEvent(new CustomEvent('revmoto_auth_changed', { detail: user }));
    updateHeaderUserIcon();
  } catch (e) {
    console.error('Failed to save customer user:', e);
  }
}

function decodeGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode Google JWT:', e);
    return null;
  }
}

function loadGoogleGsiScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      return resolve(window.google.accounts.id);
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      let count = 0;
      const t = setInterval(() => {
        count++;
        if (window.google?.accounts?.id) {
          clearInterval(t);
          resolve(window.google.accounts.id);
        } else if (count > 50) {
          clearInterval(t);
          resolve(null);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google?.accounts?.id || null);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function handleGoogleCredentialResponse(response) {
  if (!response?.credential) return;
  const decoded = decodeGoogleJwt(response.credential);
  if (!decoded) return;

  const user = {
    name: decoded.name || 'Rider',
    email: decoded.email,
    picture: decoded.picture || '',
    sub: decoded.sub,
    verified: decoded.email_verified
  };

  setStoredCustomerUser(user);

  // Sync profile name and email if empty
  const profile = getStoredUserProfile();
  if (!profile.name && user.name) profile.name = user.name;
  if (!profile.email && user.email) profile.email = user.email;
  saveStoredUserProfile(profile);

  renderUserProfileModalContent();
  showToast(`Signed in as ${user.name}!`, 'success');
}

function initGoogleSignInButton() {
  loadGoogleGsiScript().then(gsi => {
    if (!gsi) return;
    try {
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false
      });

      const btnContainer = document.getElementById('googleSignInBtnContainer');
      if (btnContainer && !getStoredCustomerUser()) {
        btnContainer.innerHTML = '';
        gsi.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280
        });
      }
    } catch (e) {
      console.warn('GIS button render notice:', e);
    }
  });
}

function signOutCustomer() {
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new CustomEvent('revmoto_auth_changed', { detail: null }));
  updateHeaderUserIcon();
  renderUserProfileModalContent();
  initGoogleSignInButton();
  showToast('Signed out of Google account.', 'info');
}

// ── USER PROFILE STORAGE ──
function getStoredUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const googleUser = getStoredCustomerUser();
    return {
      name: parsed.name || googleUser?.name || '',
      phone: parsed.phone || '',
      email: parsed.email || googleUser?.email || '',
      address: parsed.address || ''
    };
  } catch (e) {
    return { name: '', phone: '', email: '', address: '' };
  }
}

function saveStoredUserProfile(profile) {
  try {
    const clean = {
      name: String(profile?.name || '').trim(),
      phone: String(profile?.phone || '').trim(),
      email: String(profile?.email || '').trim(),
      address: String(profile?.address || '').trim(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('revmoto_profile_updated', { detail: clean }));
    return clean;
  } catch (e) {
    console.error('Error saving user profile:', e);
    return profile;
  }
}

// ── REVIEWS STORAGE ──
function getStoreReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  } catch (e) {
    return DEFAULT_REVIEWS;
  }
}

function saveStoreReview(reviewData) {
  try {
    const reviews = getStoreReviews();
    const newReview = {
      id: 'rev-' + Date.now(),
      orderId: reviewData.orderId || null,
      customerName: reviewData.customerName || 'Anonymous Rider',
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('revmoto_reviews_updated', { detail: reviews }));
    return newReview;
  } catch (e) {
    console.error('Failed to save review:', e);
    return null;
  }
}

// ── CUSTOMER RECENT ORDERS ──
function getCustomerOrders() {
  const allOrders = [];
  try {
    const raw = localStorage.getItem('rm_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) allOrders.push(...parsed);
    }
  } catch (e) {}

  const googleUser = getStoredCustomerUser();
  const profile = getStoredUserProfile();
  const myIds = [];
  try {
    const rawIds = localStorage.getItem(STORAGE_MY_ORDER_IDS);
    if (rawIds) myIds.push(...JSON.parse(rawIds));
  } catch (e) {}

  // Filter orders related to this user/device
  const matched = allOrders.filter(o => {
    if (!o) return false;
    if (myIds.includes(String(o.id || o.orderId)) || (o.legacy_id && myIds.includes(String(o.legacy_id)))) return true;
    if (googleUser?.email && (o.email || '').toLowerCase() === googleUser.email.toLowerCase()) return true;
    if (profile.phone && (o.phone || '').replace(/\D/g, '') === profile.phone.replace(/\D/g, '')) return true;
    if (profile.name && (o.customer_name || '').toLowerCase() === profile.name.toLowerCase()) return true;
    return false;
  });

  return matched;
}

// ── MODAL HTML INJECTION ──
function injectUserProfileModal() {
  if (document.getElementById('userProfileModal')) return;

  const modalHtml = `
    <!-- User Profile Modal Overlay -->
    <div class="user-modal-overlay" id="userProfileOverlay" onclick="if(event.target===this) closeUserProfileModal()">
      <div class="user-modal-card" id="userProfileModal">
        <!-- Header -->
        <div class="user-modal-header">
          <div class="user-modal-title">
            <div class="user-modal-avatar-preview" id="userModalHeaderAvatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;" id="userModalHeaderName">Rider Profile</h3>
              <div style="font-size: 0.75rem; color: #64748b;" id="userModalHeaderSub">Manage details, orders & reviews</div>
            </div>
          </div>
          <button class="user-modal-close" onclick="closeUserProfileModal()" aria-label="Close Profile">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="user-modal-tabs">
          <button class="user-tab-btn active" id="userTabBtnProfile" onclick="switchUserTab('profile')">
            <i class="fas fa-id-card"></i> Profile Info
          </button>
          <button class="user-tab-btn" id="userTabBtnOrders" onclick="switchUserTab('orders')">
            <i class="fas fa-boxes-stacked"></i> Recent Orders <span class="tab-count-badge" id="userOrdersCountBadge">0</span>
          </button>
          <button class="user-tab-btn" id="userTabBtnReviews" onclick="switchUserTab('reviews')">
            <i class="fas fa-star"></i> Reviews &amp; Feedback
          </button>
        </div>

        <!-- Body Content -->
        <div class="user-modal-body" id="userModalBody">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>

    <!-- 80mm Customer Thermal Receipt Preview Modal -->
    <div class="user-modal-overlay" id="userReceiptOverlay" onclick="if(event.target===this) closeUserReceiptModal()">
      <div class="user-modal-card" style="max-width: 390px; padding: 0; overflow: hidden; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.3);">
        <!-- Top Drag Pill & Close Button -->
        <div style="padding: 10px 16px 4px 16px; background: #ffffff; display: flex; justify-content: space-between; align-items: center; position: relative;">
          <div style="width: 36px; height: 4px; background: #cbd5e1; border-radius: 4px; margin: 0 auto; position: absolute; left: 50%; transform: translateX(-50%);"></div>
          <div style="width: 1px;"></div>
          <button class="user-modal-close" onclick="closeUserReceiptModal()" style="width: 28px; height: 28px; border-radius: 50%;" aria-label="Close Receipt"><i class="fas fa-times"></i></button>
        </div>

        <!-- Receipt Content Paper -->
        <div style="padding: 8px 20px 14px 20px; max-height: 76vh; overflow-y: auto;" id="userReceiptContent">
          <!-- Rendered by user-profile.js -->
        </div>

        <!-- Exact 3 Action Buttons: Download, WhatsApp, Print -->
        <div style="padding: 12px 16px; background: #ffffff; border-top: 1px dashed #cbd5e1; display: flex; gap: 8px; justify-content: center;">
          <button type="button" class="btn-receipt-action btn-receipt-download" onclick="downloadCustomerReceiptImage()" style="flex: 1; height: 40px; background: #18181b; color: #ffffff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.04em; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; text-transform: uppercase;">
            <i class="fas fa-download" style="color: #f97316;"></i> DOWNLOAD
          </button>
          <button type="button" class="btn-receipt-action btn-receipt-wa" onclick="shareCustomerReceiptWhatsApp()" style="flex: 1.1; height: 40px; background: #059669; color: #ffffff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.04em; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; text-transform: uppercase;">
            <i class="fab fa-whatsapp"></i> WHATSAPP
          </button>
          <button type="button" class="btn-receipt-action btn-receipt-print" onclick="printUserReceipt()" style="flex: 1; height: 40px; background: #ea580c; color: #ffffff; border: none; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.04em; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; text-transform: uppercase;">
            <i class="fas fa-print"></i> PRINT
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ── TAB CONTROLLERS ──
let activeUserTab = 'profile';

function switchUserTab(tabName) {
  activeUserTab = tabName;
  document.querySelectorAll('.user-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('userTabBtn' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  if (activeBtn) activeBtn.classList.add('active');
  renderUserProfileModalContent();
}

function openUserProfileModal(defaultTab = 'profile') {
  injectUserProfileModal();
  activeUserTab = defaultTab;
  document.querySelectorAll('.user-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('userTabBtn' + defaultTab.charAt(0).toUpperCase() + defaultTab.slice(1));
  if (activeBtn) activeBtn.classList.add('active');

  renderUserProfileModalContent();
  document.getElementById('userProfileOverlay').classList.add('open');
  initGoogleSignInButton();
}

function closeUserProfileModal() {
  const el = document.getElementById('userProfileOverlay');
  if (el) el.classList.remove('open');
}

// ── MODAL CONTENT RENDERING ──
function renderUserProfileModalContent() {
  const body = document.getElementById('userModalBody');
  if (!body) return;

  const googleUser = getStoredCustomerUser();
  const profile = getStoredUserProfile();
  const orders = getCustomerOrders();

  // Update Header
  const headerAvatar = document.getElementById('userModalHeaderAvatar');
  const headerName = document.getElementById('userModalHeaderName');
  const headerSub = document.getElementById('userModalHeaderSub');
  const ordersBadge = document.getElementById('userOrdersCountBadge');

  if (ordersBadge) ordersBadge.textContent = orders.length;

  if (googleUser) {
    if (headerAvatar) {
      headerAvatar.innerHTML = googleUser.picture 
        ? `<img src="${googleUser.picture}" alt="${googleUser.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
        : `<i class="fas fa-user-circle"></i>`;
    }
    if (headerName) headerName.textContent = googleUser.name;
    if (headerSub) headerSub.textContent = googleUser.email;
  } else {
    if (headerAvatar) headerAvatar.innerHTML = `<i class="fas fa-user-circle" style="color: #2563eb;"></i>`;
    if (headerName) headerName.textContent = profile.name || 'Guest Rider';
    if (headerSub) headerSub.textContent = 'Sign in with Google to sync orders';
  }

  // 1. PROFILE TAB
  if (activeUserTab === 'profile') {
    body.innerHTML = `
      <!-- Google Auth Card -->
      <div class="user-auth-card">
        ${googleUser ? `
          <div class="user-google-profile">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${googleUser.picture 
                ? `<img src="${googleUser.picture}" alt="${googleUser.name}" class="google-user-avatar">`
                : `<div class="google-user-avatar-placeholder"><i class="fas fa-user"></i></div>`
              }
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 0.95rem; color: #0f172a;">${escapeUserHtml(googleUser.name)}</strong>
                  <span class="user-badge-verified"><i class="fas fa-check-circle"></i> Google Verified</span>
                </div>
                <div style="font-size: 0.78rem; color: #64748b;">${escapeUserHtml(googleUser.email)}</div>
              </div>
            </div>
            <button type="button" class="btn-user-signout" onclick="signOutCustomer()" title="Sign out of Google">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        ` : `
          <div style="text-align: center; padding: 6px 0;">
            <div style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 3px;">Sign In with Google</div>
            <div style="font-size: 0.76rem; color: #64748b; margin-bottom: 12px;">Sync your orders, saved addresses, and submit verified reviews.</div>
            <div id="googleSignInBtnContainer" style="display: flex; justify-content: center; min-height: 44px;">
              <button type="button" class="btn-google-fallback" onclick="initGoogleSignInButton()">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google">
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        `}
      </div>

      <!-- Saved Delivery Info Form -->
      <div class="user-form-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
              <i class="fas fa-truck-fast text-cyan"></i> Saved Delivery Details
            </div>
            <div style="font-size: 0.74rem; color: #64748b;">These details will auto-fill on checkout for instant 1-click ordering.</div>
          </div>
        </div>

        <form id="userProfileForm" onsubmit="handleSaveProfileForm(event)">
          <div class="user-field-group">
            <label class="user-field-label">Full Name *</label>
            <input type="text" id="upFullName" class="user-field-input" placeholder="e.g. Shahid Afridi" value="${escapeUserHtml(profile.name)}" required>
          </div>

          <div class="user-field-group">
            <label class="user-field-label">WhatsApp / Phone Number *</label>
            <input type="tel" id="upPhone" class="user-field-input" placeholder="e.g. 0337-4249450" value="${escapeUserHtml(profile.phone)}" required>
          </div>

          <div class="user-field-group">
            <label class="user-field-label">Delivery Address *</label>
            <textarea id="upAddress" class="user-field-input" rows="2" placeholder="House #, Street, Sector, City" required>${escapeUserHtml(profile.address)}</textarea>
          </div>

          <div id="profileSaveNotice" style="display: none; padding: 8px 12px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 0.8rem; margin-bottom: 12px;">
            <i class="fas fa-check-circle"></i> Profile details saved! Checkout will auto-fill with these details.
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="height: 42px; font-weight: 700;">
            <i class="fas fa-save"></i> Save Profile Details
          </button>
        </form>
      </div>
    `;
    initGoogleSignInButton();
  }

  // 2. RECENT ORDERS TAB
  else if (activeUserTab === 'orders') {
    if (orders.length === 0) {
      body.innerHTML = `
        <div class="user-empty-state">
          <i class="fas fa-box-open user-empty-icon"></i>
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 1rem;">No Recent Orders Yet</h4>
          <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #64748b;">You haven't placed any motorcycle gear orders on this device.</p>
          <a href="shop.html" class="btn btn-primary" onclick="closeUserProfileModal()">
            <i class="fas fa-th-large"></i> Explore Gear Catalog
          </a>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="user-orders-list">
          ${orders.map(order => {
            const orderId = order.id || order.orderId;
            const items = order.items || [];
            const itemsText = items.map(i => `${i.name} (${i.size || 'M'}) x${i.qty}`).join(', ');
            const status = (order.status || 'pending').toLowerCase();
            const statusIcons = {
              pending: '<i class="fas fa-clock" style="font-size: 0.60rem;"></i>',
              confirmed: '<i class="fas fa-check" style="font-size: 0.60rem;"></i>',
              dispatched: '<i class="fas fa-truck-fast" style="font-size: 0.60rem;"></i>',
              delivered: '<i class="fas fa-circle-check" style="font-size: 0.60rem;"></i>',
              cancelled: '<i class="fas fa-ban" style="font-size: 0.60rem;"></i>'
            };
            const statusIcon = statusIcons[status] || statusIcons.pending;
            const dateStr = formatUserOrderDate(order.created_at || order.createdAt);
            const total = order.total_amount || order.totalAmount || order.total || 0;

            return `
              <div class="user-order-card">
                <div class="user-order-top">
                  <div>
                    <span class="user-order-num">${escapeUserHtml(orderId.startsWith('#') || orderId.startsWith('INV-') ? orderId : '#' + orderId)}</span>
                    <span class="user-order-date">• ${dateStr}</span>
                  </div>
                  <span class="status-badge ${status}">${statusIcon} ${status.toUpperCase()}</span>
                </div>

                <div class="user-order-items">
                  <div style="font-size: 0.82rem; font-weight: 600; color: #0f172a;">${escapeUserHtml(itemsText || 'Motorcycle Gear Items')}</div>
                  <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px;">
                    Payment: ${escapeUserHtml(order.payment_method || order.paymentMethod || 'COD')}
                  </div>
                </div>

                <div class="user-order-bottom">
                  <div class="user-order-total">
                    <span style="font-size: 0.72rem; color: #64748b; display: block;">Total Collectible:</span>
                    <strong style="font-size: 0.96rem; color: #2563eb;">Rs. ${Number(total).toLocaleString()}</strong>
                  </div>

                  <div class="user-order-actions">
                    <button type="button" class="btn-user-action" onclick="openUserReceiptModal('${escapeUserHtml(orderId)}')" title="View 80mm Receipt">
                      <i class="fas fa-receipt"></i> Receipt
                    </button>
                    <button type="button" class="btn-user-action" onclick="reorderCustomerOrder('${escapeUserHtml(orderId)}')" title="Re-order items">
                      <i class="fas fa-rotate-right"></i> Buy Again
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  // 3. REVIEWS TAB — Show ONLY customer's orders eligible for review
  else if (activeUserTab === 'reviews') {
    const orders = getCustomerOrders();
    const storeReviews = getStoreReviews();

    // Filter reviews submitted specifically by this customer or on their order IDs
    const myReviews = storeReviews.filter(r => {
      const matchOrder = orders.some(o => String(o.id || o.orderId) === String(r.orderId));
      const matchName = profile.name && r.customerName && (r.customerName.toLowerCase() === profile.name.toLowerCase());
      return matchOrder || matchName;
    });

    if (orders.length === 0) {
      body.innerHTML = `
        <div class="user-empty-state" style="padding: 32px 16px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin: 0 auto 14px;">
            <i class="fas fa-star"></i>
          </div>
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 1.05rem;">No Orders to Review Yet</h4>
          <p style="margin: 0 0 16px 0; font-size: 0.82rem; color: #64748b; line-height: 1.5; max-width: 320px; margin-left: auto; margin-right: auto;">
            Reviews can only be submitted on your verified orders. Once you place an order, you can share feedback here.
          </p>
          <a href="shop.html" class="btn btn-primary" onclick="closeUserProfileModal()">
            <i class="fas fa-th-large"></i> Explore Gear Catalog
          </a>
        </div>
      `;
      return;
    }

    // Unreviewed orders
    const unreviewedOrders = orders.filter(o => {
      const oid = String(o.id || o.orderId);
      return !myReviews.some(r => String(r.orderId) === oid);
    });

    let formHtml = '';
    if (unreviewedOrders.length > 0) {
      const defaultOrder = unreviewedOrders[0];
      const defaultOrderId = String(defaultOrder.id || defaultOrder.orderId);
      const itemsText = (defaultOrder.items || []).map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''}`).join(', ') || 'Motorcycle Gear';

      formHtml = `
        <div class="user-form-card" style="margin-bottom: 18px;">
          <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">
            <i class="fas fa-star text-gold" style="color: #f59e0b;"></i> Submit Review on Your Order
          </div>
          <div style="font-size: 0.76rem; color: #64748b; margin-bottom: 12px;">Share your verified experience for items purchased.</div>

          <form id="userReviewForm" onsubmit="handleCustomerReviewSubmit(event)">
            <!-- Order Selector -->
            <div class="user-field-group">
              <label class="user-field-label">Order To Review *</label>
              ${unreviewedOrders.length === 1 ? `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <span style="font-size: 0.85rem; font-weight: 800; color: #2563eb;">ORDER #${escapeUserHtml(defaultOrderId)}</span>
                    <div style="font-size: 0.76rem; color: #334155; margin-top: 2px;">${escapeUserHtml(itemsText)}</div>
                  </div>
                  <input type="hidden" id="selectedReviewOrderId" value="${escapeUserHtml(defaultOrderId)}">
                </div>
              ` : `
                <select id="selectedReviewOrderId" class="user-field-input" style="font-weight: 600;">
                  ${unreviewedOrders.map(o => {
                    const oid = String(o.id || o.orderId);
                    const it = (o.items || []).map(i => i.name).join(', ') || 'Gear';
                    return `<option value="${escapeUserHtml(oid)}">Order #${escapeUserHtml(oid)} (${escapeUserHtml(it)})</option>`;
                  }).join('')}
                </select>
              `}
            </div>

            <div class="user-field-group">
              <label class="user-field-label">Your Rating *</label>
              <div class="star-rating-select" id="starRatingSelect">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button type="button" class="star-btn ${star <= 5 ? 'active' : ''}" data-star="${star}" onclick="setReviewStarRating(${star})">
                    <i class="fas fa-star"></i>
                  </button>
                `).join('')}
                <input type="hidden" id="selectedStarRating" value="5">
                <span id="starRatingLabel" style="font-size: 0.8rem; font-weight: 700; color: #f59e0b; margin-left: 8px;">5 - Excellent</span>
              </div>
            </div>

            <div class="user-field-group">
              <label class="user-field-label">Your Name *</label>
              <input type="text" id="reviewAuthorName" class="user-field-input" placeholder="e.g. Shahid Afridi" value="${escapeUserHtml(profile.name || googleUser?.name || 'Salik')}" required>
            </div>

            <div class="user-field-group">
              <label class="user-field-label">Your Review &amp; Gear Feedback *</label>
              <textarea id="reviewCommentText" class="user-field-input" rows="3" placeholder="Tell riders about armor comfort, fit, material quality, and delivery speed..." required></textarea>
            </div>

            <div id="reviewSuccessNotice" style="display: none; padding: 8px 12px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 0.8rem; margin-bottom: 12px;">
              <i class="fas fa-check-circle"></i> Thank you! Your review for this order has been submitted.
            </div>

            <button type="submit" class="btn btn-primary btn-full" style="height: 42px; font-weight: 700;">
              <i class="fas fa-paper-plane"></i> Submit Order Review
            </button>
          </form>
        </div>
      `;
    }

    let myReviewsHtml = '';
    if (myReviews.length > 0) {
      myReviewsHtml = `
        <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: baseline;">
          <span>Your Submitted Reviews (${myReviews.length})</span>
          <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;"><i class="fas fa-shield-check"></i> Verified Rider</span>
        </div>
        <div class="user-reviews-stream">
          ${myReviews.map(rev => `
            <div class="user-review-item" style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="font-size: 0.88rem; color: #0f172a;">${escapeUserHtml(rev.customerName || profile.name || 'You')}</strong>
                    ${rev.orderId ? `<span style="font-size: 0.68rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 1px 6px; border-radius: 6px; font-weight: 800;">Order #${escapeUserHtml(rev.orderId)}</span>` : ''}
                  </div>
                  <div class="review-stars-rendered" style="color: #f59e0b; font-size: 0.75rem; margin-top: 3px;">
                    ${Array(rev.rating || 5).fill('<i class="fas fa-star"></i>').join('')}
                    <span style="font-size: 0.72rem; color: #64748b; margin-left: 4px;">${rev.rating || 5} Stars</span>
                  </div>
                </div>
                <span style="font-size: 0.72rem; color: #94a3b8;">${escapeUserHtml(rev.date || 'Recent')}</span>
              </div>
              <p style="margin: 6px 0 0 0; font-size: 0.82rem; color: #334155; line-height: 1.45;">
                ${escapeUserHtml(rev.comment || '')}
              </p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (unreviewedOrders.length === 0 && orders.length > 0) {
      myReviewsHtml = `
        <div class="user-empty-state" style="padding: 24px 14px;">
          <i class="fas fa-check-double user-empty-icon" style="color: #10b981; font-size: 1.8rem; margin-bottom: 8px;"></i>
          <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 0.95rem;">All Orders Reviewed</h4>
          <p style="margin: 0; font-size: 0.8rem; color: #64748b;">You have submitted reviews for all your placed orders. Thank you!</p>
        </div>
      `;
    }

    body.innerHTML = formHtml + myReviewsHtml;
  }
}

// ── STAR RATING INTERACTION ──
function setReviewStarRating(rating) {
  const hiddenInput = document.getElementById('selectedStarRating');
  if (hiddenInput) hiddenInput.value = rating;

  const labels = ['', '1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'];
  const labelEl = document.getElementById('starRatingLabel');
  if (labelEl) labelEl.textContent = labels[rating] || (rating + ' Stars');

  document.querySelectorAll('#starRatingSelect .star-btn').forEach(btn => {
    const star = Number(btn.getAttribute('data-star'));
    if (star <= rating) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function handleCustomerReviewSubmit(e) {
  e.preventDefault();
  const orderIdInput = document.getElementById('selectedReviewOrderId');
  const orderId = orderIdInput ? orderIdInput.value.trim() : null;
  const profile = getStoredUserProfile();
  const name = document.getElementById('reviewAuthorName')?.value || profile.name || 'Verified Rider';
  const comment = document.getElementById('reviewCommentText')?.value || '';
  const rating = Number(document.getElementById('selectedStarRating')?.value || 5);

  saveStoreReview({
    orderId: orderId,
    customerName: name,
    comment: comment,
    rating: rating
  });

  const notice = document.getElementById('reviewSuccessNotice');
  if (notice) notice.style.display = 'block';

  setTimeout(() => {
    renderUserProfileModalContent();
    if (typeof showToast === 'function') {
      showToast('Review submitted for Order #' + (orderId || '') + '! Thank you.', 'love');
    }
  }, 900);
}

// ── SAVE PROFILE FORM ──
function handleSaveProfileForm(e) {
  e.preventDefault();
  const name = document.getElementById('upFullName')?.value || '';
  const phone = document.getElementById('upPhone')?.value || '';
  const address = document.getElementById('upAddress')?.value || '';
  const googleUser = getStoredCustomerUser();

  saveStoredUserProfile({
    name,
    phone,
    email: googleUser?.email || '',
    address
  });

  const notice = document.getElementById('profileSaveNotice');
  if (notice) {
    notice.style.display = 'block';
    setTimeout(() => { notice.style.display = 'none'; }, 3500);
  }

  showToast('Profile saved! Details will auto-fill on checkout.', 'success');
}

// ── ORDER ACTIONS (RECEIPT, REORDER, WHATSAPP) ──
let currentCustomerReceiptOrder = null;

function openUserReceiptModal(orderId) {
  const orders = getCustomerOrders();
  const order = orders.find(o => String(o.id || o.orderId) === String(orderId));
  if (!order) return;

  currentCustomerReceiptOrder = order;

  const content = document.getElementById('userReceiptContent');
  if (!content) return;

  const items = order.items || [];
  const itemsHtml = items.map((it, idx) => `
    <tr>
      <td style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; vertical-align: top; font-weight: 600; color: #000;">${idx + 1}</td>
      <td style="border: 1.2px solid #000; padding: 4px 6px; text-align: left; vertical-align: top;">
        <div style="font-weight: 700; font-size: 11.5px; color: #000; line-height: 1.25;">${escapeUserHtml(it.name)}</div>
        <div style="font-size: 10px; font-weight: 600; color: #3f3f46; margin-top: 1px;">Size: ${escapeUserHtml(it.size || 'Standard')}</div>
      </td>
      <td style="border: 1.2px solid #000; padding: 4px 3px; text-align: center; vertical-align: top; font-weight: 700; color: #000;">${it.qty || 1}</td>
      <td style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; vertical-align: top; font-weight: 600; color: #000;">${Number(it.price || 0).toLocaleString('en-PK')}</td>
      <td style="border: 1.2px solid #000; padding: 4px 5px; text-align: right; vertical-align: top; font-weight: 700; color: #000;">${Number((it.price || 0) * (it.qty || 1)).toLocaleString('en-PK')}</td>
    </tr>
  `).join('');

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
  const delivery = order.delivery_cost || order.deliveryCost || 350;
  const total = order.total_amount || order.totalAmount || (subtotal + delivery);

  content.innerHTML = `
    <div id="customerReceiptPaper" style="font-family: 'Plus Jakarta Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #000; padding: 22px 20px 24px 20px; box-sizing: border-box; width: 100%; max-width: 390px; margin: 0 auto;">
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
            ${escapeUserHtml(order.payment_method || order.paymentMethod || 'CASH ON DELIVERY')}
          </span>
        </div>
      </div>

      <!-- Dashed separator -->
      <div style="border-top: 1px dashed #71717a; margin: 10px 0;"></div>

      <!-- Order Metadata Rows -->
      <div style="font-size: 11.5px; line-height: 1.6; color: #000;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Order ID:</span>
          <span style="font-weight: 800;">#${escapeUserHtml(order.id || order.orderId)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Date &amp; Time:</span>
          <span style="font-weight: 700;">${formatUserOrderDate(order.created_at || order.createdAt)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Customer:</span>
          <span style="font-weight: 700;">${escapeUserHtml(order.customer_name || order.customerName || 'Customer')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 700;">Phone:</span>
          <span style="font-weight: 700;">${escapeUserHtml(order.phone || '0337-4249450')}</span>
        </div>
        <div style="margin-top: 2px;">
          <span style="font-weight: 700; display: block;">Delivery Address:</span>
          <span style="display: block; font-size: 11px; font-weight: 500; color: #3f3f46; line-height: 1.35; margin-top: 1px;">
            ${escapeUserHtml(order.address || 'Standard Delivery')}
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
          ${itemsHtml}
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
          <span style="font-weight: 700;">Rs. ${delivery.toLocaleString('en-PK')}</span>
        </div>
        <div style="height: 1.5px; background: #000; width: 100%; margin: 4px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 800; font-size: 13.5px; letter-spacing: 0.03em;">TOTAL AMOUNT</span>
          <span style="font-weight: 800; font-size: 13.5px;">Rs. ${Number(total).toLocaleString('en-PK')}</span>
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

  document.getElementById('userReceiptOverlay').classList.add('open');
}

function closeUserReceiptModal() {
  const el = document.getElementById('userReceiptOverlay');
  if (el) el.classList.remove('open');
  currentCustomerReceiptOrder = null;
}

function printUserReceipt() {
  const paper = document.getElementById('customerReceiptPaper');
  if (!paper) return;
  const printWin = window.open('', '_blank', 'width=420,height=600');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>REV MOTO Receipt</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Plus Jakarta Sans', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0; padding: 2mm 3mm 4mm 3mm; width: 74mm; max-width: 80mm;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        ${paper.innerHTML}
        <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 200); }<\/script>
      </body>
    </html>
  `);
  printWin.document.close();
}

/**
 * 100% Exact High-Resolution Canvas 2D Renderer matching the on-screen Receipt View
 * Generates an ultra-crisp, perfectly padded PNG matching the website view exactly.
 */
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

function downloadCustomerReceiptImage() {
  if (!currentCustomerReceiptOrder) return;
  try {
    showToast('Generating 80mm receipt image...', 'info');
    const dataUrl = drawRevMotoReceiptCanvas(currentCustomerReceiptOrder);
    const link = document.createElement('a');
    link.download = `RevMoto-Receipt-${currentCustomerReceiptOrder.id || currentCustomerReceiptOrder.orderId}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Receipt image downloaded!', 'success');
  } catch (e) {
    console.error('Canvas download error:', e);
    printUserReceipt();
  }
}

function shareCustomerReceiptWhatsApp() {
  if (!currentCustomerReceiptOrder) return;
  const o = currentCustomerReceiptOrder;
  const itemsText = (o.items || []).map(i => `• ${i.name} (${i.size || 'M'}) x${i.qty} - Rs. ${((i.price || 0) * (i.qty || 1)).toLocaleString()}`).join('\n');
  const msg = `*REV MOTO 80MM ORDER RECEIPT*\n` +
    `*Order ID:* #${o.id || o.orderId}\n` +
    `*Customer:* ${o.customer_name || o.customerName || 'Customer'}\n` +
    `*Phone:* ${o.phone || ''}\n` +
    `*Delivery Address:* ${o.address || ''}\n\n` +
    `*Items:*\n${itemsText}\n\n` +
    `*TOTAL (COD):* Rs. ${(o.total_amount || o.totalAmount || 0).toLocaleString()}\n` +
    `Thank you for ordering with Rev Moto!`;

  window.open(`https://wa.me/923374249450?text=${encodeURIComponent(msg)}`, '_blank');
}


function reorderCustomerOrder(orderId) {
  const orders = getCustomerOrders();
  const order = orders.find(o => String(o.id || o.orderId) === String(orderId));
  if (!order || !order.items) return;

  const currentCart = typeof getCart === 'function' ? getCart() : [];
  order.items.forEach(it => {
    const existing = currentCart.find(c => c.id === it.id && c.size === it.size);
    if (existing) {
      existing.qty += it.qty;
    } else {
      currentCart.push({
        id: it.id,
        name: it.name,
        price: it.price,
        size: it.size || 'M',
        image: it.image || 'assets/images/jacket.webp',
        qty: it.qty || 1
      });
    }
  });

  if (typeof saveCart === 'function') {
    saveCart(currentCart);
  }
  closeUserProfileModal();
  if (typeof openCartDrawer === 'function') {
    openCartDrawer();
  }
  showToast('Items added to shopping bag!', 'success');
}

function openUserWhatsAppSupport(orderId) {
  const msg = `Hello Rev Moto! I am inquiring about my Order #${orderId}. Please provide a status update.`;
  const url = `https://wa.me/923374249450?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── HEADER USER ICON & AUTO-FILL HELPERS ──
function updateHeaderUserIcon() {
  const navBtn = document.getElementById('navUserBtn');
  const googleUser = getStoredCustomerUser();

  if (navBtn) {
    if (googleUser && googleUser.picture) {
      navBtn.innerHTML = `<img src="${googleUser.picture}" id="navUserIcon" alt="${googleUser.name}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1.5px solid #2563eb;">`;
    } else {
      navBtn.innerHTML = `
        <svg id="navUserIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="user-icon-svg">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
    }
  }

  // Update Drawer user name if present
  const drawerName = document.getElementById('drawerUserName');
  if (drawerName) {
    drawerName.textContent = googleUser ? googleUser.name : 'My Account & Orders';
  }
}

// Auto-fill checkout fields if on checkout.html
function autoFillCheckoutFields(forceOverwrite = false) {
  const profile = getStoredUserProfile();
  const googleUser = getStoredCustomerUser();

  const nameInput = document.getElementById('coFullName');
  if (nameInput && (profile.name || googleUser?.name)) {
    if (forceOverwrite || !nameInput.value.trim()) {
      nameInput.value = profile.name || googleUser?.name || '';
    }
  }

  const phoneInput = document.getElementById('coPhone');
  if (phoneInput && profile.phone) {
    if (forceOverwrite || !phoneInput.value.trim()) {
      phoneInput.value = profile.phone;
    }
  }

  const emailInput = document.getElementById('coEmail');
  if (emailInput && (profile.email || googleUser?.email)) {
    if (forceOverwrite || !emailInput.value.trim()) {
      emailInput.value = profile.email || googleUser?.email || '';
    }
  }

  const addressInput = document.getElementById('coAddress') || document.getElementById('coStreetAddress');
  if (addressInput && profile.address) {
    if (forceOverwrite || !addressInput.value.trim()) {
      addressInput.value = profile.address;
    }
  }
}

function escapeUserHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatUserOrderDate(dateVal) {
  if (!dateVal) return 'Recent';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return 'Recent';
  }
}

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  injectUserProfileModal();
  updateHeaderUserIcon();
  autoFillCheckoutFields();

  // Global Esc to close profile
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeUserProfileModal();
      closeUserReceiptModal();
    }
  });

  // Listen to profile updates
  window.addEventListener('revmoto_auth_changed', updateHeaderUserIcon);
  window.addEventListener('revmoto_profile_updated', () => autoFillCheckoutFields(true));
});
