document.addEventListener('DOMContentLoaded', function () {
    const CART_KEY = 'beanBoutiqueCart';

    function slugify(text) {
        return (text || '')
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function parseMoney(text) {
        const cleaned = (text || '').replace(/,/g, '');
        const match = cleaned.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
        return match ? parseFloat(match[1]) : null;
    }

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch (error) {
            return [];
        }
    }

    function setCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function updateFloatingCartCount() {
        const countNode = document.querySelector('.cart-count');
        if (!countNode) return;
        const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
        countNode.textContent = count > 0 ? String(count) : '';
    }

    function animateCartPulse() {
        const floatingCart = document.querySelector('#oom_floating_cart .oom_float');
        if (!floatingCart) return;
        floatingCart.classList.remove('cart-bump');
        void floatingCart.offsetWidth;
        floatingCart.classList.add('cart-bump');
    }

    function flyToCart(fromElement) {
        const floatingCart = document.querySelector('#oom_floating_cart .oom_float');
        if (!floatingCart || !fromElement) return;

        const sourceRect = fromElement.getBoundingClientRect();
        const targetRect = floatingCart.getBoundingClientRect();
        const clone = fromElement.cloneNode(true);

        clone.classList.add('cart-fly-clone');
        clone.style.left = sourceRect.left + 'px';
        clone.style.top = sourceRect.top + 'px';
        clone.style.width = sourceRect.width + 'px';
        clone.style.height = sourceRect.height + 'px';
        document.body.appendChild(clone);

        const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
        const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

        requestAnimationFrame(function () {
            clone.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.12)';
            clone.style.opacity = '0.1';
        });

        clone.addEventListener('transitionend', function () {
            clone.remove();
            animateCartPulse();
        }, { once: true });
    }

    function addToCart(item) {
        const cart = getCart();
        const existing = cart.find(function (cartItem) { return cartItem.id === item.id; });
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                image: item.image,
                desc: item.desc
            });
        }
        setCart(cart);
        updateFloatingCartCount();
    }

    function wireAddToCartButtons() {
        const buttons = Array.from(document.querySelectorAll('.product-action')).filter(function (button) {
            return /add\s*to\s*cart/i.test(button.textContent || '');
        });

        buttons.forEach(function (button) {
            if (button.dataset.cartBound === 'true') return;

            const card = button.closest('.product-preview');
            const nameNode = card ? card.querySelector('h2') : null;
            const priceNode = card ? card.querySelector('.product-price span, .product-price') : null;
            const imageNode = card ? card.querySelector('.product-image') : null;
            const descNode = card ? card.querySelector('.product-description') : null;

            const name = nameNode ? nameNode.textContent.trim() : 'Coffee Item';
            const price = parseMoney(priceNode ? priceNode.textContent : '');
            if (price === null || Number.isNaN(price)) return;

            const pageKey = window.location.pathname.split('/').pop().replace('.html', '').toLowerCase();
            const id = button.dataset.id || (pageKey + '-' + slugify(name));
            const imageStyle = imageNode ? (imageNode.style.backgroundImage || imageNode.style.background || '') : '';
            const desc = descNode ? descNode.textContent.trim() : '';

            button.dataset.cartBound = 'true';
            button.addEventListener('click', function () {
                addToCart({ id: id, name: name, price: price, image: imageStyle, desc: desc });
                flyToCart(imageNode || button);

                const originalText = button.textContent;
                button.textContent = 'Added';
                setTimeout(function () {
                    button.textContent = originalText;
                }, 900);
            });
        });
    }

    function formatMoney(value) {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    function renderShoppingCartPage() {
        const cartPlaceholder = document.getElementById('cartPlaceholder');
        const cartTotal = document.getElementById('cartTotal');
        const clearCart = document.getElementById('clearCart');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!cartPlaceholder || !cartTotal || !clearCart || !checkoutBtn) return;

        function renderCart() {
            const cart = getCart();
            if (!cart.length) {
                cartPlaceholder.className = 'cart-items cart-empty';
                cartPlaceholder.textContent = 'Your cart is empty. Add a coffee or brewing item to get started.';
                cartTotal.innerHTML = '<span>Total: $0.00</span>';
                updateFloatingCartCount();
                return;
            }

            cartPlaceholder.className = 'cart-items';
            cartPlaceholder.innerHTML = '';

            cart.forEach(function (item) {
                const row = document.createElement('div');
                row.className = 'cart-item';

                const thumb = document.createElement('div');
                thumb.className = 'cart-thumb';
                if (item.image) {
                    if (item.image.indexOf('url(') !== -1) {
                        thumb.style.backgroundImage = item.image.replace(/^url\((.*)\)$/, 'url($1)');
                        thumb.style.backgroundSize = 'cover';
                        thumb.style.backgroundPosition = 'center';
                    } else {
                        thumb.style.background = item.image;
                    }
                }

                const details = document.createElement('div');
                details.className = 'cart-details';
                details.innerHTML = '<strong>' + item.name + '</strong>' + (item.desc ? '<span class="cart-desc">' + item.desc + '</span>' : '');

                const meta = document.createElement('div');
                meta.className = 'cart-meta';
                meta.innerHTML =
                    '<div class="cart-controls">' +
                    '<button class="cart-control" data-id="' + item.id + '" data-action="decrease" type="button"><i class="bi bi-dash"></i></button>' +
                    '<span>' + item.quantity + '</span>' +
                    '<button class="cart-control" data-id="' + item.id + '" data-action="increase" type="button"><i class="bi bi-plus"></i></button>' +
                    '</div>' +
                    '<span>' + formatMoney(item.price) + '</span>' +
                    '<span>' + formatMoney(item.price * item.quantity) + '</span>';

                row.appendChild(thumb);
                row.appendChild(details);
                row.appendChild(meta);
                cartPlaceholder.appendChild(row);
            });

            const total = cart.reduce(function (sum, item) {
                return sum + item.price * item.quantity;
            }, 0);
            cartTotal.innerHTML = '<span>Total: ' + formatMoney(total) + '</span>';
            updateFloatingCartCount();
        }

        cartPlaceholder.addEventListener('click', function (event) {
            const button = event.target.closest('.cart-control');
            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;
            const cart = getCart();
            const item = cart.find(function (entry) { return entry.id === id; });
            if (!item) return;

            if (action === 'increase') item.quantity += 1;
            if (action === 'decrease') item.quantity -= 1;

            setCart(cart.filter(function (entry) { return entry.quantity > 0; }));
            renderCart();
        });

        clearCart.addEventListener('click', function () {
            setCart([]);
            renderCart();
        });

        checkoutBtn.addEventListener('click', function () {
            alert('Checkout is coming soon. Your selections are saved in the cart for later.');
        });

        renderCart();
    }

    function initSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('siteSearchInput');
        const searchResults = document.getElementById('searchResults');
        const searchToggles = document.querySelectorAll('.search-toggle');
        const currentPage = window.location.pathname.split('/').pop();

        if (!searchOverlay || !searchInput || !searchResults) {
            return;
        }

        const pageItems = [
            { title: 'Home', url: 'HomePage.html', type: 'page', description: 'Featured coffee, latest offers, and shop navigation.' },
            { title: 'Coffee Selection', url: 'CoffeeSelection.html', type: 'page', description: 'Browse all coffee blends and roast profiles.' },
            { title: 'Brewing Equipment', url: 'BrewingEquipment.html', type: 'page', description: 'Shop kettles, grinders, and brewing tools.' },
            { title: 'Events & Workshops', url: 'Events_and_Workshops.html', type: 'page', description: 'View tastings, classes, and coffee events.' },
            { title: 'Special Offers & Subscriptions', url: 'Special_Offers_and_Subscriptions.html', type: 'page', description: 'See offers, subscriptions, and gift bundles.' },
            { title: 'Shopping Cart', url: 'Shopping_Cart.html', type: 'page', description: 'Your cart and checkout summary.' }
        ];

        const productItems = [
            { title: 'Colombian Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Balanced almond, caramel, and citrus notes.', targetTitle: 'Colombian Roast' },
            { title: 'Espresso Blend', url: 'CoffeeSelection.html', type: 'product', description: 'Rich crema and classic espresso sweetness.', targetTitle: 'Espresso Blend' },
            { title: 'Dark Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Bold, smoky flavour with full-body depth.', targetTitle: 'Dark Roast' },
            { title: 'Decaf Reserve', url: 'CoffeeSelection.html', type: 'product', description: 'Smooth, low-acid coffee with rich aroma.', targetTitle: 'Decaf Reserve' },
            { title: 'Cold Brew', url: 'CoffeeSelection.html', type: 'product', description: 'Easy drinking cold brew with bright, mellow notes.', targetTitle: 'Cold Brew' },
            { title: 'Seasonal Blend', url: 'CoffeeSelection.html', type: 'product', description: 'A limited edition roast with festive spice.', targetTitle: 'Seasonal Blend' },
            { title: 'Single Origin Light', url: 'CoffeeSelection.html', type: 'product', description: 'Bright, floral cup with clean finish.', targetTitle: 'Single Origin Light' },
            { title: 'Mocha Blend', url: 'CoffeeSelection.html', type: 'product', description: 'Chocolatey notes for rich lattes and mochas.', targetTitle: 'Mocha Blend' },
            { title: 'French Press Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Full-bodied roast made for press and filter brewing.', targetTitle: 'French Press Roast' },
            { title: 'Filtered Bold', url: 'CoffeeSelection.html', type: 'product', description: 'Crisp, bold coffee for pour-over and drip machines.', targetTitle: 'Filtered Bold' },
            { title: 'Holiday Spice', url: 'CoffeeSelection.html', type: 'product', description: 'Warm cinnamon and nutmeg flavours for the season.', targetTitle: 'Holiday Spice' },
            { title: 'Signature House', url: 'CoffeeSelection.html', type: 'product', description: 'Our everyday blend with smooth caramel notes.', targetTitle: 'Signature House' },
            { title: 'Gooseneck Kettle', url: 'BrewingEquipment.html', type: 'product', description: 'Precision pour control for pour-over brewing and slow extraction.', targetTitle: 'Gooseneck Kettle' },
            { title: 'Burr Grinder', url: 'BrewingEquipment.html', type: 'product', description: 'Consistent grind quality for espresso and filter brewing.', targetTitle: 'Burr Grinder' },
            { title: 'French Press', url: 'BrewingEquipment.html', type: 'product', description: 'Rich, full-bodied coffee extraction with easy press brewing.', targetTitle: 'French Press' },
            { title: 'Espresso Machine', url: 'BrewingEquipment.html', type: 'product', description: 'Brew cafe-style espresso shots and milk-based drinks.', targetTitle: 'Espresso Machine' },
            { title: 'Pour-over Dripper', url: 'BrewingEquipment.html', type: 'product', description: 'Clean, delicate brews with precise water flow.', targetTitle: 'Pour-over Dripper' },
            { title: 'Cold Brew Jar', url: 'BrewingEquipment.html', type: 'product', description: 'Smooth cold brew at home with a reusable jar.', targetTitle: 'Cold Brew Jar' },
            { title: 'Milk Frother', url: 'BrewingEquipment.html', type: 'product', description: 'Quickly froth milk for cappuccinos and lattes.', targetTitle: 'Milk Frother' },
            { title: 'Scale & Timer', url: 'BrewingEquipment.html', type: 'product', description: 'Measure coffee and steep times for repeatable brews.', targetTitle: 'Scale & Timer' },
            { title: 'Signature Tasting Session', url: 'Events_and_Workshops.html', type: 'event', description: 'Explore single-origin coffees with guided tasting notes.', targetTitle: 'Signature Tasting Session' },
            { title: 'Brewing Masterclass', url: 'Events_and_Workshops.html', type: 'event', description: 'Hands-on training for pour-over, French press and espresso.', targetTitle: 'Brewing Masterclass' },
            { title: 'Meet the Roaster', url: 'Events_and_Workshops.html', type: 'event', description: 'Behind-the-scenes conversation about sourcing and roasting.', targetTitle: 'Meet the Roaster' },
            { title: 'Latte Art Lab', url: 'Events_and_Workshops.html', type: 'event', description: 'Learn milk texture and latte art techniques.', targetTitle: 'Latte Art Lab' }
        ];

        const searchItems = pageItems.concat(productItems);

        Array.from(document.querySelectorAll('.product-preview .product-copy h2')).forEach(function (titleElement) {
            titleElement.dataset.searchTitle = titleElement.textContent.trim();
        });

        function openSearch() {
            searchOverlay.classList.remove('hidden');
            searchOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            searchInput.value = '';
            searchInput.focus();
            renderResults('');
        }

        function closeSearch() {
            searchOverlay.classList.add('hidden');
            searchOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        function getSearchMatches(query) {
            const lowerQuery = query.trim().toLowerCase();
            if (!lowerQuery) {
                return searchItems.slice(0, 6);
            }

            return searchItems.filter(function (item) {
                const titleMatch = item.title.toLowerCase().includes(lowerQuery);
                const descriptionMatch = item.description.toLowerCase().includes(lowerQuery);
                return titleMatch || descriptionMatch;
            }).slice(0, 10);
        }

        function renderResults(query) {
            const results = getSearchMatches(query);
            if (!results.length) {
                searchResults.innerHTML = '<div class="search-empty">No matches found. Try another keyword.</div>';
                return;
            }

            searchResults.innerHTML = results.map(function (item) {
                const icon = item.type === 'page' ? '📄' : item.type === 'event' ? '🎟️' : '☕';
                return (
                    '<a href="' + item.url + '" class="search-result-item" data-type="' + item.type + '" data-target="' + (item.targetTitle || '') + '" data-url="' + item.url + '">' +
                    '<strong>' + icon + ' ' + item.title + '</strong>' +
                    '<span>' + (item.description || (item.type === 'product' ? 'Tap to view this product on this page.' : '')) + '</span>' +
                    '</a>'
                );
            }).join('');
        }

        searchInput.addEventListener('input', function () {
            renderResults(this.value);
        });

        searchOverlay.addEventListener('click', function (event) {
            if (event.target === searchOverlay || event.target.closest('.search-close')) {
                closeSearch();
            }
        });

        searchResults.addEventListener('click', function (event) {
            const result = event.target.closest('.search-result-item');
            if (!result) {
                return;
            }

            const itemType = result.dataset.type;
            const itemUrl = result.dataset.url;
            event.preventDefault();
            closeSearch();
            window.location.href = itemUrl;
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !searchOverlay.classList.contains('hidden')) {
                closeSearch();
            }
        });

        searchToggles.forEach(function (toggle) {
            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                openSearch();
            });
        });

        renderResults('');
    }

    wireAddToCartButtons();
    renderShoppingCartPage();
    updateFloatingCartCount();
    window.addEventListener('storage', updateFloatingCartCount);
    initSearch();
});
