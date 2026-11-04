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
    orderId: 'RM-85623',
    customerName: 'Shahid Afridi',
    rating: 5,
    comment: 'The Armored Mesh Riding Jacket is top tier! Ventilation is amazing on highway rides in Islamabad heat, and CE armor fits snugly.',
    date: 'Nov 4, 2026, 2:37 PM',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-2',
    orderId: 'RM-85619',
    customerName: 'Kamran Akmal',
    rating: 5,
    comment: 'Carbon knuckle gloves fit like a glove! Fast 3-day delivery to Islamabad and clean COD packaging.',
    date: 'Nov 4, 2026, 1:15 PM',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'rev-3',
    orderId: 'RM-85590',
    customerName: 'Bilal Haider',
    rating: 5,
    comment: 'Touring pants kept me completely dry during heavy rain. Material and stitching quality is 10/10.',
    date: 'Nov 4, 2026, 11:40 AM',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'rev-4',
    orderId: 'RM-85480',
    customerName: 'Usman Tariq',
    rating: 4,
    comment: 'Magnetic tank bag has very strong grip even at 120 km/h. Clear mobile touch window works perfectly.',
    date: 'Nov 3, 2026, 6:20 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'rev-5',
    orderId: 'RM-85412',
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
    if (myIds.includes(String(o.id || o.orderId))) return true;
    if (googleUser?.email && (o.email || '').toLowerCase() === googleUser.email.toLowerCase()) return true;
    if (profile.phone && (o.phone || '').replace(/\D/g, '') === profile.phone.replace(/\D/g, '')) return true;
    return false;
  });

  // If user has no specific orders yet, show the first 2-3 recent orders for testing convenience
  if (matched.length === 0 && allOrders.length > 0) {
    return allOrders.slice(0, 3);
  }

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
      <div class="user-modal-card" style="max-width: 420px; padding: 0; overflow: hidden; background: #ffffff;">
        <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.95rem; color: #0f172a;"><i class="fas fa-receipt text-cyan"></i> 80mm Order Receipt</strong>
          <button class="user-modal-close" onclick="closeUserReceiptModal()" style="width: 28px; height: 28px;"><i class="fas fa-times"></i></button>
        </div>
        <div style="padding: 16px; max-height: 75vh; overflow-y: auto;" id="userReceiptContent">
          <!-- Rendered by user-profile.js -->
        </div>
        <div style="padding: 12px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
          <button class="btn btn-primary btn-full" onclick="printUserReceipt()" style="height: 38px; font-size: 0.85rem;">
            <i class="fas fa-print"></i> Print Receipt
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
            const dateStr = formatUserOrderDate(order.created_at || order.createdAt);
            const total = order.total_amount || order.totalAmount || order.total || 0;

            return `
              <div class="user-order-card">
                <div class="user-order-top">
                  <div>
                    <span class="user-order-num">#${escapeUserHtml(orderId)}</span>
                    <span class="user-order-date">• ${dateStr}</span>
                  </div>
                  <span class="status-badge ${status}">${status}</span>
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
                    <button type="button" class="btn-user-action btn-user-action-wa" onclick="openUserWhatsAppSupport('${escapeUserHtml(orderId)}')" title="WhatsApp Support">
                      <i class="fab fa-whatsapp"></i> Help
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

  // 3. REVIEWS TAB
  else if (activeUserTab === 'reviews') {
    const reviews = getStoreReviews();
    body.innerHTML = `
      <!-- Leave a Review Form -->
      <div class="user-form-card" style="margin-bottom: 18px;">
        <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">
          <i class="fas fa-star text-gold" style="color: #f59e0b;"></i> Leave Your Review
        </div>
        <div style="font-size: 0.76rem; color: #64748b; margin-bottom: 12px;">Share your experience with our motorcycle armor and gear quality.</div>

        <form id="userReviewForm" onsubmit="handleCustomerReviewSubmit(event)">
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
            <input type="text" id="reviewAuthorName" class="user-field-input" placeholder="e.g. Shahid Afridi" value="${escapeUserHtml(profile.name || googleUser?.name || '')}" required>
          </div>

          <div class="user-field-group">
            <label class="user-field-label">Your Review &amp; Gear Feedback *</label>
            <textarea id="reviewCommentText" class="user-field-input" rows="3" placeholder="Tell riders about armor comfort, fit, material quality, and delivery speed..." required></textarea>
          </div>

          <div id="reviewSuccessNotice" style="display: none; padding: 8px 12px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 0.8rem; margin-bottom: 12px;">
            <i class="fas fa-check-circle"></i> Thank you! Your review has been submitted and posted.
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="height: 42px; font-weight: 700;">
            <i class="fas fa-paper-plane"></i> Submit Review
          </button>
        </form>
      </div>

      <!-- Published Reviews Stream -->
      <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: baseline;">
        <span>Customer Feedback (${reviews.length})</span>
        <span style="font-size: 0.74rem; color: #64748b;">4.9 ★ Rating Average</span>
      </div>

      <div class="user-reviews-stream">
        ${reviews.map(rev => `
          <div class="user-review-item">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div>
                <strong style="font-size: 0.88rem; color: #0f172a;">${escapeUserHtml(rev.customerName || 'Verified Rider')}</strong>
                <div class="review-stars-rendered" style="color: #f59e0b; font-size: 0.75rem; margin-top: 2px;">
                  ${Array(rev.rating || 5).fill('<i class="fas fa-star"></i>').join('')}
                </div>
              </div>
              <span style="font-size: 0.72rem; color: #94a3b8;">${escapeUserHtml(rev.date || 'Recent')}</span>
            </div>
            <p style="margin: 6px 0 0 0; font-size: 0.8rem; color: #334155; line-height: 1.45;">
              ${escapeUserHtml(rev.comment || '')}
            </p>
          </div>
        `).join('')}
      </div>
    `;
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
  const name = document.getElementById('reviewAuthorName')?.value || 'Rider';
  const comment = document.getElementById('reviewCommentText')?.value || '';
  const rating = Number(document.getElementById('selectedStarRating')?.value || 5);

  saveStoreReview({
    customerName: name,
    comment: comment,
    rating: rating
  });

  const notice = document.getElementById('reviewSuccessNotice');
  if (notice) notice.style.display = 'block';

  setTimeout(() => {
    renderUserProfileModalContent();
    showToast('Review submitted! Thank you.', 'love');
  }, 1200);
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
function openUserReceiptModal(orderId) {
  const orders = getCustomerOrders();
  const order = orders.find(o => String(o.id || o.orderId) === String(orderId));
  if (!order) return;

  const content = document.getElementById('userReceiptContent');
  if (!content) return;

  const items = order.items || [];
  const itemsHtml = items.map((it, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 5px 4px; text-align: center;">${idx + 1}</td>
      <td style="padding: 5px 4px;">
        <strong style="color: #000;">${escapeUserHtml(it.name)}</strong>
        <div style="font-size: 10px; color: #555;">Size: ${escapeUserHtml(it.size || 'Standard')}</div>
      </td>
      <td style="padding: 5px 4px; text-align: center;">${it.qty}</td>
      <td style="padding: 5px 4px; text-align: right;">${Number(it.price).toLocaleString()}</td>
      <td style="padding: 5px 4px; text-align: right; font-weight: 700;">${Number(it.price * it.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const delivery = order.delivery_cost || order.deliveryCost || 350;
  const total = order.total_amount || order.totalAmount || (subtotal + delivery);

  content.innerHTML = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; color: #000; padding: 8px;">
      <div style="text-align: center; margin-bottom: 12px;">
        <h2 style="font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">REV MOTO</h2>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 2px;">PREMIUM MOTORCYCLE GEAR &amp; PROTECTION</div>
        <div style="font-size: 10.5px; color: #333; margin-top: 3px;">Sialkot Manufacturing District, Punjab, Pakistan</div>
        <div style="font-size: 10.5px; color: #333; margin-top: 2px;">Phone: 0337-4249450</div>
        <div style="margin-top: 8px;">
          <span style="display: inline-block; border: 1.5px solid #000; padding: 2px 12px; font-weight: 800; font-size: 10px; text-transform: uppercase;">
            ${escapeUserHtml(order.payment_method || order.paymentMethod || 'CASH ON DELIVERY')}
          </span>
        </div>
      </div>

      <div style="border-top: 1.5px dashed #333; margin: 10px 0;"></div>

      <div style="font-size: 11px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between;"><span>Order ID:</span><strong>#${escapeUserHtml(order.id || order.orderId)}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Date:</span><span>${formatUserOrderDate(order.created_at || order.createdAt)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Customer:</span><strong>${escapeUserHtml(order.customer_name || order.customerName || 'Rider')}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Phone:</span><span>${escapeUserHtml(order.phone || '0337-4249450')}</span></div>
        <div><span>Address:</span> <span style="font-weight: 600;">${escapeUserHtml(order.address || 'Standard Delivery')}</span></div>
      </div>

      <div style="border-top: 1.5px dashed #333; margin: 10px 0;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
        <thead>
          <tr style="border-bottom: 1.5px solid #000; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 4px; text-align: center;">#</th>
            <th style="padding: 4px; text-align: left;">Item</th>
            <th style="padding: 4px; text-align: center;">Qty</th>
            <th style="padding: 4px; text-align: right;">Rate</th>
            <th style="padding: 4px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="font-size: 11px; line-height: 1.6; border-top: 1px solid #000; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>Rs. ${subtotal.toLocaleString()}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Delivery Charges:</span><span>Rs. ${delivery.toLocaleString()}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; border-top: 1.5px solid #000; margin-top: 4px; padding-top: 4px;">
          <span>TOTAL AMOUNT:</span>
          <span>Rs. ${Number(total).toLocaleString()}</span>
        </div>
      </div>

      <div style="border-top: 1.5px dashed #333; margin: 12px 0 6px 0;"></div>
      <div style="text-align: center; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">
        THANK YOU FOR ORDERING WITH REV MOTO!
      </div>
    </div>
  `;

  document.getElementById('userReceiptOverlay').classList.add('open');
}

