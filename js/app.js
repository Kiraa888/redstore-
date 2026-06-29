// --- STATE ---
const state = {
    cart: JSON.parse(localStorage.getItem('redstore_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('redstore_wishlist')) || [],
    filter: { category: "All", search: "" },
    checkout: {
        step: 1,
        customer: { name: '', phone: '', altPhone: '', email: '' },
        address: { state: '', city: '', pincode: '', address: '', landmark: '' },
        payment: 'COD',
        orderId: null,
        placed: false
    }
};

// --- DOM ELEMENTS ---
const DOM = {
    grid: document.getElementById('productsGrid'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    cartCount: document.getElementById('cartCount'),
    wishlistCount: document.getElementById('wishlistCount'),
    cartSidebar: document.getElementById('cartSidebar'),
    wishlistSidebar: document.getElementById('wishlistSidebar'),
    wishlistItems: document.getElementById('wishlistItems'),
    modal: document.getElementById('productModal'),
    modalBody: document.getElementById('modalBody'),
    checkoutOverlay: document.getElementById('checkoutOverlay'),
    checkoutBody: document.getElementById('checkoutBody'),
    checkoutSteps: document.getElementById('checkoutSteps'),
    successOverlay: document.getElementById('successOverlay'),
    successDetails: document.getElementById('successDetails'),
    toastContainer: document.getElementById('toastContainer')
};

// --- UTILITIES ---
const saveStorage = () => {
    localStorage.setItem('redstore_cart', JSON.stringify(state.cart));
    localStorage.setItem('redstore_wishlist', JSON.stringify(state.wishlist));
};

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

const generateStars = (rating) => {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) html += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    return html;
};

const showToast = (message, type = "success") => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === "success" ? '<i class="fas fa-check-circle" style="color: #00ff88;"></i>' : '<i class="fas fa-exclamation-circle" style="color: #ff3131;"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Fallback image
const fallbackImg = "https://placehold.co/600x400/121212/ff3131?text=Image+Not+Found";
window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') e.target.src = fallbackImg;
}, true);

// --- GENERATE ORDER ID ---
function generateOrderId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `RS-${y}${m}${d}-${seq}`;
}

