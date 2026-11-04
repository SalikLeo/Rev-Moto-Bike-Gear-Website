/**
 * REV MOTO — Modern Store Engine & Configuration
 * Luxury Hyper-EV Aesthetic, Floating Cart Dock, Bezier Flying Animations
 */

const RM_CONFIG = {
  brand: {
    name: 'REV MOTO',
    tagline: 'NEXT-GEN PROTECTION. BUILT FOR SPEED.',
    email: 'revmoto.pk@gmail.com',
    phone: '0337-4249450',
    displayPhone: '0337-4249450',
    address: 'Sialkot Manufacturing District, Punjab, Pakistan',
    established: '2026',
    instagram: 'https://www.instagram.com/revmoto.pk',
  },
  whatsapp: {
    number: '923374249450',
    defaultMessage: 'Hello Rev Moto! I am inquiring about your motorcycle armor and riding gear collection.',
  },
  cod: {
    label: 'Cash on Delivery (COD)',
    instructions: 'Pay cash directly to the courier upon delivery at your doorstep.',
  },
  delivery: {
    standard: { label: 'Standard Tracked Delivery (3–5 Days)', price: 350 },
    cost: 350,
  },
  currency: {
    code: 'PKR',
    symbol: 'Rs.',
  },
  categories: [
    {
      id: 'apparel',
      label: 'Jackets & Apparel',
      shortLabel: 'Jackets',
      icon: 'fa-vest',
      badge: 'CE Armor',
      desc: 'Breathable ballistic mesh jackets with CE Level-2 armor plates and cooling vents.',
      image: 'assets/images/jacket_cyber.jpg',
      sub: [
        { id: 'jackets', label: 'Armored Jackets', icon: 'fa-vest' },
        { id: 'pants', label: 'Riding Pants', icon: 'fa-socks' },
        { id: 'tees', label: 'Rider T-Shirts', icon: 'fa-tshirt' },
      ],
    },
    {
      id: 'gloves',
      label: 'Motorcycle Gloves',
      shortLabel: 'Gloves',
      icon: 'fa-mitten',
      badge: 'Carbon Knuckle',
      desc: 'Molded carbon knuckle protectors, palm sliders, and touchscreen fingertips.',
      image: 'assets/images/gloves_carbon.jpg',
      sub: [
        { id: 'race-gloves', label: 'Carbon Fiber Gloves', icon: 'fa-hand-paper' },
        { id: 'winter-gloves', label: 'Thermal Winter Gloves', icon: 'fa-mitten' },
      ],
    },
    {
      id: 'packs',
      label: 'Tank Bags & Packs',
      shortLabel: 'Bags',
      icon: 'fa-box',
      badge: 'Magnetic',
      desc: 'Durable ballistic fabric with strong magnetic tank mounts and waterproof construction.',
      image: 'assets/images/tankbag.jpeg',
      sub: [
        { id: 'tank-pack', label: 'Magnetic Tank Bags', icon: 'fa-box' },
        { id: 'saddle-pack', label: 'Waterproof Saddlebags', icon: 'fa-archive' },
      ],
    },
    {
      id: 'masks',
      label: 'Face Masks & Balaclavas',
      shortLabel: 'Masks',
      icon: 'fa-mask',
      badge: 'Anti-Fog',
      desc: 'Anti-fog exhale check valves with carbon dust filtration for clear vision.',
      image: 'assets/images/halfmask.jpeg',
      sub: [
        { id: 'half-mask', label: 'Anti-Fog Face Masks', icon: 'fa-head-side-mask' },
        { id: 'balaclava', label: 'Thermal Balaclavas', icon: 'fa-head-side-mask' },
      ],
    },
  ],
};

/* ── Flagship Products Catalog ── */

