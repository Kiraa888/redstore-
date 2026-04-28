// --- STATE ---
const state = {
    cart: JSON.parse(localStorage.getItem('redstore_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('redstore_wishlist')) || [],
    filter: { category: "All", search: "" }
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
    modalBody: document.getElementById('modalBody')
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
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === "success" ? '<i class="fas fa-check-circle" style="color: #00ff88;"></i>' : '<i class="fas fa-exclamation-circle" style="color: #ff3131;"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Global Error Handler for Images
const fallbackImg = "https://placehold.co/600x400/121212/ff3131?text=Image+Not+Found";
window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') e.target.src = fallbackImg;
}, true);

// --- RENDERING FUNCTIONS ---
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
};

const renderCartUI = () => {
    DOM.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (state.cart.length === 0) {
        DOM.cartItems.innerHTML = `<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Your cart is empty.</p></div>`;
        DOM.cartTotal.textContent = '$0.00';
        return;
    }

    DOM.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
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
        renderProducts(); // Re-render grid to update heart icons
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
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if(state.cart.length === 0) return showToast("Cart is empty", "error");
    showToast("Proceeding to Secure Checkout...");
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderCartUI();
    renderWishlistUI();
    
    // Render loading skeletons
    DOM.grid.innerHTML = Array(4).fill('<div class="skeleton skeleton-card"></div>').join('');
    
    // Simulate network delay
    setTimeout(() => renderProducts(), 500);
});
