const CART_KEY = "utech_cart";

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product) {
    const cart = getCart();

    const existing = cart.find(item => item.name === product.name);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name: product.name,
            category: product.category,
            price: Number(product.price),
            image: product.image,
            quantity: 1
        });
    }

    saveCart(cart);
    showCartNotice(`${product.name} added to cart`);
}

function removeFromCart(productName) {
    const cart = getCart().filter(item => item.name !== productName);
    saveCart(cart);
    renderCart();
}

function updateQuantity(productName, change) {
    const cart = getCart();
    const product = cart.find(item => item.name === productName);

    if (!product) return;

    product.quantity += change;

    if (product.quantity <= 0) {
        const updatedCart = cart.filter(item => item.name !== productName);
        saveCart(updatedCart);
    } else {
        saveCart(cart);
    }

    renderCart();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    renderCart();
}

function getCartTotal() {
    return getCart().reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}

function getCartItemCount() {
    return getCart().reduce(
        (total, item) => total + item.quantity,
        0
    );
}

function updateCartCount() {
    const count = getCartItemCount();

    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = count;
        element.hidden = count === 0;
    });
}

function showCartNotice(message) {
    let notice = document.querySelector(".cart-notice");

    if (!notice) {
        notice = document.createElement("div");
        notice.className = "cart-notice";
        document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.classList.add("show");

    clearTimeout(notice.hideTimer);

    notice.hideTimer = setTimeout(() => {
        notice.classList.remove("show");
    }, 2200);
}

function setupAddToCartButtons() {
    document.querySelectorAll(".shop-product-card .buy-button").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".shop-product-card");

            if (!card) return;

            const product = {
                name: card.dataset.name,
                category: card.dataset.category,
                price: card.dataset.price,
                image: card.dataset.image
            };

            addToCart(product);

            button.textContent = "Added ✓";

            setTimeout(() => {
                button.textContent = "Add to Cart";
            }, 1400);
        });
    });
}

function renderCart() {
    const container = document.getElementById("cartItems");

    if (!container) return;

    const cart = getCart();
    const emptyState = document.getElementById("emptyCart");
    const cartContent = document.getElementById("cartContent");

    if (cart.length === 0) {
        if (emptyState) emptyState.hidden = false;
        if (cartContent) cartContent.hidden = true;
        return;
    }

    if (emptyState) emptyState.hidden = true;
    if (cartContent) cartContent.hidden = false;

    container.innerHTML = cart.map(item => `
        <article class="cart-item">
            <div class="cart-item-image">
                <img
                    src="${item.image}"
                    alt="${item.name}"
                    loading="lazy"
                >
            </div>

            <div class="cart-item-details">
                <span class="cart-item-category">
                    ${item.category}
                </span>

                <h3>${item.name}</h3>

                <strong class="cart-item-price">
                    $${item.price.toFixed(2)}
                </strong>
            </div>

            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button
                        type="button"
                        class="quantity-btn"
                        onclick="updateQuantity('${item.name.replace(/'/g, "\\'")}', -1)"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        class="quantity-btn"
                        onclick="updateQuantity('${item.name.replace(/'/g, "\\'")}', 1)"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>

                <strong class="cart-item-total">
                    $${(item.price * item.quantity).toFixed(2)}
                </strong>

                <button
                    type="button"
                    class="remove-cart-item"
                    onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}')"
                >
                    Remove
                </button>
            </div>
        </article>
    `).join("");

    const subtotal = document.getElementById("cartSubtotal");

    if (subtotal) {
        subtotal.textContent = `$${getCartTotal().toFixed(2)}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupAddToCartButtons();
    updateCartCount();
    renderCart();
});