// ── DYNAMIC STORE SETTINGS (LOADED FROM ADMIN SETTINGS) ──
try {
  const dynamicSettings = JSON.parse(localStorage.getItem('revmoto_store_settings') || '{}');
  if (dynamicSettings.deliveryFee !== undefined && dynamicSettings.deliveryFee !== '') {
    const fee = Number(dynamicSettings.deliveryFee);
    RM_CONFIG.delivery.cost = fee;
    RM_CONFIG.delivery.standard.price = fee;
  }
  if (dynamicSettings.deliveryLabel) {
    RM_CONFIG.delivery.standard.label = dynamicSettings.deliveryLabel;
  }
  if (dynamicSettings.phone) {
    RM_CONFIG.brand.phone = dynamicSettings.phone;
    RM_CONFIG.brand.displayPhone = dynamicSettings.phone;
  }
  if (dynamicSettings.whatsapp) {
    RM_CONFIG.whatsapp.number = String(dynamicSettings.whatsapp).replace(/\D/g, '');
  }
  if (dynamicSettings.email) {
    RM_CONFIG.brand.email = dynamicSettings.email;
  }
  if (dynamicSettings.address) {
    RM_CONFIG.brand.address = dynamicSettings.address;
  }
} catch (e) {}

const MASTER_PRODUCTS = [
  {
    id: 'rm-cyber-jacket-01',
    name: 'Armored Mesh Riding Jacket',
    slug: 'armored-mesh-riding-jacket',
    category: 'jackets',
    subcategory: 'apparel',
    categoryLabel: 'Riding Jackets',
    price: 14500,
    oldPrice: 18000,
    badge: 'Flagship Drop',
    rating: 5.0,
    reviews: 48,
    img: 'assets/images/jacket_cyber.jpg',
    images: [
      'assets/images/jacket_cyber.jpg',
      'assets/images/hero_electric_bike.jpg',
      'assets/images/jacket.jpeg',
    ],
    sizes: ['M (38-40")', 'L (41-43")', 'XL (44-46")', 'XXL (47-49")'],
    variants: [
      { size: 'M (38-40")', price: 14500, oldPrice: 18000, stock: 4 },
      { size: 'L (41-43")', price: 15200, oldPrice: 18800, stock: 6 },
      { size: 'XL (44-46")', price: 15800, oldPrice: 19500, stock: 5 },
      { size: 'XXL (47-49")', price: 16500, oldPrice: 20500, stock: 2 },
    ],
    colors: ['#0d0e12', '#1a1d26'],
    stock: { 'M (38-40")': 4, 'L (41-43")': 6, 'XL (44-46")': 5, 'XXL (47-49")': 2 },
    totalStock: 17,
    tagline: 'Molded Carbon Armor Plates · High-Flow Airflow Mesh · 360° Reflective',
    desc: 'The pinnacle of motorcycle street armor. Features genuine vacuum-infused carbon fiber shoulder impact shields, ultra-durable 1000D ballistic mesh chassis for maximum hot-climate airflow, and internal pockets for CE Level-2 memory armor. Waterproof storm zippers seal against wind at highway speeds.',
    features: [
      'Sculpted carbon fiber shoulder and elbow slider plates',
      'High-velocity 3D ballistic polyester airflow mesh',
      '360° reflective piping with 3M Scotchlite nighttime visibility',
      'Interior waterproof tech pocket with magnetic cable passthrough',
      'Pre-curved ergonomic race contour prevents tank bunching',
    ],
    featured: true,
  },
  {
    id: 'rm-carbon-gloves-01',
    name: 'Carbon Fiber Riding Gloves',
    slug: 'carbon-fiber-riding-gloves',
    category: 'race-gloves',
    subcategory: 'gloves',
    categoryLabel: 'Motorcycle Gloves',
    price: 5200,
    oldPrice: 6500,
    badge: 'Carbon Knuckle',
    rating: 4.9,
    reviews: 64,
    img: 'assets/images/gloves_carbon.jpg',
    images: [
      'assets/images/gloves_carbon.jpg',
      'assets/images/hero_electric_bike.jpg',
      'assets/images/glove.jpeg',
    ],
    sizes: ['M (Palm 8.0-8.5")', 'L (Palm 8.5-9.0")', 'XL (Palm 9.0-9.5")'],
    variants: [
      { size: 'M (Palm 8.0-8.5")', price: 5200, oldPrice: 6500, stock: 12 },
      { size: 'L (Palm 8.5-9.0")', price: 5500, oldPrice: 6900, stock: 15 },
      { size: 'XL (Palm 9.0-9.5")', price: 5900, oldPrice: 7400, stock: 8 },
    ],
    colors: ['#090a0d'],
    stock: { 'M (Palm 8.0-8.5")': 12, 'L (Palm 8.5-9.0")': 15, 'XL (Palm 9.0-9.5")': 8 },
    totalStock: 35,
    tagline: 'Carbon Knuckle Shield · Palm Slider · Touchscreen Controls',
    desc: 'Crafted for instant throttle sensitivity and high-level protection. Molded carbon-fiber knuckles with shock-absorbing silicone gel underlay deflect impacts, while palm sliders protect scaphoid bones. Full touchscreen capacitive leather on index and thumb.',
    features: [
      'Ergonomic carbon-fiber knuckle carapace with micro-air intakes',
      'Integrated titanium scaphoid palm slider pucks',
      'Perforated goat leather and 3D air-mesh hybrid construction',
      'Conductive SmartTouch fingertips for smartphone cockpit navigation',
      'Reinforced Kevlar double-needle abrasion seams',
    ],
    featured: true,
  },
  {
    id: 'rm-nomad-tankbag-01',
    name: 'Magnetic Tank Bag (Modular)',
    slug: 'magnetic-tank-bag-18l',
    category: 'tank-pack',
    subcategory: 'packs',
    categoryLabel: 'Tank Bags & Packs',
    price: 8900,
    oldPrice: 10500,
    badge: 'Touring Essential',
    rating: 4.9,
    reviews: 31,
    img: 'assets/images/tankbag.jpeg',
    images: [
      'assets/images/tankbag.jpeg',
      'assets/images/hero_electric_bike.jpg',
    ],
    sizes: ['14L Streamline Urban', '18L Expandable Modular', '24L Long-Haul Touring'],
    variants: [
      { size: '14L Streamline Urban', price: 8200, oldPrice: 9900, stock: 10 },
      { size: '18L Expandable Modular', price: 8900, oldPrice: 10500, stock: 14 },
      { size: '24L Long-Haul Touring', price: 9800, oldPrice: 11900, stock: 6 },
    ],
    colors: ['#0e1017'],
    stock: { '14L Streamline Urban': 10, '18L Expandable Modular': 14, '24L Long-Haul Touring': 6 },
    totalStock: 30,
    tagline: 'Strong Shielded Magnets · Transparent Map Window · Shoulder Strap',
    desc: 'Engineered for daily commuting and highway touring. Features 4 ultra-strong neodymium magnetic flaps that grip any steel tank firmly even at highway speeds. Expands smoothly from 12L to 18L with waterproof zippers and converts into a convenient shoulder bag off the bike.',
    features: [
      'Shielded rare-earth magnets will not interfere with phone electronics',
      'Touch-responsive cockpit HUD window for navigation devices',
      'Includes 100% submersible neon storm cover with reflective detailing',
      'Quick-release magnetic Fidlock chest strap conversion',
      'Non-abrasive silicone base protects motorcycle clear coats',
    ],
    featured: true,
  },
  {
    id: 'rm-phantom-mask-01',
    name: 'Anti-Fog Riding Face Mask',
    slug: 'anti-fog-riding-face-mask',
    category: 'half-mask',
    subcategory: 'masks',
    categoryLabel: 'Face Masks',
    price: 2600,
    oldPrice: 3200,
    badge: 'Anti-Fog',
    rating: 4.8,
    reviews: 52,
    img: 'assets/images/halfmask.jpeg',
    images: [
      'assets/images/halfmask.jpeg',
    ],
    sizes: ['Standard (Single PM0.1 Filter)', 'Twin-Pack (3x Carbon Filters)', 'Winter Pro (Thermal + 5x Filters)'],
    variants: [
      { size: 'Standard (Single PM0.1 Filter)', price: 2600, oldPrice: 3200, stock: 25 },
      { size: 'Twin-Pack (3x Carbon Filters)', price: 3300, oldPrice: 4000, stock: 15 },
      { size: 'Winter Pro (Thermal + 5x Filters)', price: 4100, oldPrice: 5000, stock: 10 },
    ],
    colors: ['#0a0b10'],
    stock: { 'Standard (Single PM0.1 Filter)': 25, 'Twin-Pack (3x Carbon Filters)': 15, 'Winter Pro (Thermal + 5x Filters)': 10 },
    totalStock: 50,
    tagline: 'Dual Rapid Exhale Valves · Replaceable Carbon Filter · Windproof',
    desc: 'Eliminates helmet visor fogging while filtering road dust, exhaust smog, and cold highway winds. Dual directional check valves vent warm moist breath downward while keeping icy headwinds out.',
    features: [
      'Medical-grade windproof thermal neoprene contour',
      'Dual rapid-flow one-way exhale check valves prevent visor condensation',
      'Includes 3x multi-layer activated carbon PM0.1 filtration inserts',
      'Pliable aluminum memory nose bridge clamp for an airtight seal',
      'Low-profile contour fits comfortably under any full-face helmet chin bar',
    ],
    featured: true,
  },
  {
    id: 'rm-heritage-tee-01',
    name: 'Heavyweight Rider T-Shirt',
    slug: 'heavyweight-rider-tshirt',
    category: 'tees',
    subcategory: 'apparel',
    categoryLabel: 'Streetwear',
    price: 3200,
    oldPrice: 3900,
    badge: 'Heavyweight Cotton',
    rating: 5.0,
    reviews: 29,
    img: 'assets/images/tshirt.jpeg',
    images: [
      'assets/images/tshirt.jpeg',
    ],
    sizes: ['S (Drop Shoulder)', 'M (Drop Shoulder)', 'L (Drop Shoulder)', 'XL (Drop Shoulder)'],
    variants: [
      { size: 'S (Drop Shoulder)', price: 3200, oldPrice: 3900, stock: 8 },
      { size: 'M (Drop Shoulder)', price: 3200, oldPrice: 3900, stock: 14 },
      { size: 'L (Drop Shoulder)', price: 3450, oldPrice: 4200, stock: 16 },
      { size: 'XL (Drop Shoulder)', price: 3650, oldPrice: 4400, stock: 10 },
    ],
    colors: ['#08090d', '#f1f5f9'],
    stock: { 'S (Drop Shoulder)': 8, 'M (Drop Shoulder)': 14, 'L (Drop Shoulder)': 16, 'XL (Drop Shoulder)': 10 },
    totalStock: 48,
    tagline: '320 GSM Combed Cotton · Water-Resistant Finish · Relaxed Fit',
    desc: 'The luxury off-bike essential. Cut in a tailored streetwear drop-shoulder silhouette using 320 GSM heavyweight combed cotton that repels light road splash and holds its structure wash after wash.',
    features: [
      'Ultra-dense 320 GSM combed ring-spun cotton fabric',
      'Hydrophobic nano-coating sheds road spray and dirt',
      'High-density silicone Rev Moto cyber insignia on chest',
      'Reinforced ribbed crew collar that never loses shape',
      'Reflective micro-tag on rear hem for nighttime walking visibility',
    ],
    featured: true,
  },
  {
    id: 'rm-stealth-jacket-02',
    name: 'All-Weather Armored Riding Jacket',
    slug: 'all-weather-armored-riding-jacket',
    category: 'jackets',
    subcategory: 'apparel',
    categoryLabel: 'Riding Jackets',
    price: 11800,
    oldPrice: 14500,
    badge: 'CE Level-2 Certified',
    rating: 4.9,
    reviews: 36,
    img: 'assets/images/jacket.jpeg',
    images: [
      'assets/images/jacket.jpeg',
      'assets/images/jacket_cyber.jpg',
    ],
    sizes: ['M (38-40")', 'L (41-43")', 'XL (44-46")', 'XXL (47-49")'],
    variants: [
      { size: 'M (38-40")', price: 11800, oldPrice: 14500, stock: 5 },
      { size: 'L (41-43")', price: 12400, oldPrice: 15200, stock: 8 },
      { size: 'XL (44-46")', price: 12900, oldPrice: 15800, stock: 7 },
      { size: 'XXL (47-49")', price: 13500, oldPrice: 16500, stock: 3 },
    ],
    colors: ['#0b0c10'],
    stock: { 'M (38-40")': 5, 'L (41-43")': 8, 'XL (44-46")': 7, 'XXL (47-49")': 3 },
    totalStock: 23,
    tagline: 'Cordura 600D Chassis · Removable Warm Liner · CE Armor Included',
    desc: 'Engineered for all-season versatility and maximum abrasion protection across Pakistani highways and urban roads. Features a 600D Cordura shell with reinforced panels, removable quilted thermal liner for cold nights, and integrated CE Level-2 shoulder and elbow impact protectors with high-density spine defense.',
    features: [
      'Heavy-duty 600D abrasion-resistant Cordura textile construction',
      'CE Level-2 certified removable armor at elbows, shoulders, and spine',
      'Detachable quilted thermal liner for year-round temperature control',
      'Adjustable waist straps and bicep tensioners for wind-defying fit',
      'Multiple exterior waterproof utility pockets with high-vis reflective accents',
    ],
    featured: true,
  },
  {
    id: 'rm-pro-gloves-02',
    name: 'Street Grip Riding Gloves',
    slug: 'street-grip-riding-gloves',
    category: 'race-gloves',
    subcategory: 'gloves',
    categoryLabel: 'Motorcycle Gloves',
    price: 4200,
    oldPrice: 5200,
    badge: 'Street Grip',
    rating: 4.8,
    reviews: 42,
    img: 'assets/images/glove.jpeg',
    images: [
      'assets/images/glove.jpeg',
      'assets/images/gloves_carbon.jpg',
    ],
    sizes: ['M (Palm 8.0-8.5")', 'L (Palm 8.5-9.0")', 'XL (Palm 9.0-9.5")'],
    variants: [
      { size: 'M (Palm 8.0-8.5")', price: 4200, oldPrice: 5200, stock: 10 },
      { size: 'L (Palm 8.5-9.0")', price: 4500, oldPrice: 5500, stock: 14 },
      { size: 'XL (Palm 9.0-9.5")', price: 4800, oldPrice: 5900, stock: 9 },
    ],
    colors: ['#0f1015'],
    stock: { 'M (Palm 8.0-8.5")': 10, 'L (Palm 8.5-9.0")': 14, 'XL (Palm 9.0-9.5")': 9 },
    totalStock: 33,
    tagline: 'Molded Knuckle Guards · Silicone Non-Slip Grip · Airflow Vents',
    desc: 'Daily street-riding performance with exceptional throttle feel. Incorporates molded protective knuckle guards with ventilation inlets, silicone grip prints on fingertips for positive clutch and brake lever engagement, and elastic wrist closure.',
    features: [
      'Molded composite knuckle shields with forced-air cooling vents',
      'Microfiber suede palm reinforced with non-slip silicone traction patterns',
      'SmartTouch capacitive threading for easy phone and GPS control',
      'Pre-curved anatomical finger tailoring eliminates grip fatigue',
      'Quick-release TPR hook-and-loop cuff closure',
    ],
    featured: false,
  },
];