// --- BUILD WHATSAPP MESSAGE ---
function buildWhatsAppMessage(orderData) {
    const { customer, address, payment, cart, orderId, grandTotal, deliveryCharge, discount } = orderData;
    const items = cart.map(item =>
        `${item.name} (${item.size || 'N/A'}) × ${item.quantity}  —  ${formatPrice(item.price * item.quantity)}`
    ).join('\n');

    const message = `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏬 REDSTORE PREMIUM\n` +
        `📦 Order #${orderId}\n` +
        `📅 ${new Date().toLocaleString()}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 ${customer.name}\n` +
        `📞 ${customer.phone}\n` +
        `📧 ${customer.email || '—'}\n` +
        `🏠 ${address.address}, ${address.city}, ${address.state} - ${address.pincode}\n` +
        `📍 ${address.landmark || '—'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🛍️ PRODUCTS\n` +
        `${items}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 Subtotal: ${formatPrice(cart.reduce((s, i) => s + i.price * i.quantity, 0))}\n` +
        `📦 Delivery: ${formatPrice(deliveryCharge || 0)}\n` +
        `🎁 Discount: ${formatPrice(discount || 0)}\n` +
        `💳 Grand Total: ${formatPrice(grandTotal)}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💳 Payment: ${payment === 'COD' ? 'Cash on Delivery' : payment === 'UPI' ? 'UPI' : 'Online'}\n` +
        `📝 Notes: ${customer.notes || '—'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🙏 Thank you for your order!\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

    return encodeURIComponent(message);
}

// --- RENDERING FUNCTIONS (unchanged from original, but we keep them) ---
const renderProducts = () => {
    const filtered = productsData.filter(p => {
        const matchCat = state.filter.category === "All" || p.category === state.filter.category;
        const matchSearch = p.name.toLowerCase().includes(state.filter.search.toLowerCase());
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        DOM.grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-box-open"></i><p>No products found matching your criteria.</p></div>`;
        return;
    }

    DOM.grid.innerHTML = filtered.map(product => {
        const inWishlist = state.wishlist.includes(product.id);
        return `
            <div class="product-card" data-id="${product.id}" tabindex="0">
                <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-action="wishlist" data-id="${product.id}" aria-label="Toggle Wishlist">
                    <i class="${inWishlist ? 'fas' : 'far'} fa-heart" style="pointer-events: none;"></i>
                </button>
                <div class="product-image" data-action="modal" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <button class="btn btn-primary w-100" data-action="add-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');

    // Re-apply Vanilla Tilt
    document.querySelectorAll('.product-card').forEach(card => {
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(card, { max: 8, speed: 300, glare: true, 'max-glare': 0.2 });
        }
    });
};

const renderCartUI = () => {
    DOM.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (state.cart.length === 0) {
        DOM.cartItems.innerHTML = `<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Your cart is empty.</p></div>`;
        DOM.cartTotal.textContent = '$0.00';
        return;
    }

    DOM.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${item.name}</strong>
                    <button class="remove-btn" data-action="remove-item" data-id="${item.id}" aria-label="Remove item"><i class="fas fa-trash"></i></button>
                </div>
                <div style="color: var(--primary-color); margin-bottom: 8px;">${formatPrice(item.price)}</div>
                ${item.size ? `<span style="font-size: 0.8rem; color: var(--text-gray);">Size: ${item.size}</span>` : ''}
                <div class="qty-controls">
                    <button class="qty-btn" data-action="qty" data-id="${item.id}" data-val="-1"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" data-action="qty" data-id="${item.id}" data-val="1"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    DOM.cartTotal.textContent = formatPrice(total);
};

const renderWishlistUI = () => {
    DOM.wishlistCount.textContent = state.wishlist.length;

    if (state.wishlist.length === 0) {
        DOM.wishlistItems.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><p>Your wishlist is empty.</p></div>`;
        return;
    }

    const wishlistProducts = productsData.filter(p => state.wishlist.includes(p.id));

    DOM.wishlistItems.innerHTML = wishlistProducts.map(item => `
        <div class="cart-item">
            <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${item.name}</strong>
                    <button class="remove-btn" data-action="remove-wishlist-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
                <div style="color: var(--primary-color); margin-bottom: 8px;">${formatPrice(item.price)}</div>
                <button class="btn btn-outline w-100" style="padding: 0.5rem; font-size: 0.9rem;" data-action="add-cart" data-id="${item.id}">Move to Cart</button>
            </div>
        </div>
    `).join('');
};

