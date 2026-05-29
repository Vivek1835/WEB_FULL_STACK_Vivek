// JavaScript for Ironvow Shop - Handles user interactions, dynamic content loading, and API communication
window.userFavourites = [];

function hideLoginIfLoggedIn() {
    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const loginItem = document.getElementById('login-nav-item');
                if (loginItem) loginItem.style.display = 'none';
            }
        });
}

function showLogin() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabButtons = document.querySelectorAll('.tab-button');

    if (!loginForm || !signupForm || tabButtons.length < 2) return;

    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    tabButtons[0].classList.add('active');
    tabButtons[1].classList.remove('active');
}

function showSignup() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabButtons = document.querySelectorAll('.tab-button');

    if (!loginForm || !signupForm || tabButtons.length < 2) return;

    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    tabButtons[0].classList.remove('active');
    tabButtons[1].classList.add('active');
}

function initIndexPage() {
    if (!document.getElementById('login-form')) return;
    showLogin();
}

function initContactPage() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We\'ll get back to you soon.');
    });
}

function initNewsPage() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    fetch('/api/news')
        .then(res => res.json())
        .then(articles => {
            newsGrid.innerHTML = '';

            if (!articles || articles.length === 0) {
                newsGrid.innerHTML = '<p style="color: var(--text-secondary);">No news available right now.</p>';
                return;
            }

            articles.forEach(article => {
                const item = document.createElement('div');
                item.className = 'news-item';
                item.style.cursor = 'pointer';
                item.onclick = () => window.open(article.url, '_blank');

                const img = article.image
                    ? `<img src="${article.image}" alt="${article.title}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:0.8rem;">`
                    : `<div class="news-box"></div>`;

                item.innerHTML = `
                    ${img}
                    <p class="news-description">${article.title}</p>
                    <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.3rem;">
                        ${article.source.name} · ${new Date(article.publishedAt).toLocaleDateString()}
                    </p>
                `;
                newsGrid.appendChild(item);
            });
        })
        .catch(() => {
            newsGrid.innerHTML = '<p style="color: var(--text-secondary);">Failed to load news. Try again later.</p>';
        });
}

function initCartPage() {
    const cartList = document.getElementById('cart-game-list');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!cartList) return;

    fetch('/api/cart/items')
        .then(res => res.json())
        .then(data => {
            if (data.message === 'not logged in') {
                cartList.innerHTML = '<p style="color: var(--text-secondary);">Please <a href="index.html" style="color: var(--accent-primary);">login</a> to see your cart!</p>';
                return;
            }

            if (data.length === 0) {
                cartList.innerHTML = '<p style="color: var(--text-secondary);">Your cart is empty! <a href="home.html" style="color: var(--accent-primary);">Browse games</a></p>';
                return;
            }

            cartList.innerHTML = '';
            let subtotal = 0;

            data.forEach(item => {
                subtotal += parseFloat(item.price);

                const row = document.createElement('div');
                row.className = 'game-item';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.innerHTML = `
                    <span>${item.title} - $${parseFloat(item.price).toFixed(2)}</span>
                    <button onclick="removeFromCart(${item.game_id})" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; font-size:18px;" title="Remove from cart">✕</button>
                `;
                cartList.appendChild(row);
            });

            const tax = subtotal * 0.08;
            const grandTotal = subtotal + tax;

            const subtotalEl = document.getElementById('subtotal');
            const taxEl = document.getElementById('tax');
            const grandTotalEl = document.getElementById('grand-total');

            if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
            if (taxEl) taxEl.textContent = tax.toFixed(2);
            if (grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);
        });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('Checkout coming soon!');
        });
    }
}

function initHomePage() {
    const trendingGrid = document.getElementById('trending-grid');
    const freeGrid = document.getElementById('free-grid');
    if (!trendingGrid || !freeGrid) return;

    fetch('/api/favourites')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                window.userFavourites = data.map(f => f.game_id);
            }
            loadGames();
        });
}

function loadGames() {
    const trendingGrid = document.getElementById('trending-grid');
    const freeGrid = document.getElementById('free-grid');
    if (!trendingGrid || !freeGrid) return;

    fetch('/api/games')
        .then(res => res.json())
        .then(games => {
            trendingGrid.innerHTML = '';
            freeGrid.innerHTML = '';

            games.forEach(game => {
                const isFav = window.userFavourites.includes(game.id);
                const heartIcon = isFav ? '♥' : '♡';

                const card = `
                    <div class="sale-item" onclick="window.open('${game.steam_url}', '_blank')">
                        <img class="game-img" src="${game.image_url}" alt="${game.title}">
                        <p class="game-name">${game.title}</p>
                        <p class="sale-price">${game.price == 0 ? 'FREE' : '$' + game.price}</p>
                        <div class="card-buttons">
                            <button class="fav-btn" id="fav-${game.id}" onclick="toggleFavourite(event, ${game.id})" title="Add to favourites" style="color:#ff69b4;">${heartIcon}</button>
                            <button class="cart-btn" onclick="addToCart(event, ${game.id})" title="Add to cart">🛒</button>
                        </div>
                    </div>`;

                if (game.price == 0) {
                    freeGrid.innerHTML += card;
                } else {
                    trendingGrid.innerHTML += card;
                }
            });
        });
}