// Helper to retrieve catalog products (defaults to MASTER_PRODUCTS or custom products if added in Admin)
function getCatalogProducts() {
  try {
    const custom = localStorage.getItem('revmoto_custom_products');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...MASTER_PRODUCTS];
}

let STORE_PRODUCTS = getCatalogProducts();

// Listen to custom products updates from Admin
window.addEventListener('revmoto_products_updated', (e) => {
  if (Array.isArray(e.detail)) {
    STORE_PRODUCTS = e.detail;
  } else {
    STORE_PRODUCTS = getCatalogProducts();
  }
});


/* ── Cart & Wishlist Storage ── */
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('revmoto_luxury_cart')) || [];
    // Ensure every item has a safe alphanumeric cartItemId without raw quotes or symbols
    cart.forEach(item => {
      if (!item.cartItemId || /["'`\\]/.test(item.cartItemId)) {
        const safeSize = String(item.size || 'standard').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'std';
        item.cartItemId = `${item.id}-${safeSize}`;
      }
    });
    return cart;
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('revmoto_luxury_cart', JSON.stringify(cart));
  updateBadges();
  renderCartDrawer();
  window.dispatchEvent(new CustomEvent('rev:cart-updated', { detail: cart }));
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('revmoto_luxury_wishlist')) || [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem('revmoto_luxury_wishlist', JSON.stringify(list));
  updateBadges();
  window.dispatchEvent(new CustomEvent('rev:wishlist-updated', { detail: list }));
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.qty || 1), 0);
}

