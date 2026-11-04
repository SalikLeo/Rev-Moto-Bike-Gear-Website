/**
 * REV MOTO — Modern Translucent Pill Header, Floating Cart Dock & Modals
 */

(function () {
  const currentPath = window.location.pathname;

  function isActive(page) {
    if (page === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === '')) {
      return 'active';
    }
    return currentPath.endsWith(page) ? 'active' : '';
  }

  // Translucent Pill Header HTML
  const pillHeaderHtml = `
    <div class="pill-header-wrapper">
      <nav class="pill-navbar" id="pillNavbar" aria-label="Main Navigation">
        <!-- Brand Logo -->
        <a href="index.html" class="pill-brand" aria-label="Rev Moto Home">
          <img src="assets/images/logo.png" alt="REV MOTO" class="brand-logo-img" width="36" height="36">
          <div class="brand-logotype">
            REV<span>MOTO</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="pill-nav-links">
          <a href="index.html" class="pill-link ${isActive('index.html')}">Home</a>
          <a href="shop.html" class="pill-link ${isActive('shop.html')}">Shop</a>
          <a href="about.html" class="pill-link ${isActive('about.html')}">About Us</a>
          <a href="contact.html" class="pill-link ${isActive('contact.html')}">Contact</a>
        </div>

        <!-- Right Quick Actions -->
        <div class="pill-actions">
          <button class="pill-action-btn pill-user-btn" id="navUserBtn" onclick="openUserProfileModal()" title="My Profile & Orders" aria-label="User Profile">
            <svg id="navUserIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="user-icon-svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          <button class="pill-action-btn pill-cart-btn" id="navCartBtn" onclick="openCartDrawer()" title="View Shopping Cart" aria-label="Shopping Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cart-icon-svg">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
            <span class="pill-cart-badge cart-count-pill" id="navCartBadge" style="display: none;">0</span>
          </button>

          <a href="https://wa.me/${RM_CONFIG.whatsapp.number}" target="_blank" rel="noopener" class="pill-action-btn pill-contact-btn pill-whatsapp-btn" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>

          <button class="pill-hamburger" id="pillHamburgerBtn" onclick="openMobileDrawer()" aria-label="Open Navigation Menu">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </nav>
    </div>

    <!-- FLOATING EXPANDABLE CART DOCK (Bottom-Right) -->
    <div class="floating-cart-dock" id="floatingCartDock" onclick="openCartDrawer()" title="Click to view shopping bag">
      <div class="cart-dock-pill">
        <div class="cart-dock-icon-wrap">
          <i class="fas fa-shopping-bag"></i>
          <span class="cart-dock-badge" id="floatingCartBadge">0</span>
        </div>
        <div class="cart-dock-details">
          <span class="dock-label">Shopping Bag</span>
          <span class="dock-subtotal" id="floatingCartSubtotal">Rs. 0</span>
        </div>
        <i class="fas fa-chevron-up text-cyan" style="font-size: 0.75rem; margin-left: 4px;"></i>
      </div>
    </div>

    <!-- Mobile Drawer Overlay & Menu -->
    <div class="drawer-overlay" id="mobileDrawerOverlay" onclick="closeMobileDrawer()"></div>
    <div class="cart-drawer mobile-nav-drawer" id="mobileDrawer" style="left: 0; right: auto; transform: translateX(-100%); width: 280px;">
      <div class="cart-drawer-header">
        <div class="pill-brand">
          <img src="assets/images/logo.png" alt="REV MOTO" class="brand-logo-img" width="24" height="24" style="height: 24px;">
          <div class="brand-logotype">REV<span>MOTO</span></div>
        </div>
        <button class="drawer-close-btn" onclick="closeMobileDrawer()"><i class="fas fa-times"></i></button>
      </div>
      <div class="cart-drawer-body">
        <!-- Customer Profile Quick Access inside Menu -->
        <div style="margin-bottom: 8px; margin-top: 2px;">
          <button class="pill-link" style="width: 100%; text-align: left; padding: 10px 14px; font-size: 0.88rem; background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.18); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="closeMobileDrawer(); openUserProfileModal();">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-cyan); flex-shrink: 0;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span id="drawerUserName" style="font-weight: 700; color: var(--text-pure);">My Account &amp; Orders</span>
            </div>
            <i class="fas fa-chevron-right text-cyan" style="font-size: 0.72rem;"></i>
          </button>
        </div>

        <!-- Quick Search Bar inside Menu -->
        <div class="drawer-search-box" style="margin-bottom: 8px; margin-top: 2px;">
          <button class="drawer-search-trigger" onclick="closeMobileDrawer(); openSearchModal();" aria-label="Search Catalog">
            <i class="fas fa-search text-cyan"></i>
            <span>Search products & gear...</span>
          </button>
        </div>

        <div class="mobile-menu-links" style="display: flex; flex-direction: column; gap: 5px;">
          <a href="index.html" class="pill-link ${isActive('index.html')}" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-home text-cyan" style="width: 20px;"></i> Home
          </a>
          <a href="shop.html" class="pill-link ${isActive('shop.html')}" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-th-large text-cyan" style="width: 20px;"></i> Shop All
          </a>
          <a href="shop.html?cat=apparel" class="pill-link" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-vest text-cyan" style="width: 20px;"></i> Jackets
          </a>
          <a href="shop.html?cat=gloves" class="pill-link" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-mitten text-cyan" style="width: 20px;"></i> Gloves
          </a>
          <a href="shop.html?cat=packs" class="pill-link" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-box text-cyan" style="width: 20px;"></i> Bags & Packs
          </a>
          <a href="about.html" class="pill-link ${isActive('about.html')}" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-shield-halved text-cyan" style="width: 20px;"></i> About Us
          </a>
          <a href="contact.html" class="pill-link ${isActive('contact.html')}" style="padding: 9px 12px; font-size: 0.85rem;" onclick="closeMobileDrawer()">
            <i class="fas fa-headset text-cyan" style="width: 20px;"></i> Contact Us
          </a>
        </div>

        <div class="drawer-bottom-cta" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-glass);">
          <a href="https://wa.me/${RM_CONFIG.whatsapp.number}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-full" style="height: 40px; font-size: 0.84rem;">
            <i class="fab fa-whatsapp"></i> Chat On WhatsApp
          </a>
          <div class="drawer-bottom-info" style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin-top: 10px; line-height: 1.4;">
            ${RM_CONFIG.brand.displayPhone} • ${RM_CONFIG.brand.address}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Search Modal -->
    <div class="modal-overlay" id="searchModalOverlay" onclick="closeSearchModal()"></div>
    <div class="search-modal" id="searchModal">
      <div class="search-modal-header">
        <div class="search-input-wrap">
          <i class="fas fa-search text-cyan"></i>
          <input type="text" id="searchModalInput" placeholder="Search riding jackets, carbon gloves, magnetic bags, or masks..." autocomplete="off">
        </div>
        <button class="drawer-close-btn" onclick="closeSearchModal()" style="width: 32px; height: 32px;"><i class="fas fa-times"></i></button>
      </div>
      <div class="search-modal-body" id="searchResultsContainer">
        <!-- Rendered by store.js -->
      </div>
    </div>

    <!-- Slide-in Cart Drawer -->
    <div class="drawer-overlay" id="cartDrawerOverlay" onclick="closeCartDrawer()"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div class="cart-drawer-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-shopping-bag text-cyan"></i>
          <h3 style="font-size: 1.25rem;">Your Shopping Bag</h3>
        </div>
        <button class="drawer-close-btn" onclick="closeCartDrawer()"><i class="fas fa-times"></i></button>
      </div>
      <div class="cart-drawer-body" id="cartDrawerBody">
        <!-- Rendered by store.js -->
      </div>
      <div class="cart-drawer-foot" id="cartDrawerFoot">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 0.95rem;">Subtotal</span>
          <span style="font-family: var(--font-display); font-size: 1.45rem; font-weight: 800; color: var(--accent-cyan);" id="drawerSubtotalVal">Rs. 0</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 18px;">Tracked courier fee calculated at checkout.</p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="checkout.html" class="btn btn-primary btn-full">
            <i class="fas fa-lock"></i> Proceed to Checkout
          </a>
          <a href="cart.html" class="btn btn-glass btn-full" onclick="closeCartDrawer()">
            View Full Bag & Promo Codes
          </a>
        </div>
      </div>
    </div>

    <!-- Unified Quick View Modal -->
    <div class="qv-modal-overlay" id="qvModalOverlay" onclick="closeQuickView()"></div>
    <div class="qv-modal" id="qvModal">
      <div class="qv-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--border-subtle); background: #ffffff;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="brand-tag-dot"></span>
          <span style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent-cyan);">Quick Product Overview</span>
        </div>
        <button class="drawer-close-btn" onclick="closeQuickView()" aria-label="Close Quick View"><i class="fas fa-times"></i></button>
      </div>
      <div class="qv-modal-body" id="qvModalContent">
        <!-- Populated dynamically -->
      </div>
    </div>
  `;

  // Luxury Modern Monolithic Dark Footer
  const footerHtml = `
    <footer class="site-footer">
      <div class="footer-top-glow"></div>
      <div class="site-container">
        <div class="footer-grid">
          <!-- Brand Column -->
          <div class="footer-col-brand">
            <div class="pill-brand" style="margin-bottom: 18px;">
              <img src="assets/images/logo_light.png" alt="REV MOTO" class="brand-logo-img" width="38" height="38" style="height: 38px;">
              <div class="brand-logotype">REV<span>MOTO</span></div>
            </div>
            <p class="footer-brand-desc">
              Next-generation aerodynamic motorcycle armor and technical riding apparel engineered in Sialkot for electric velocity and highway safety.
            </p>
            <div class="footer-social-row">
              <a href="${RM_CONFIG.brand.instagram}" target="_blank" rel="noopener" class="social-icon-btn" aria-label="Instagram" title="Follow on Instagram"><i class="fab fa-instagram"></i></a>
              <a href="https://wa.me/${RM_CONFIG.whatsapp.number}" target="_blank" rel="noopener" class="social-icon-btn" aria-label="WhatsApp" title="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>
              <a href="mailto:${RM_CONFIG.brand.email}" class="social-icon-btn" aria-label="Email" title="Email Concierge"><i class="fas fa-envelope"></i></a>
            </div>
          </div>

          <!-- Quick Navigation -->
          <div>
            <h4 class="footer-heading">Gear Collections</h4>
            <ul class="footer-nav-list">
              <li><a href="shop.html?cat=apparel">Riding Jackets</a></li>
              <li><a href="shop.html?cat=gloves">Motorcycle Gloves</a></li>
              <li><a href="shop.html?cat=packs">Magnetic Bags & Packs</a></li>
              <li><a href="shop.html?cat=masks">Face Masks & Balaclavas</a></li>
              <li><a href="shop.html">Browse Complete Catalog</a></li>
            </ul>
          </div>

          <!-- Customer Support -->
          <div>
            <h4 class="footer-heading">Support & Info</h4>
            <ul class="footer-nav-list">
              <li><a href="about.html">About REV MOTO & Craftsmanship</a></li>
              <li><a href="contact.html">Contact Us & Sizing Advice</a></li>
              <li><a href="terms.html">Tracked Shipping & Orders</a></li>
              <li><a href="terms.html">Warranty & Guarantee</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
            </ul>
          </div>

          <!-- Workshop & Contact -->
          <div>
            <h4 class="footer-heading">Workshop & Dispatch</h4>
            <div class="footer-info-item">
              <div class="footer-info-icon"><i class="fas fa-location-dot"></i></div>
              <span>${RM_CONFIG.brand.address}</span>
            </div>
            <div class="footer-info-item">
              <div class="footer-info-icon"><i class="fas fa-phone"></i></div>
              <a href="tel:${RM_CONFIG.brand.phone}">${RM_CONFIG.brand.displayPhone}</a>
            </div>
            <div class="footer-info-item">
              <div class="footer-info-icon"><i class="fas fa-truck-fast"></i></div>
              <span>Cash on Delivery (COD) Nationwide &bull; Flat Rs. 350 Tracked Courier</span>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div>&copy; 2026 REV MOTO Technologies Ltd. Engineered for electric velocity.</div>
          <div style="display: flex; gap: 18px;">
            <a href="terms.html">Terms & Conditions</a>
            <span style="color: rgba(255, 255, 255, 0.2);">&bull;</span>
            <a href="privacy.html">Privacy</a>
            <span style="color: rgba(255, 255, 255, 0.2);">&bull;</span>
            <a href="contact.html">Support</a>
            <span style="color: rgba(255, 255, 255, 0.2);">&bull;</span>
            <a href="admin/" style="opacity: 0.65;"><i class="fas fa-lock" style="font-size: 0.72rem; margin-right: 4px;"></i>Admin</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  // Scroll Reveal Observer
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-zoom, .reveal-zoom-up');
    if (typeof window !== 'undefined' && window.innerWidth <= 991) {
      reveals.forEach(el => el.classList.add('revealed'));
      return;
    }
    if ('IntersectionObserver' in window) {
      if (!window.__revScrollObserver) {
        window.__revScrollObserver = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              obs.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.05,
          rootMargin: '100px 0px 100px 0px'
        });
      }
      reveals.forEach(el => {
        if (!el.classList.contains('revealed')) {
          window.__revScrollObserver.observe(el);
        }
      });
    } else {
      reveals.forEach(el => el.classList.add('revealed'));
    }
  }

  // Light Blur Color Accent Atmospheric Background
  const ambientBgHtml = `
    <div class="site-ambient-bg" aria-hidden="true">
      <div class="ambient-glow orb-1"></div>
      <div class="ambient-glow orb-2"></div>
      <div class="ambient-glow orb-3"></div>
      <div class="ambient-glow orb-4"></div>
      <div class="ambient-glow orb-5"></div>
    </div>
  `;

  // Instant Seamless Component Injection (Prevents Header Jerk on Tab Switch)
  function injectComponents() {
    if (document.getElementById('pillNavbar')) return;
    document.body.insertAdjacentHTML('afterbegin', ambientBgHtml);
    document.body.insertAdjacentHTML('afterbegin', pillHeaderHtml);
    if (typeof updateBadges === 'function') {
      try { updateBadges(); } catch(e) {}
    }
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    // Navbar scroll elevation
    const nav = document.getElementById('pillNavbar');

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      if (scrollPos > 30) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    }, { passive: true });

    // Initialize Scroll Reveals
    initScrollReveal();
    setTimeout(initScrollReveal, 300);
    window.addEventListener('rev:products-loaded', () => setTimeout(initScrollReveal, 100));

    // Smooth Anchor Navigation
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash.startsWith('#!')) return;
      if (hash === '#sizing' || anchor.classList.contains('pdp-size-guide-btn') || anchor.closest('.modal') || anchor.closest('.size-guide-modal')) {
        return;
      }
      const targetEl = document.querySelector(hash);
      if (targetEl && !targetEl.closest('.size-guide-modal') && !targetEl.closest('.modal-overlay')) {
        e.preventDefault();
        const navOffset = 90;
        const targetY = targetEl.getBoundingClientRect().top + window.scrollY - navOffset;
        if (typeof window.smoothScrollTo === 'function') {
          window.smoothScrollTo(targetY, 750);
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }
    });
  }

  // Fallback: Ensure SmoothScroll is loaded if not already included
  if (!window.SmoothScroll && !document.querySelector('script[src*="smooth-scroll.js"]')) {
    const sc = document.createElement('script');
    sc.src = 'assets/js/smooth-scroll.js';
    sc.async = true;
    document.head.appendChild(sc);
  }

  if (document.body) {
    injectComponents();
  } else {
    document.addEventListener('DOMContentLoaded', injectComponents);
  }

  window.initScrollReveal = initScrollReveal;

  window.openMobileDrawer = function () {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
      drawer.style.transform = 'translateX(0)';
      overlay.classList.add('open');
      document.body.classList.add('modal-open');
    }
  };

  window.closeMobileDrawer = function () {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
      drawer.style.transform = 'translateX(-100%)';
      overlay.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  };

  /* ── Unified Quick View Modal Handlers ── */
  window.openQuickView = function (productId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const products = (typeof STORE_PRODUCTS !== 'undefined' && STORE_PRODUCTS.length)
      ? STORE_PRODUCTS
      : (typeof MASTER_PRODUCTS !== 'undefined' ? MASTER_PRODUCTS : []);
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const modal = document.getElementById('qvModal');
    const overlay = document.getElementById('qvModalOverlay');
    const content = document.getElementById('qvModalContent');
    if (!modal || !overlay || !content) return;

    const variants = (product.variants && product.variants.length > 0)
      ? product.variants
      : (product.sizes || ['Standard']).map(s => ({
          size: s,
          price: product.price,
          oldPrice: product.oldPrice,
        }));

    content.innerHTML = `
      <div class="qv-media-col" style="border-radius: var(--radius-md); overflow: hidden; background: #f1f5f9; aspect-ratio: 1; border: 1px solid var(--border-subtle);">
        <img src="${product.img}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" decoding="async" onerror="this.src='assets/images/jacket_cyber.jpg'">
      </div>
      <div class="qv-info-col" style="display: flex; flex-direction: column; gap: 14px;">
        <span class="qv-category" style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">${product.categoryLabel || product.category}</span>
        <h2 class="qv-title" style="font-size: 1.6rem; line-height: 1.2;">${product.name}</h2>
        <div class="qv-price-row" style="display: flex; align-items: baseline; gap: 12px;">
          <span id="qvCurrentPrice" class="qv-price-val" style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--accent-cyan);">${formatPKR(variants[0].price)}</span>
          <span id="qvOldPrice" class="qv-old-price" style="color: var(--text-muted); text-decoration: line-through; ${variants[0].oldPrice ? '' : 'display:none;'}">${variants[0].oldPrice ? formatPKR(variants[0].oldPrice) : ''}</span>
        </div>
        <p class="qv-desc" style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${product.desc}</p>
        
        <div class="qv-options-wrap" style="margin: 8px 0;">
          <label style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 6px;">Select Option / Size:</label>
          <div class="qv-size-grid" style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${variants.map((v, i) => `
              <button type="button" class="size-option-btn ${i === 0 ? 'active' : ''}" onclick="selectQuickViewVariant('${product.id}', ${i}, this)" data-index="${i}">
                <span class="size-name">${v.size}</span>
                <span class="size-price-tag">${formatPKR(v.price)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="qv-actions-row" style="display: flex; gap: 12px; margin-top: auto; padding-top: 14px;">
          <button class="btn btn-primary" onclick="addFromQuickView('${product.id}')" style="flex: 1.35; white-space: nowrap;">
            <i class="fas fa-shopping-bag"></i> Add to Bag
          </button>
          <a href="product.html?id=${product.id}" class="btn btn-glass" style="flex: 1; white-space: nowrap; justify-content: center;">
            Full Details <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    modal.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
  };

  window.selectQuickViewVariant = function (productId, idx, btnEl) {
    const products = (typeof STORE_PRODUCTS !== 'undefined' && STORE_PRODUCTS.length)
      ? STORE_PRODUCTS
      : (typeof MASTER_PRODUCTS !== 'undefined' ? MASTER_PRODUCTS : []);
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;
    const variants = (product.variants && product.variants.length > 0)
      ? product.variants
      : (product.sizes || ['Standard']).map(s => ({ size: s, price: product.price, oldPrice: product.oldPrice }));
    const v = variants[idx];
    if (!v) return;

    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll('.size-option-btn').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }

    const qvPrice = document.getElementById('qvCurrentPrice');
    const qvOld = document.getElementById('qvOldPrice');
    if (qvPrice) qvPrice.textContent = formatPKR(v.price);
    if (qvOld) {
      if (v.oldPrice) {
        qvOld.textContent = formatPKR(v.oldPrice);
        qvOld.style.display = 'inline';
      } else {
        qvOld.style.display = 'none';
      }
    }
  };

  window.addFromQuickView = function (productId) {
    const products = (typeof STORE_PRODUCTS !== 'undefined' && STORE_PRODUCTS.length)
      ? STORE_PRODUCTS
      : (typeof MASTER_PRODUCTS !== 'undefined' ? MASTER_PRODUCTS : []);
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const activeSizeBtn = document.querySelector('.qv-modal-body .size-option-btn.active');
    const variantIdx = activeSizeBtn ? Number(activeSizeBtn.dataset.index || 0) : 0;
    const variants = (product.variants && product.variants.length > 0)
      ? product.variants
      : (product.sizes || ['Standard']).map(s => ({ size: s, price: product.price, oldPrice: product.oldPrice }));
    const selectedVariant = variants[variantIdx] || variants[0];

    if (typeof addToCart === 'function') {
      addToCart(product, {
        size: selectedVariant.size,
        price: selectedVariant.price,
        openDrawer: false,
      });
    }
    closeQuickView();
  };

  window.closeQuickView = function () {
    document.getElementById('qvModal')?.classList.remove('open');
    document.getElementById('qvModalOverlay')?.classList.remove('open');
    document.body.classList.remove('modal-open');
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeQuickView();
    }
  });

  // Dynamically load user-profile.js engine if not already present
  if (!document.querySelector('script[src*="user-profile.js"]')) {
    const userScript = document.createElement('script');
    userScript.src = 'assets/js/user-profile.js?v=1.0';
    document.head.appendChild(userScript);
  }

})();