function closeUserReceiptModal() {
  const el = document.getElementById('userReceiptOverlay');
  if (el) el.classList.remove('open');
}

function printUserReceipt() {
  const content = document.getElementById('userReceiptContent');
  if (!content) return;
  const printWin = window.open('', '_blank', 'width=420,height=600');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>REV MOTO Receipt</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 4mm; width: 72mm; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
    </html>
  `);
  printWin.document.close();
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
  const navIcon = document.getElementById('navUserIcon');
  const googleUser = getStoredCustomerUser();

  if (navIcon && googleUser && googleUser.picture) {
    navIcon.outerHTML = `<img src="${googleUser.picture}" id="navUserIcon" alt="${googleUser.name}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1.5px solid #2563eb;">`;
  } else if (navBtn && googleUser) {
    navBtn.innerHTML = `<img src="${googleUser.picture}" id="navUserIcon" alt="${googleUser.name}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1.5px solid #2563eb;">`;
  }

  // Update Drawer user name if present
  const drawerName = document.getElementById('drawerUserName');
  if (drawerName) {
    drawerName.textContent = googleUser ? googleUser.name : 'My Account & Orders';
  }
}

// Auto-fill checkout fields if on checkout.html
function autoFillCheckoutFields() {
  const profile = getStoredUserProfile();
  const googleUser = getStoredCustomerUser();

  const nameInput = document.getElementById('coFullName');
  if (nameInput && !nameInput.value && (profile.name || googleUser?.name)) {
    nameInput.value = profile.name || googleUser?.name || '';
  }

  const phoneInput = document.getElementById('coPhone');
  if (phoneInput && !phoneInput.value && profile.phone) {
    phoneInput.value = profile.phone;
  }

  const emailInput = document.getElementById('coEmail');
  if (emailInput && !emailInput.value && (profile.email || googleUser?.email)) {
    emailInput.value = profile.email || googleUser?.email || '';
  }

  const addressInput = document.getElementById('coStreetAddress');
  if (addressInput && !addressInput.value && profile.address) {
    addressInput.value = profile.address;
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
  window.addEventListener('revmoto_profile_updated', autoFillCheckoutFields);
});