function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
}

function isWishlisted(id) {
  return getWishlist().some(item => String(item.id) === String(id));
}

function formatPKR(val) {
  return `${RM_CONFIG.currency.symbol} ${Number(val).toLocaleString('en-PK')}`;
}

/* ── Cart Operations ── */
function addToCart(product, options = {}) {
  const cart = getCart();
  const selectedSize = options.size || (product.sizes ? product.sizes[0] : 'Standard');
  const safeSizeSlug = String(selectedSize).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'std';
  const qty = Number(options.qty) || 1;
  const cartItemId = `${product.id}-${safeSizeSlug}`;

  // Resolve variation price
  let itemPrice = product.price;
  if (options.price !== undefined && options.price !== null) {
    itemPrice = Number(options.price);
  } else if (product.variants && product.variants.length > 0) {
    const matched = product.variants.find(v => v.size === selectedSize);
    if (matched && matched.price) {
      itemPrice = matched.price;
    }
  }

  const existing = cart.find(i => i.cartItemId === cartItemId);
  if (existing) {
    existing.qty += qty;
    existing.price = itemPrice;
  } else {
    cart.push({
      cartItemId,
      id: product.id,
      name: product.name,
      price: itemPrice,
      img: product.img,
      category: product.category,
      size: selectedSize,
      qty,
    });
  }

  saveCart(cart);
  // (Toast suppressed per client request for a cleaner shopping experience)

  // Trigger bezier fly animation to floating cart dock
  if (options.sourceEl) {
    animateFlyToFloatingCart(options.sourceEl, product.img);
  }

  // Automatic cart drawer opening disabled per user request: "dont open the cart automatically when i add an item"
  if (options.forceOpenDrawer === true) {
    setTimeout(openCartDrawer, 450);
  }
}

