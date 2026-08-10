document.addEventListener('DOMContentLoaded', function () {
    const CART_KEY = 'beanBoutiqueCart';

    function initNavDropdowns() {
        const navList = document.querySelector('.side-menu .navbar-nav');
        if (!navList) return;

        const dropdownMap = {
            'CoffeeSelection.html': [
                { label: 'All Coffee', url: 'CoffeeSelection.html' },
                { label: 'Light Roast', url: 'CoffeeSelection.html?filter=light' },
                { label: 'Dark Roast', url: 'CoffeeSelection.html?filter=dark' },
                { label: 'Decaf', url: 'CoffeeSelection.html?filter=decaf' },
                { label: 'Seasonal', url: 'CoffeeSelection.html?filter=seasonal' },
                { label: 'Single Origin', url: 'CoffeeSelection.html?filter=single-origin' }
            ],
            'BrewingEquipment.html': [
                { label: 'All Equipment', url: 'BrewingEquipment.html' },
                { label: 'Espresso', url: 'BrewingEquipment.html?filter=espresso' },
                { label: 'Pour-over', url: 'BrewingEquipment.html?filter=pour-over' },
                { label: 'Cold Brew', url: 'BrewingEquipment.html?filter=cold-brew' },
                { label: 'Milk', url: 'BrewingEquipment.html?filter=milk' },
                { label: 'Precision', url: 'BrewingEquipment.html?filter=precision' }
            ],
            'Events_and_Workshops.html': [
                { label: 'All Events', url: 'Events_and_Workshops.html#events-catalog' },
                { label: 'Signature Tasting Session', url: 'Events_and_Workshops.html#event-signature-tasting-session' },
                { label: 'Brewing Masterclass', url: 'Events_and_Workshops.html#event-brewing-masterclass' },
                { label: 'Meet the Roaster', url: 'Events_and_Workshops.html#event-meet-the-roaster' },
                { label: 'Latte Art Lab', url: 'Events_and_Workshops.html#event-latte-art-lab' },
                { label: 'Event Registration', url: 'Events_and_Workshops.html#registration' }
            ]
        };

        const parentItems = Array.from(navList.querySelectorAll('.nav-item')).map(function (item) {
            return { item: item, link: item.querySelector('.nav-link[href]') };
        }).filter(function (entry) {
            return !!entry.link;
        });

        function closeAllDropdowns(exceptItem) {
            parentItems.forEach(function (entry) {
                if (!entry.item.classList.contains('has-dropdown') || entry.item === exceptItem) return;
                entry.item.classList.remove('open');
                const toggle = entry.item.querySelector('.nav-dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        }

        parentItems.forEach(function (entry) {
            const rawHref = entry.link.getAttribute('href') || '';
            const href = rawHref.split('#')[0].split('?')[0];
            const dropdownItems = dropdownMap[href];
            if (!dropdownItems || entry.item.dataset.dropdownReady === 'true') return;

            entry.item.classList.add('has-dropdown');

            const parentRow = document.createElement('div');
            parentRow.className = 'nav-parent-row';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'nav-dropdown-toggle';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Toggle ' + entry.link.textContent.trim() + ' options');
            toggle.innerHTML = '<span aria-hidden="true">&#9662;</span>';

            const dropdownList = document.createElement('ul');
            dropdownList.className = 'nav-dropdown-menu';

            dropdownItems.forEach(function (dropdownItem) {
                const child = document.createElement('li');
                const childLink = document.createElement('a');
                childLink.className = 'nav-dropdown-link';
                childLink.href = dropdownItem.url;
                childLink.textContent = dropdownItem.label;
                child.appendChild(childLink);
                dropdownList.appendChild(child);
            });

            const originalLink = entry.link;
            entry.item.insertBefore(parentRow, originalLink);
            parentRow.appendChild(originalLink);
            parentRow.appendChild(toggle);
            entry.item.appendChild(dropdownList);

            function toggleDropdown(forceOpen) {
                const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !entry.item.classList.contains('open');
                closeAllDropdowns(shouldOpen ? entry.item : null);
                entry.item.classList.toggle('open', shouldOpen);
                toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            }

            originalLink.addEventListener('click', function (event) {
                if (!entry.item.classList.contains('open')) {
                    event.preventDefault();
                    toggleDropdown(true);
                }
            });

            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleDropdown();
            });

            entry.item.dataset.dropdownReady = 'true';
        });

        document.addEventListener('click', function (event) {
            if (!event.target.closest('.nav-item.has-dropdown')) {
                closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeAllDropdowns();
            }
        });
    }

    function applyCatalogFilterFromUrl() {
        const query = new URLSearchParams(window.location.search);
        const filterValue = query.get('filter');
        if (!filterValue) return;

        const escapedFilter = window.CSS && typeof window.CSS.escape === 'function'
            ? window.CSS.escape(filterValue)
            : filterValue.replace(/"/g, '\\"');

        const chip = document.querySelector('.catalog-chip[data-filter="' + escapedFilter + '"]');
        if (!chip) return;

        chip.click();
    }

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

    function deriveImageClassFromItem(item) {
        const suffix = (item && item.id ? item.id.split('-').slice(1).join('-') : '') || slugify(item && item.name ? item.name : '');
        if (!suffix) return '';

        const exceptionMap = {
            'scale-and-timer': 'img-scale-timer'
        };

        if (exceptionMap[suffix]) {
            return exceptionMap[suffix];
        }

        return 'img-' + suffix;
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
            if (!existing.image && item.image) existing.image = item.image;
            if (!existing.imageClass && item.imageClass) existing.imageClass = item.imageClass;
            if (!existing.desc && item.desc) existing.desc = item.desc;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                image: item.image,
                imageClass: item.imageClass,
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
            const imageClass = imageNode
                ? Array.from(imageNode.classList).find(function (className) { return className.indexOf('img-') === 0; })
                : '';
            const computedImage = imageNode ? window.getComputedStyle(imageNode).backgroundImage : '';
            const imageStyle = imageNode
                ? (computedImage && computedImage !== 'none' ? computedImage : (imageNode.style.backgroundImage || imageNode.style.background || ''))
                : '';
            const desc = descNode ? descNode.textContent.trim() : '';

            button.dataset.cartBound = 'true';
            button.addEventListener('click', function () {
                addToCart({ id: id, name: name, price: price, image: imageStyle, imageClass: imageClass || '', desc: desc });
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
                const thumbClass = item.imageClass || deriveImageClassFromItem(item);
                if (thumbClass) {
                    thumb.classList.add(thumbClass);
                }
                if (item.image) {
                    if (item.image.indexOf('url(') !== -1) {
                        thumb.style.backgroundImage = item.image;
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
        const searchPanel = searchOverlay ? searchOverlay.querySelector('.search-panel') : null;
        const pageScope = document.querySelector('main.page-content') || document.body;

        if (!searchOverlay || !searchInput || !searchResults || !searchPanel) {
            return;
        }

        const pageSearchState = {
            hits: [],
            activeIndex: -1,
            hintTimer: null,
            hintWordIndex: 0,
            hintCharIndex: 0,
            hintDeleting: false
        };

        const hintPhrases = [
            'espresso blend',
            'latte art',
            'free delivery',
            'gooseneck kettle'
        ];

        const hintNode = document.createElement('p');
        hintNode.className = 'search-animated-hint';
        hintNode.innerHTML = 'Find on this page: <span id="animatedPageHint"></span>';

        const controlsNode = document.createElement('div');
        controlsNode.className = 'search-on-page-controls';
        controlsNode.innerHTML =
            '<button type="button" class="search-nav-btn" id="pageSearchPrev">Previous match</button>' +
            '<button type="button" class="search-nav-btn" id="pageSearchNext">Next match</button>' +
            '<p id="pageSearchStatus" class="search-mode-note">Type at least 2 characters to highlight matches on this page.</p>';

        searchInput.insertAdjacentElement('afterend', hintNode);
        hintNode.insertAdjacentElement('afterend', controlsNode);

        const animatedPageHint = document.getElementById('animatedPageHint');
        const pageSearchPrev = document.getElementById('pageSearchPrev');
        const pageSearchNext = document.getElementById('pageSearchNext');
        const pageSearchStatus = document.getElementById('pageSearchStatus');

        const pageItems = [
            { title: 'Home', url: 'HomePage.html', type: 'page', description: 'Featured coffee, latest offers, and shop navigation.' },
            { title: 'Coffee Selection', url: 'CoffeeSelection.html', type: 'page', description: 'Browse all coffee blends and roast profiles.' },
            { title: 'Brewing Equipment', url: 'BrewingEquipment.html', type: 'page', description: 'Shop kettles, grinders, and brewing tools.' },
            { title: 'Events & Workshops', url: 'Events_and_Workshops.html', type: 'page', description: 'View tastings, classes, and coffee events.' },
            { title: 'Special Offers & Subscriptions', url: 'Special_Offers_and_Subscriptions.html', type: 'page', description: 'See offers, subscriptions, and gift bundles.' },
            { title: 'Shopping Cart', url: 'Shopping_Cart.html', type: 'page', description: 'Your cart and checkout summary.' }
        ];

        const productItems = [
            { title: 'Colombian Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Balanced almond, caramel, and citrus notes.' },
            { title: 'Espresso Blend', url: 'CoffeeSelection.html', type: 'product', description: 'Rich crema and classic espresso sweetness.' },
            { title: 'Dark Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Bold, smoky flavour with full-body depth.' },
            { title: 'Decaf Reserve', url: 'CoffeeSelection.html', type: 'product', description: 'Smooth, low-acid coffee with rich aroma.' },
            { title: 'Cold Brew', url: 'CoffeeSelection.html', type: 'product', description: 'Easy drinking cold brew with bright, mellow notes.' },
            { title: 'Seasonal Blend', url: 'CoffeeSelection.html', type: 'product', description: 'A limited edition roast with festive spice.' },
            { title: 'Single Origin Light', url: 'CoffeeSelection.html', type: 'product', description: 'Bright, floral cup with clean finish.' },
            { title: 'Mocha Blend', url: 'CoffeeSelection.html', type: 'product', description: 'Chocolatey notes for rich lattes and mochas.' },
            { title: 'French Press Roast', url: 'CoffeeSelection.html', type: 'product', description: 'Full-bodied roast made for press and filter brewing.' },
            { title: 'Filtered Bold', url: 'CoffeeSelection.html', type: 'product', description: 'Crisp, bold coffee for pour-over and drip machines.' },
            { title: 'Holiday Spice', url: 'CoffeeSelection.html', type: 'product', description: 'Warm cinnamon and nutmeg flavours for the season.' },
            { title: 'Signature House', url: 'CoffeeSelection.html', type: 'product', description: 'Our everyday blend with smooth caramel notes.' },
            { title: 'Gooseneck Kettle', url: 'BrewingEquipment.html', type: 'product', description: 'Precision pour control for pour-over brewing and slow extraction.' },
            { title: 'Burr Grinder', url: 'BrewingEquipment.html', type: 'product', description: 'Consistent grind quality for espresso and filter brewing.' },
            { title: 'French Press', url: 'BrewingEquipment.html', type: 'product', description: 'Rich, full-bodied coffee extraction with easy press brewing.' },
            { title: 'Espresso Machine', url: 'BrewingEquipment.html', type: 'product', description: 'Brew cafe-style espresso shots and milk-based drinks.' },
            { title: 'Pour-over Dripper', url: 'BrewingEquipment.html', type: 'product', description: 'Clean, delicate brews with precise water flow.' },
            { title: 'Cold Brew Jar', url: 'BrewingEquipment.html', type: 'product', description: 'Smooth cold brew at home with a reusable jar.' },
            { title: 'Milk Frother', url: 'BrewingEquipment.html', type: 'product', description: 'Quickly froth milk for cappuccinos and lattes.' },
            { title: 'Scale & Timer', url: 'BrewingEquipment.html', type: 'product', description: 'Measure coffee and steep times for repeatable brews.' },
            { title: 'Signature Tasting Session', url: 'Events_and_Workshops.html', type: 'event', description: 'Explore single-origin coffees with guided tasting notes.' },
            { title: 'Brewing Masterclass', url: 'Events_and_Workshops.html', type: 'event', description: 'Hands-on training for pour-over, French press and espresso.' },
            { title: 'Meet the Roaster', url: 'Events_and_Workshops.html', type: 'event', description: 'Behind-the-scenes conversation about sourcing and roasting.' },
            { title: 'Latte Art Lab', url: 'Events_and_Workshops.html', type: 'event', description: 'Learn milk texture and latte art techniques.' }
        ];

        const searchItems = pageItems.concat(productItems);

        function escapeRegExp(text) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function clearPageHighlights() {
            const marks = Array.from(pageScope.querySelectorAll('.page-search-hit'));
            marks.forEach(function (mark) {
                const parent = mark.parentNode;
                if (!parent) return;
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            });

            pageSearchState.hits = [];
            pageSearchState.activeIndex = -1;
            pageSearchPrev.disabled = true;
            pageSearchNext.disabled = true;
        }

        function updatePageSearchStatus(message) {
            pageSearchStatus.textContent = message;
        }

        function setActivePageHit(index) {
            if (!pageSearchState.hits.length) return;

            const boundedIndex = (index + pageSearchState.hits.length) % pageSearchState.hits.length;
            pageSearchState.activeIndex = boundedIndex;

            pageSearchState.hits.forEach(function (hit) {
                hit.classList.remove('current');
            });

            const activeHit = pageSearchState.hits[boundedIndex];
            activeHit.classList.add('current');
            activeHit.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

            updatePageSearchStatus(
                (boundedIndex + 1) + ' of ' + pageSearchState.hits.length + ' matches on this page.'
            );
        }

        function highlightMatchesOnPage(query) {
            const trimmedQuery = query.trim();
            clearPageHighlights();

            if (trimmedQuery.length < 2) {
                updatePageSearchStatus('Type at least 2 characters to highlight matches on this page.');
                return;
            }

            const regex = new RegExp(escapeRegExp(trimmedQuery), 'gi');
            const walker = document.createTreeWalker(pageScope, NodeFilter.SHOW_TEXT, {
                acceptNode: function (textNode) {
                    const parent = textNode.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (!textNode.nodeValue || !textNode.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('#searchOverlay')) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT;
                    if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|OPTION|BUTTON)$/i.test(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const textNodes = [];
            while (walker.nextNode()) {
                textNodes.push(walker.currentNode);
            }

            textNodes.forEach(function (node) {
                const text = node.nodeValue;
                if (!text) return;

                let match = null;
                let lastIndex = 0;
                let found = false;
                const fragment = document.createDocumentFragment();
                regex.lastIndex = 0;

                while ((match = regex.exec(text)) !== null) {
                    found = true;
                    const matchIndex = match.index;
                    const matchedText = match[0];

                    if (matchIndex > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
                    }

                    const mark = document.createElement('mark');
                    mark.className = 'page-search-hit';
                    mark.textContent = matchedText;
                    fragment.appendChild(mark);
                    pageSearchState.hits.push(mark);

                    lastIndex = matchIndex + matchedText.length;
                }

                if (!found) return;

                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                }

                node.parentNode.replaceChild(fragment, node);
            });

            if (!pageSearchState.hits.length) {
                updatePageSearchStatus('No matches found on this page.');
                return;
            }

            pageSearchPrev.disabled = false;
            pageSearchNext.disabled = false;
            setActivePageHit(0);
        }

        function stopAnimatedHint() {
            if (pageSearchState.hintTimer) {
                window.clearInterval(pageSearchState.hintTimer);
                pageSearchState.hintTimer = null;
            }
        }

        function startAnimatedHint() {
            if (!animatedPageHint || pageSearchState.hintTimer) return;

            pageSearchState.hintTimer = window.setInterval(function () {
                const phrase = hintPhrases[pageSearchState.hintWordIndex];

                if (!pageSearchState.hintDeleting) {
                    pageSearchState.hintCharIndex += 1;
                } else {
                    pageSearchState.hintCharIndex -= 1;
                }

                animatedPageHint.textContent = phrase.slice(0, pageSearchState.hintCharIndex);

                if (!pageSearchState.hintDeleting && pageSearchState.hintCharIndex >= phrase.length) {
                    pageSearchState.hintDeleting = true;
                } else if (pageSearchState.hintDeleting && pageSearchState.hintCharIndex <= 0) {
                    pageSearchState.hintDeleting = false;
                    pageSearchState.hintWordIndex = (pageSearchState.hintWordIndex + 1) % hintPhrases.length;
                }
            }, 90);
        }

        function openSearch() {
            searchOverlay.classList.remove('hidden');
            searchOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            searchInput.value = '';
            searchInput.focus();
            renderResults('');
            clearPageHighlights();
            updatePageSearchStatus('Type at least 2 characters to highlight matches on this page.');
            startAnimatedHint();
        }

        function closeSearch() {
            searchOverlay.classList.add('hidden');
            searchOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            clearPageHighlights();
            stopAnimatedHint();
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
                    '<a href="' + item.url + '" class="search-result-item" data-url="' + item.url + '">' +
                    '<strong>' + icon + ' ' + item.title + '</strong>' +
                    '<span>' + (item.description || (item.type === 'product' ? 'Tap to view this product on this page.' : '')) + '</span>' +
                    '</a>'
                );
            }).join('');
        }

        searchInput.addEventListener('input', function () {
            renderResults(this.value);
            highlightMatchesOnPage(this.value);
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

            const itemUrl = result.dataset.url;
            event.preventDefault();
            closeSearch();
            window.location.href = itemUrl;
        });

        pageSearchPrev.addEventListener('click', function () {
            if (!pageSearchState.hits.length) return;
            setActivePageHit(pageSearchState.activeIndex - 1);
        });

        pageSearchNext.addEventListener('click', function () {
            if (!pageSearchState.hits.length) return;
            setActivePageHit(pageSearchState.activeIndex + 1);
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
        updatePageSearchStatus('Type at least 2 characters to highlight matches on this page.');
    }

    wireAddToCartButtons();
    renderShoppingCartPage();
    updateFloatingCartCount();
    initNavDropdowns();
    applyCatalogFilterFromUrl();
    window.addEventListener('storage', updateFloatingCartCount);
    initSearch();
});
