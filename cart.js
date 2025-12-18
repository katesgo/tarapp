class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('tara_cart')) || [];
        this.total = 0;
        this.init();
    }

    init() {
        this.calculateTotal();
        this.renderCartCount();
        this.setupEventListeners();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.saveCart();
        this.updateUI();
        this.showNotification('Item added to cart');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateUI();
    }

    updateQuantity(productId, change) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateUI();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateUI();
    }

    calculateTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    saveCart() {
        this.calculateTotal();
        localStorage.setItem('tara_cart', JSON.stringify(this.items));
    }

    updateUI() {
        this.renderCartCount();
        this.renderCartModal();
    }

    renderCartCount() {
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const badges = document.querySelectorAll('.cart-count-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        });
    }

    renderCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const paypalButtonContainer = document.getElementById('paypal-button-container');

        if (!cartItemsContainer || !cartTotalElement) return;

        cartItemsContainer.innerHTML = '';

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Your cart is empty.</p>';
            if (paypalButtonContainer) paypalButtonContainer.innerHTML = '';
        } else {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'flex justify-between items-center border-b border-gray-100 py-3';
                itemElement.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
                        <div>
                            <h4 class="text-sm font-medium text-blue-900">${item.name}</h4>
                            <p class="text-xs text-gray-500">$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="text-gray-400 hover:text-blue-900" onclick="cart.updateQuantity('${item.id}', -1)">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                        <span class="text-sm font-medium w-4 text-center">${item.quantity}</span>
                        <button class="text-gray-400 hover:text-blue-900" onclick="cart.updateQuantity('${item.id}', 1)">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
            });

            // Render PayPal Button if not already rendered and cart is not empty
            if (paypalButtonContainer && paypalButtonContainer.innerHTML === '') {
                this.renderPayPalButton();
            }
        }

        cartTotalElement.textContent = `$${this.total.toFixed(2)}`;
    }

    renderPayPalButton() {
        if (window.paypal) {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                currency_code: 'CAD',
                                value: this.total.toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: (data, actions) => {
                    return actions.order.capture().then((details) => {
                        this.clearCart();
                        this.showNotification(`Transaction completed by ${details.payer.name.given_name}`);
                        document.getElementById('cart-modal').classList.add('hidden');
                    });
                },
                onError: (err) => {
                    console.error('PayPal Error:', err);
                    this.showNotification('An error occurred with PayPal. Please try again.');
                },
                onCancel: (data) => {
                    console.log('PayPal payment cancelled', data);
                    this.showNotification('Payment cancelled.');
                }
            }).render('#paypal-button-container');
        } else {
            console.error('PayPal SDK not loaded');
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = '<p class="text-red-500 text-sm text-center">PayPal is currently unavailable. Please try again later.</p>';
            }
        }
    }

    showNotification(message) {
        // Simple toast notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-blue-900 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-full z-50';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.remove('translate-y-full');
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-y-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    setupEventListeners() {
        const cartBtnDesktop = document.getElementById('cart-button-desktop');
        const cartBtnMobile = document.getElementById('cart-button-mobile');
        const closeCartBtn = document.getElementById('close-cart');
        const cartModal = document.getElementById('cart-modal');

        const openCart = (e) => {
            if (e) e.preventDefault();
            this.updateUI();
            cartModal.classList.remove('hidden');
        };

        if (cartBtnDesktop) cartBtnDesktop.addEventListener('click', openCart);
        if (cartBtnMobile) cartBtnMobile.addEventListener('click', openCart);

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => {
                cartModal.classList.add('hidden');
            });
        }

        // Close on click outside
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target === cartModal) {
                    cartModal.classList.add('hidden');
                }
            });
        }
    }
}

const cart = new ShoppingCart();