function removeFromCartIndex(index) {
  let cart = getCart();
  const idx = Number(index);
  if (idx >= 0 && idx < cart.length) {
    cart.splice(idx, 1);
    saveCart(cart);
  }
}

function updateCartQtyByIndex(index, delta) {
  let cart = getCart();
  const idx = Number(index);
  if (idx >= 0 && idx < cart.length) {
    cart[idx].qty = (cart[idx].qty || 1) + Number(delta);
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    saveCart(cart);
  }
}

function updateCartQty(cartItemId, delta) {
  if (typeof cartItemId === 'number' || (/^\d+$/.test(String(cartItemId)) && Number(cartItemId) < getCart().length)) {
    return updateCartQtyByIndex(Number(cartItemId), delta);
  }
  let cart = getCart();
  const item = cart.find(i => i.cartItemId === cartItemId || String(i.id) === String(cartItemId));
  if (!item) return;

  item.qty += Number(delta);
  if (item.qty <= 0) {
    cart = cart.filter(i => i !== item);
  }
  saveCart(cart);
}

function removeFromCart(cartItemId) {
  if (typeof cartItemId === 'number' || (/^\d+$/.test(String(cartItemId)) && Number(cartItemId) < getCart().length)) {
    return removeFromCartIndex(Number(cartItemId));
  }
  let cart = getCart();
  cart = cart.filter(i => i.cartItemId !== cartItemId && String(i.id) !== String(cartItemId));
  saveCart(cart);
}