const renderModal = (product) => {
    const sizes = [7, 8, 9, 10, 11, 12];
    DOM.modalBody.innerHTML = `
        <div class="modal-img-container">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-details">
            <span class="product-category">${product.category}</span>
            <h2>${product.name}</h2>
            <div class="rating">${generateStars(product.rating)} <span style="color: var(--text-gray); margin-left: 8px;">(${product.reviews} Reviews)</span></div>
            <h3 class="product-price" style="font-size: 2rem; margin: 10px 0;">${formatPrice(product.price)}</h3>
            <p style="color: var(--text-gray); line-height: 1.6;">Premium quality materials constructed for durability and everyday comfort. Fits true to size.</p>
            <div class="size-selector">
                ${sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('')}
            </div>
            <button class="btn btn-primary w-100" id="modalAddCartBtn" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    DOM.modal.classList.add('active');
};

// --- CHECKOUT LOGIC ---
function openCheckout() {
    if (state.cart.length === 0) {
        showToast("Cart is empty", "error");
        return;
    }
    state.checkout.step = 1;
    DOM.checkoutOverlay.classList.add('active');
    renderCheckoutStep(1);
}

function closeCheckout() {
    DOM.checkoutOverlay.classList.remove('active');
}

function renderCheckoutStep(step) {
    // Update steps UI
    document.querySelectorAll('.step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.toggle('active', s === step);
        el.classList.toggle('done', s < step);
    });

    let html = '';
    switch(step) {
        case 1:
            html = `
                <h3>Customer Details</h3>
                <div class="form-group"><label>Full Name *</label><input type="text" id="chkName" class="form-control" value="${state.checkout.customer.name}" required /></div>
                <div class="form-group"><label>Phone Number *</label><input type="tel" id="chkPhone" class="form-control" value="${state.checkout.customer.phone}" required /></div>
                <div class="form-group"><label>Alternate Phone</label><input type="tel" id="chkAltPhone" class="form-control" value="${state.checkout.customer.altPhone}" /></div>
                <div class="form-group"><label>Email</label><input type="email" id="chkEmail" class="form-control" value="${state.checkout.customer.email}" /></div>
                <button class="btn btn-primary" id="checkoutNext1">Next → Address</button>
            `;
            break;
        case 2:
            html = `
                <h3>Delivery Address</h3>
                <div class="form-group"><label>State *</label><input type="text" id="chkState" class="form-control" value="${state.checkout.address.state}" required /></div>
                <div class="form-group"><label>City *</label><input type="text" id="chkCity" class="form-control" value="${state.checkout.address.city}" required /></div>
                <div class="form-group"><label>PIN Code *</label><input type="text" id="chkPincode" class="form-control" value="${state.checkout.address.pincode}" required /></div>
                <div class="form-group"><label>Full Address *</label><textarea id="chkAddress" class="form-control" required>${state.checkout.address.address}</textarea></div>
                <div class="form-group"><label>Landmark</label><input type="text" id="chkLandmark" class="form-control" value="${state.checkout.address.landmark}" /></div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-outline" id="checkoutBack2">← Back</button>
                    <button class="btn btn-primary" id="checkoutNext2">Next → Payment</button>
                </div>
            `;
            break;
        case 3:
            const payment = state.checkout.payment;
            html = `
                <h3>Payment Method</h3>
                <div class="payment-options">
                    <label class="payment-option ${payment === 'COD' ? 'selected' : ''}">
                        <input type="radio" name="payment" value="COD" ${payment === 'COD' ? 'checked' : ''} /> Cash on Delivery
                    </label>
                    <label class="payment-option ${payment === 'UPI' ? 'selected' : ''}">
                        <input type="radio" name="payment" value="UPI" ${payment === 'UPI' ? 'checked' : ''} /> UPI Payment
                    </label>
                    <label class="payment-option ${payment === 'Online' ? 'selected' : ''}">
                        <input type="radio" name="payment" value="Online" ${payment === 'Online' ? 'checked' : ''} /> Pay Online (Card/NetBanking)
                    </label>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button class="btn btn-outline" id="checkoutBack3">← Back</button>
                    <button class="btn btn-primary" id="checkoutNext3">Review Order →</button>
                </div>
            `;
            break;
        case 4:
            // Build order summary
            const cart = state.cart;
            const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
            const deliveryCharge = 0; // free
            const discount = 0;
            const grandTotal = subtotal + deliveryCharge - discount;
            const orderId = generateOrderId();
            state.checkout.orderId = orderId;
            const itemsHTML = cart.map(item => `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}" width="50" height="50" />
                    <div><strong>${item.name}</strong> (${item.size || 'N/A'}) × ${item.quantity} <span style="color:var(--primary-color);">${formatPrice(item.price * item.quantity)}</span></div>
                </div>
            `).join('');
            html = `
                <h3>Order Summary</h3>
                <div class="order-summary">
                    ${itemsHTML}
                    <div class="order-totals">
                        <div>Subtotal: ${formatPrice(subtotal)}</div>
                        <div>Delivery: ${formatPrice(deliveryCharge)}</div>
                        <div>Discount: ${formatPrice(discount)}</div>
                        <div style="font-weight:700;font-size:1.3rem;color:var(--primary-color);">Grand Total: ${formatPrice(grandTotal)}</div>
                        <div style="font-size:0.9rem;color:var(--text-gray);">Payment: ${state.checkout.payment === 'COD' ? 'Cash on Delivery' : state.checkout.payment === 'UPI' ? 'UPI' : 'Online'}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-outline" id="checkoutBack4">← Back</button>
                    <button class="btn btn-primary" id="placeOrderBtn">Place Order</button>
                </div>
            `;
            break;
    }
    DOM.checkoutBody.innerHTML = html;

    // Attach event listeners for this step
    if (step === 1) {
        document.getElementById('checkoutNext1')?.addEventListener('click', () => {
            const name = document.getElementById('chkName').value.trim();
            const phone = document.getElementById('chkPhone').value.trim();
            if (!name || !phone) { showToast("Name and Phone are required", "error"); return; }
            state.checkout.customer = { name, phone, altPhone: document.getElementById('chkAltPhone').value.trim(), email: document.getElementById('chkEmail').value.trim() };
            state.checkout.step = 2;
            renderCheckoutStep(2);
        });
    } else if (step === 2) {
        document.getElementById('checkoutBack2')?.addEventListener('click', () => { state.checkout.step = 1; renderCheckoutStep(1); });
        document.getElementById('checkoutNext2')?.addEventListener('click', () => {
            const stateVal = document.getElementById('chkState').value.trim();
            const city = document.getElementById('chkCity').value.trim();
            const pincode = document.getElementById('chkPincode').value.trim();
            const address = document.getElementById('chkAddress').value.trim();
            if (!stateVal || !city || !pincode || !address) { showToast("All address fields are required", "error"); return; }
            state.checkout.address = { state: stateVal, city, pincode, address, landmark: document.getElementById('chkLandmark').value.trim() };
            state.checkout.step = 3;
            renderCheckoutStep(3);
        });
    } else if (step === 3) {
        document.getElementById('checkoutBack3')?.addEventListener('click', () => { state.checkout.step = 2; renderCheckoutStep(2); });
        document.querySelectorAll('input[name="payment"]').forEach(el => {
            el.addEventListener('change', (e) => {
                state.checkout.payment = e.target.value;
                // update UI selection
                document.querySelectorAll('.payment-option').forEach(opt => opt.classList.toggle('selected', opt.querySelector('input').checked));
            });
        });
        document.getElementById('checkoutNext3')?.addEventListener('click', () => {
            state.checkout.step = 4;
            renderCheckoutStep(4);
        });
    } else if (step === 4) {
        document.getElementById('checkoutBack4')?.addEventListener('click', () => { state.checkout.step = 3; renderCheckoutStep(3); });
        document.getElementById('placeOrderBtn')?.addEventListener('click', () => {
            // Place order
            const cart = state.cart;
            const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
            const deliveryCharge = 0;
            const discount = 0;
            const grandTotal = subtotal + deliveryCharge - discount;
            const orderId = state.checkout.orderId;
            const orderData = {
                customer: state.checkout.customer,
                address: state.checkout.address,
                payment: state.checkout.payment,
                cart: cart,
                orderId: orderId,
                grandTotal: grandTotal,
                deliveryCharge: deliveryCharge,
                discount: discount
            };
            // Store order in localStorage (optional)
            localStorage.setItem('redstore_last_order', JSON.stringify(orderData));
            // Show success
            closeCheckout();
            showSuccess(orderData);
            // Clear cart
            state.cart = [];
            saveStorage();
            renderCartUI();
            renderProducts();
        });
    }
}

function showSuccess(orderData) {
    const details = `
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
        <p><strong>Payment Method:</strong> ${orderData.payment === 'COD' ? 'Cash on Delivery' : orderData.payment === 'UPI' ? 'UPI' : 'Online'}</p>
        <p><strong>Total:</strong> ${formatPrice(orderData.grandTotal)}</p>
    `;
    DOM.successDetails.innerHTML = details;
    DOM.successOverlay.classList.add('active');

    // Store for WhatsApp
    window._lastOrder = orderData;
}

// --- EVENT LISTENERS ---

// Grid Interactions
DOM.grid.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const id = parseInt(target.dataset.id);
    const action = target.dataset.action;

    if (action === 'modal') {
        const product = productsData.find(p => p.id === id);
        if (product) renderModal(product);
    }
    
    if (action === 'add-cart') {
        const product = productsData.find(p => p.id === id);
        const existing = state.cart.find(i => i.id === id && !i.size); 
        if (existing) existing.quantity++;
        else state.cart.push({ ...product, quantity: 1 });
        
        saveStorage();
        renderCartUI();
        DOM.cartSidebar.classList.add('open');
        showToast(`Added ${product.name} to cart`);
    }

    if (action === 'wishlist') {
        const index = state.wishlist.indexOf(id);
        const isNowActive = target.classList.toggle('active');
        const icon = target.querySelector('i');
        
        if (index > -1) {
            state.wishlist.splice(index, 1);
            icon.classList.replace('fas', 'far');
            showToast("Removed from wishlist");
        } else {
            state.wishlist.push(id);
            icon.classList.replace('far', 'fas');
            showToast("Added to wishlist");
        }
        saveStorage();
        renderWishlistUI();
    }
});

// Modal Interactions
DOM.modal.addEventListener('click', (e) => {
    if (e.target === DOM.modal || e.target.closest('.modal-close')) DOM.modal.classList.remove('active');
    
    if (e.target.classList.contains('size-btn')) {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
    }

    if (e.target.id === 'modalAddCartBtn') {
        const selectedSize = document.querySelector('.size-btn.selected');
        if (!selectedSize) return showToast("Please select a size", "error");
        
        const id = parseInt(e.target.dataset.id);
        const size = selectedSize.dataset.size;
        const product = productsData.find(p => p.id === id);
        
        const existing = state.cart.find(i => i.id === id && i.size === size);
        if (existing) existing.quantity++;
        else state.cart.push({ ...product, quantity: 1, size });

        saveStorage();
        renderCartUI();
        DOM.modal.classList.remove('active');
        DOM.cartSidebar.classList.add('open');
        showToast(`Added ${product.name} (Size: ${size}) to cart`);
    }
});

// Cart Items
DOM.cartItems.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const id = parseInt(target.dataset.id);
    const action = target.dataset.action;

    if (action === 'remove-item') {
        state.cart = state.cart.filter(i => i.id !== id);
        showToast("Item removed");
    }
    if (action === 'qty') {
        const change = parseInt(target.dataset.val);
        const item = state.cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) state.cart = state.cart.filter(i => i.id !== id);
        }
    }
    saveStorage();
    renderCartUI();
});

// Wishlist Items
DOM.wishlistItems.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const id = parseInt(target.dataset.id);
    const action = target.dataset.action;

    if (action === 'remove-wishlist-item') {
        state.wishlist = state.wishlist.filter(item => item !== id);
        saveStorage();
        renderWishlistUI();
        renderProducts(); 
        showToast("Removed from wishlist");
    }

    if (action === 'add-cart') {
        const product = productsData.find(p => p.id === id);
        const existing = state.cart.find(i => i.id === id && !i.size); 
        if (existing) existing.quantity++;
        else state.cart.push({ ...product, quantity: 1 });
        
        state.wishlist = state.wishlist.filter(item => item !== id);
        
        saveStorage();
        renderCartUI();
        renderWishlistUI();
        renderProducts(); 
        
        DOM.wishlistSidebar.classList.remove('open');
        DOM.cartSidebar.classList.add('open');
        showToast(`Added ${product.name} to cart`);
    }
});

// Filters & Search
document.getElementById('filterContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-filter')) {
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        state.filter.category = e.target.dataset.category;
        renderProducts();
    }
});

let debounceTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        state.filter.search = e.target.value;
        renderProducts();
    }, 300);
});

// UI Toggles
document.getElementById('navSearchBtn').addEventListener('click', () => {
    document.getElementById('shop').scrollIntoView();
    document.getElementById('searchInput').focus();
});

document.getElementById('navCartBtn').addEventListener('click', () => {
    DOM.wishlistSidebar.classList.remove('open');
    DOM.cartSidebar.classList.toggle('open');
});
document.getElementById('closeCartBtn').addEventListener('click', () => DOM.cartSidebar.classList.remove('open'));

document.getElementById('navWishlistBtn').addEventListener('click', () => {
    DOM.cartSidebar.classList.remove('open');
    DOM.wishlistSidebar.classList.toggle('open');
});
document.getElementById('closeWishlistBtn').addEventListener('click', () => DOM.wishlistSidebar.classList.remove('open'));

document.getElementById('shopNowBtn').addEventListener('click', () => document.getElementById('shop').scrollIntoView());
document.getElementById('exploreDropsBtn').addEventListener('click', () => document.getElementById('shop').scrollIntoView());
document.getElementById('aboutToShopBtn').addEventListener('click', () => document.getElementById('shop').scrollIntoView());

// Contact Form
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Message Sent! We will get back to you soon.');
    e.target.reset();
});

// Checkout
document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckout);
// Close checkout on overlay click
DOM.checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.checkoutOverlay) closeCheckout();
});

// Success actions
document.getElementById('continueShoppingBtn').addEventListener('click', () => {
    DOM.successOverlay.classList.remove('active');
});
document.getElementById('whatsappOrderBtn').addEventListener('click', () => {
    const order = window._lastOrder;
    if (!order) { showToast("No order data", "error"); return; }
    const msg = buildWhatsAppMessage(order);
    const phone = "918123456789"; // Replace with store owner's WhatsApp number
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
});

// Mobile menu toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
});

// --- INITIALIZATION WITH GSAP, LENIS, SCROLLTRIGGER ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Lenis Smooth Scroll
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // 2. GSAP & ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animations
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero-title .line-1", { y: 100, opacity: 0, duration: 1.2, delay: 0.2 })
      .from(".hero-title .line-2", { y: 100, opacity: 0, duration: 1.2 }, "-=0.8")
      .from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.8 }, "-=0.6")
      .from(".hero-desc", { y: 30, opacity: 0, duration: 0.8 }, "-=0.4")
      .from(".btn-group", { y: 30, opacity: 0, duration: 0.8 }, "-=0.4")
      .from(".hero-shoe", { scale: 0.8, opacity: 0, rotation: 20, duration: 1.2 }, "-=1.2")
      .from(".scroll-hint", { opacity: 0, y: 20, duration: 1 }, "-=0.5");

    // Parallax on mouse move
    document.querySelector('.hero-visual').addEventListener('mousemove', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to('.hero-shoe', { x: x * 30, y: y * 20, rotation: -15 + x * 5, duration: 1, ease: "power2.out" });
        gsap.to('.hero-glow', { x: x * 20, y: y * 20, duration: 1, ease: "power2.out" });
    });

    // Navbar hide/show on scroll
    let lastScroll = 0;
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current > 100) {
            if (current > lastScroll) navbar.style.transform = 'translateY(-100%)';
            else navbar.style.transform = 'translateY(0)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        lastScroll = current;
    });

    // Animate products on scroll
    gsap.utils.toArray('.product-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none none" },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.05,
            ease: "power3.out"
        });
    });

    // About section animation
    gsap.from('.about-grid', {
        scrollTrigger: { trigger: '.about-grid', start: "top 80%" },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Contact form animation
    gsap.from('.contact-container', {
        scrollTrigger: { trigger: '.contact-container', start: "top 80%" },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // 3. Render initial UI
    renderCartUI();
    renderWishlistUI();
    // Render products with skeleton
    DOM.grid.innerHTML = Array(4).fill('<div class="skeleton skeleton-card"></div>').join('');
    setTimeout(() => renderProducts(), 500);

    // 4. Vanilla Tilt on product cards (already applied after render)
});