function initProductsPage() {
    const saleGrid = document.getElementById('sale-grid');
    if (!saleGrid) return;

    fetch('/api/favourites')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                window.userFavourites = data.map(f => f.game_id);
            }
            loadSaleGames();
        });
}

function loadSaleGames() {
    const grid = document.getElementById('sale-grid');
    if (!grid) return;

    fetch('/api/sale-games')
        .then(res => res.json())
        .then(games => {
            grid.innerHTML = '';

            if (!games || games.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary);">No deals available right now.</p>';
                return;
            }

            games.forEach(game => {
                const discount = Math.round((1 - game.sale_price / game.price) * 100);
                const isFav = window.userFavourites.includes(game.id);
                const heartIcon = isFav ? '♥' : '♡';

                const card = document.createElement('div');
                card.className = 'sale-item';
                card.onclick = () => window.open(game.steam_url, '_blank');
                card.innerHTML = `
                    <img class="game-img" src="${game.image_url}" alt="${game.title}">
                    <div style="position:relative;">
                        <span style="
                            background: #e74c3c;
                            color: white;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 0.8rem;
                            font-weight: bold;
                            margin: 0.5rem 1.2rem;
                            display: inline-block;
                        ">-${discount}%</span>
                    </div>
                    <p class="game-name">${game.title}</p>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin: 0 1.2rem 0.5rem 1.2rem;">
                        <span style="color: var(--text-secondary); text-decoration: line-through; font-size: 0.9rem;">$${parseFloat(game.price).toFixed(2)}</span>
                        <span class="sale-price">$${parseFloat(game.sale_price).toFixed(2)}</span>
                    </div>
                    <div class="card-buttons">
                        <button class="fav-btn" id="fav-${game.id}" onclick="toggleFavourite(event, ${game.id})" title="Add to favourites" style="color:#ff69b4;">${heartIcon}</button>
                        <button class="cart-btn" onclick="addToCart(event, ${game.id})" title="Add to cart">🛒</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        });
}

function toggleFavourite(event, gameId) {
    event.stopPropagation();
    fetch('/api/favourite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === 'not logged in') {
            alert('Please login to add favourites!');
        } else if (data.message === 'added') {
            event.target.innerHTML = '♥';
            event.target.style.color = '#ff69b4';
            if (!window.userFavourites.includes(gameId)) {
                window.userFavourites.push(gameId);
            }
        } else {
            event.target.innerHTML = '♡';
            event.target.style.color = '#ff69b4';
            window.userFavourites = window.userFavourites.filter(id => id !== gameId);
        }
    });
}

function addToCart(event, gameId) {
    event.stopPropagation();
    fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === 'not logged in') {
            alert('Please login to add to cart!');
        } else if (data.message === 'already in cart') {
            alert('Already in your cart!');
        } else {
            alert('Added to cart!');
        }
    });
}

function removeFromCart(gameId) {
    fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === 'removed') {
            location.reload();
        }
    });
}

function initMysidePage() {
    if (!document.getElementById('logged-in-content')) return;

    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const loginItem = document.getElementById('login-nav-item');
                if (loginItem) loginItem.style.display = 'none';
                const loggedIn = document.getElementById('logged-in-content');
                if (loggedIn) loggedIn.style.display = 'block';
                loadProfile();
                loadFavourites();
                loadCart();
            } else {
                const notLoggedIn = document.getElementById('not-logged-in');
                if (notLoggedIn) notLoggedIn.style.display = 'block';
            }
        });
}

function showSection(name) {
    const profile = document.getElementById('section-profile');
    const favourites = document.getElementById('section-favourites');
    const cart = document.getElementById('section-cart');

    if (profile) profile.style.display = 'none';
    if (favourites) favourites.style.display = 'none';
    if (cart) cart.style.display = 'none';

    const target = document.getElementById('section-' + name);
    if (target) target.style.display = 'block';
}

function loadProfile() {
    fetch('/api/user')
        .then(res => res.json())
        .then(data => {
            if (data.message === 'not logged in') return;
            const username = document.getElementById('profile-username');
            const email = document.getElementById('profile-email');
            const avatar = document.getElementById('profile-avatar');

            if (username) username.textContent = data.username;
            if (email) email.textContent = data.email;
            if (avatar) avatar.textContent = data.username.charAt(0).toUpperCase();
        });
}

function loadFavourites() {
    const grid = document.getElementById('favourites-grid');
    if (!grid) return;

    fetch('/api/favourites/full')
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary);">No favourite games yet! Heart a game on the home page.</p>';
                return;
            }

            grid.innerHTML = '';
            data.forEach(game => {
                const card = document.createElement('div');
                card.className = 'sale-item';
                card.style.cursor = 'pointer';
                card.onclick = () => window.open(game.steam_url, '_blank');
                card.innerHTML = `
                    <img class="game-img" src="${game.image_url}" alt="${game.title}">
                    <p class="game-name">${game.title}</p>
                    <p class="sale-price">${game.price == 0 ? 'FREE' : '$' + parseFloat(game.price).toFixed(2)}</p>
                `;
                grid.appendChild(card);
            });
        });
}

function loadCart() {
    const list = document.getElementById('cart-list');
    if (!list) return;

    fetch('/api/cart/items')
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                list.innerHTML = '<p style="color: var(--text-secondary);">Your cart is empty!</p>';
                const totalEl = document.getElementById('cart-total');
                if (totalEl) totalEl.textContent = '0.00';
                return;
            }

            list.innerHTML = '';
            let total = 0;

            data.forEach(game => {
                total += parseFloat(game.price);
                const item = document.createElement('div');
                item.className = 'game-item';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.innerHTML = `
                    <span>🛒 ${game.title}</span>
                    <span style="color: var(--accent-primary);">$${parseFloat(game.price).toFixed(2)}</span>
                `;
                list.appendChild(item);
            });

            const totalEl = document.getElementById('cart-total');
            if (totalEl) totalEl.textContent = total.toFixed(2);
        });
}

function initLibraryPage() {
    const libraryGrid = document.getElementById('library-games-grid');
    if (!libraryGrid) return;

    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const loginItem = document.getElementById('login-nav-item');
                if (loginItem) loginItem.style.display = 'none';
                const libraryContent = document.getElementById('library-content');
                if (libraryContent) libraryContent.style.display = 'block';
                loadLibrary();
            } else {
                const notLoggedIn = document.getElementById('not-logged-in');
                if (notLoggedIn) notLoggedIn.style.display = 'block';
            }
        });
}

function loadLibrary() {
    fetch('/api/favourites/full')
        .then(res => res.json())
        .then(games => {
            const grid = document.getElementById('library-games-grid');
            if (!grid) return;

            if (!Array.isArray(games) || games.length === 0) {
                grid.innerHTML = `
                    <div style="color: var(--text-secondary); padding:1rem;">
                        <p>Your library is empty!</p>
                        <p style="font-size:0.9rem; margin-top:0.5rem;">Heart games on the home page to add them to your library.</p>
                        <a href="home.html" class="btn" style="display:inline-block; margin-top:1rem;">Browse Games</a>
                    </div>`;
                return;
            }

            grid.innerHTML = '';
            games.forEach(game => {
                const box = document.createElement('div');
                box.className = 'library-game-box';
                box.style.cursor = 'pointer';
                box.style.padding = '0';
                box.style.overflow = 'hidden';
                box.style.position = 'relative';
                box.onclick = () => showGameDetails(game);
                box.innerHTML = `
                    <img src="${game.image_url}" alt="${game.title}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
                    <div style="
                        position:absolute;
                        bottom:0;
                        left:0;
                        right:0;
                        background: rgba(0,0,0,0.7);
                        padding:0.4rem 0.6rem;
                    ">
                        <div class="game-label">${game.title}</div>
                    </div>
                `;
                grid.appendChild(box);
            });
        });
}

function showGameDetails(game) {
    const title = document.getElementById('detail-title');
    const placeholder = document.getElementById('detail-placeholder');
    const img = document.getElementById('detail-image');
    const genreEl = document.getElementById('detail-genre');
    const priceEl = document.getElementById('detail-price');
    const steamBtn = document.getElementById('detail-steam-btn');

    if (title) title.textContent = game.title;
    if (placeholder) placeholder.style.display = 'none';
    if (img) {
        img.src = game.image_url;
        img.alt = game.title;
        img.style.display = 'block';
    }
    if (genreEl) {
        genreEl.style.display = 'block';
        const span = genreEl.querySelector('span');
        if (span) span.textContent = game.genre || 'N/A';
    }
    if (priceEl) {
        priceEl.style.display = 'block';
        const span = priceEl.querySelector('span');
        if (span) span.textContent = game.price == 0 ? 'FREE' : '$' + parseFloat(game.price).toFixed(2);
    }
    if (steamBtn) {
        steamBtn.href = game.steam_url;
        steamBtn.style.display = 'block';
    }
}

function initAllPages() {
    hideLoginIfLoggedIn();
    initIndexPage();
    initContactPage();
    initNewsPage();
    initCartPage();
    initHomePage();
    initProductsPage();
    initMysidePage();
    initLibraryPage();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPages);
} else {
    initAllPages();
}