function toggleWishlist(product) {
  let list = getWishlist();
  const exists = list.some(i => String(i.id) === String(product.id));
  if (exists) {
    list = list.filter(i => String(i.id) !== String(product.id));
    saveWishlist(list);
    showToast(`Removed from saved gear`, 'info');
  } else {
    list.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      category: product.category,
    });
    saveWishlist(list);
    showToast(`Saved to wishlist!`, 'love');
  }
}

/* ── 3D Bezier Curve Fly-to-Cart Animation ── */
function animateFlyToFloatingCart(sourceElement, imgSrc) {
  const targetDock = document.getElementById('floatingCartDock') || document.getElementById('pillCartBtn');
  if (!targetDock || !sourceElement) return;

  const startRect = sourceElement.getBoundingClientRect();
  const endRect = targetDock.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'cart-flyer';
  flyer.innerHTML = `<img src="${imgSrc}" alt="Flying to bag" onerror="this.src='assets/images/jacket_cyber.jpg'">`;

  flyer.style.top = `${startRect.top + startRect.height / 2 - 28}px`;
  flyer.style.left = `${startRect.left + startRect.width / 2 - 28}px`;
  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    flyer.style.transform = `translate(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px) scale(0.2) rotate(360deg)`;
    flyer.style.opacity = '0';
  });

  setTimeout(() => {
    flyer.remove();
    targetDock.classList.add('cart-pulse');
    setTimeout(() => targetDock.classList.remove('cart-pulse'), 600);
  }, 750);
}

/* ── Toast Notification System ── */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-check-circle',
    love: 'fa-heart',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
  };

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icons[type] || 'fa-info-circle'}"></i></div>
    <div class="toast-text">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ── Dynamic Badge & Floating Dock Sync ── */
function updateBadges() {
  const cCount = getCartCount();
  const subtotal = getCartSubtotal();
  const wCount = getWishlist().length;

  // Floating dock update
  const dockBadge = document.getElementById('floatingCartBadge');
  const dockSubtotal = document.getElementById('floatingCartSubtotal');
  const dockPill = document.getElementById('floatingCartDock');

  if (dockBadge) dockBadge.textContent = cCount;
  if (dockSubtotal) dockSubtotal.textContent = formatPKR(subtotal);

  // Pill header count
  document.querySelectorAll('.cart-count-pill').forEach(b => {
    b.textContent = cCount;
  });

  document.querySelectorAll('.wish-count-pill').forEach(b => {
    b.textContent = wCount;
  });
}

/* ── Modern Cart Drawer ── */
function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    renderCartDrawer();
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
}

function renderCartDrawer() {
  const body = document.getElementById('cartDrawerBody');
  const foot = document.getElementById('cartDrawerFoot');
  if (!body) return;

  const cart = getCart();
  const subtotal = getCartSubtotal();
  const threshold = RM_CONFIG.delivery.freeThreshold;
  const awayFromFree = Math.max(0, threshold - subtotal);
  const freePct = Math.min(100, Math.round((subtotal / threshold) * 100));

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: var(--text-muted);">
          <i class="fas fa-shopping-bag"></i>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 8px; color: var(--text-pure);">Your Shopping Bag is Empty</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">Explore our protective riding jackets, carbon gloves, and bags.</p>
        <a href="shop.html" class="btn btn-primary btn-sm" onclick="closeCartDrawer()">
          Explore Collection <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    `;
    if (foot) foot.style.display = 'none';
    return;
  }

  if (foot) foot.style.display = 'block';

  let itemsHtml = cart.map((item, index) => `
    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 18px;">
      <a href="product.html?id=${item.id}" style="width: 80px; height: 80px; border-radius: var(--radius-md); overflow: hidden; background: #f1f5f9; border: 1px solid var(--border-subtle); display: block;">
        <img src="${item.img}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" decoding="async" onerror="this.src='assets/images/jacket_cyber.jpg'">
      </a>
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <a href="product.html?id=${item.id}" style="font-family: var(--font-display); font-weight: 700; font-size: 0.98rem; color: var(--text-pure); line-height: 1.3;">${item.name}</a>
          <button type="button" onclick="removeFromCartIndex(${index})" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'" aria-label="Remove item" title="Remove item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin: 4px 0 8px;">Size: ${item.size}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <div style="display: inline-flex; align-items: center; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden;">
            <button type="button" onclick="updateCartQtyByIndex(${index}, -1)" style="background: none; border: none; color: var(--text-pure); width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;"><i class="fas fa-minus"></i></button>
            <span style="font-size: 0.88rem; font-weight: 700; min-width: 24px; text-align: center; color: var(--text-pure);">${item.qty}</span>
            <button type="button" onclick="updateCartQtyByIndex(${index}, 1)" style="background: none; border: none; color: var(--text-pure); width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;"><i class="fas fa-plus"></i></button>
          </div>
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; color: var(--accent-cyan);">${formatPKR(item.price * item.qty)}</div>
        </div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `<div class="drawer-items-list">${itemsHtml}</div>`;

  const subtotalEl = document.getElementById('drawerSubtotalVal');
  if (subtotalEl) {
    subtotalEl.textContent = formatPKR(subtotal);
  }
}

/* ── Modern Search Overlay ── */
function openSearchModal() {
  const modal = document.getElementById('searchModal');
  const overlay = document.getElementById('searchModalOverlay');
  const input = document.getElementById('searchModalInput');
  if (modal && overlay) {
    modal.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
      renderSearchResults('');
    }
  }
}

function closeSearchModal() {
  const modal = document.getElementById('searchModal');
  const overlay = document.getElementById('searchModalOverlay');
  if (modal && overlay) {
    modal.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
}

function renderSearchResults(query) {
  const resContainer = document.getElementById('searchResultsContainer');
  if (!resContainer) return;

  const q = (query || '').trim().toLowerCase();

  if (!q) {
    resContainer.innerHTML = `
      <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 12px; letter-spacing: 0.08em;">Quick Links & Disciplines</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <a href="shop.html?cat=apparel" class="btn btn-glass btn-sm" onclick="closeSearchModal()"><i class="fas fa-vest text-cyan"></i> Cyber Jackets</a>
        <a href="shop.html?cat=gloves" class="btn btn-glass btn-sm" onclick="closeSearchModal()"><i class="fas fa-mitten text-cyan"></i> Carbon Gloves</a>
        <a href="shop.html?cat=packs" class="btn btn-glass btn-sm" onclick="closeSearchModal()"><i class="fas fa-box text-cyan"></i> Modular Luggage</a>
        <a href="shop.html?cat=masks" class="btn btn-glass btn-sm" onclick="closeSearchModal()"><i class="fas fa-mask text-cyan"></i> Climate Shields</a>
      </div>
    `;
    return;
  }

  const matches = STORE_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.categoryLabel.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    resContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.2rem; margin-bottom: 12px; display: block;"></i>
        <h4>No gear matching "${query}"</h4>
        <p style="font-size: 0.88rem; margin-top: 6px;">Try searching for jacket, carbon, gloves, or luggage.</p>
      </div>
    `;
    return;
  }

  resContainer.innerHTML = matches.map(p => `
    <a href="product.html?id=${p.id}" class="glass-card" style="display: flex; align-items: center; gap: 16px; padding: 12px 18px; margin-bottom: 8px;" onclick="closeSearchModal()">
      <img src="${p.img}" alt="${p.name}" style="width: 52px; height: 52px; border-radius: var(--radius-sm); object-fit: cover;" loading="lazy" decoding="async" onerror="this.src='assets/images/jacket_cyber.jpg'">
      <div style="flex: 1;">
        <div style="font-size: 0.72rem; color: var(--accent-cyan); text-transform: uppercase; font-weight: 700;">${p.categoryLabel}</div>
        <div style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--text-pure);">${p.name}</div>
        <div style="font-family: var(--font-display); font-weight: 800; color: var(--accent-cyan); font-size: 0.9rem;">${formatPKR(p.price)}</div>
      </div>
      <i class="fas fa-chevron-right text-muted"></i>
    </a>
  `).join('');
}

/* ── DOM Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateBadges();

  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape') {
      closeSearchModal();
      closeCartDrawer();
    }
  });

  const searchInput = document.getElementById('searchModalInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }
});
