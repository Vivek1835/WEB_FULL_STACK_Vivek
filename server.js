const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./db');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Session setup
app.use(session({
  secret: 'gaming123',
  resave: false,
  saveUninitialized: false
}));

// REGISTER
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if email already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      return res.status(400).send('Email already registered');
    }

    // Hash the password before saving
    const hash = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash],
      (err) => {
        if (err) return res.status(500).send('Something went wrong');
        res.redirect('/home.html');
      }
    );
  });
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length === 0) {
      return res.status(401).send('Invalid email or password');
    }

    const user = results[0];

    // Compare password with hashed version
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).send('Invalid email or password');
    }

    // Save user in session
    req.session.user = { id: user.id, username: user.username, email: user.email };
    res.redirect('/home.html');
  });
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/index.html');
});

// GET all games from database
app.get('/api/games', (req, res) => {
  db.query('SELECT * FROM games', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to load games' });
    res.json(results);
  });
});

// ADD / REMOVE favourite
app.post('/api/favourite', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;
  const { gameId } = req.body;

  // Check if already favourited
  db.query('SELECT * FROM favourites WHERE user_id = ? AND game_id = ?', [userId, gameId], (err, results) => {
    if (results.length > 0) {
      // Already exists - remove it
      db.query('DELETE FROM favourites WHERE user_id = ? AND game_id = ?', [userId, gameId], () => {
        res.json({ message: 'removed' });
      });
    } else {
      // Add to favourites
      db.query('INSERT INTO favourites (user_id, game_id) VALUES (?, ?)', [userId, gameId], () => {
        res.json({ message: 'added' });
      });
    }
  });
});

// GET favourites for logged in user
app.get('/api/favourites', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;

  // Get all game IDs that this user has favourited
  db.query(
    'SELECT game_id FROM favourites WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to load favourites' });
      res.json(results);
    }
  );
});

// ADD TO CART
app.post('/api/cart', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;
  const { gameId } = req.body;

  // Check if already in cart
  db.query('SELECT * FROM cart_items WHERE user_id = ? AND game_id = ?', [userId, gameId], (err, results) => {
    if (results.length > 0) {
      return res.json({ message: 'already in cart' });
    }
    // Add to cart
    db.query('INSERT INTO cart_items (user_id, game_id) VALUES (?, ?)', [userId, gameId], () => {
      res.json({ message: 'added' });
    });
  });
});

// GET cart items for logged in user
app.get('/api/cart/items', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;

  // Join cart_items with games to get full game details
  db.query(
    'SELECT cart_items.game_id, games.title, games.price FROM cart_items JOIN games ON cart_items.game_id = games.id WHERE cart_items.user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to load cart' });
      res.json(results);
    }
  );
});

// REMOVE game from cart
app.post('/api/cart/remove', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;
  const { gameId } = req.body;

  // Delete the cart item from database
  db.query(
    'DELETE FROM cart_items WHERE user_id = ? AND game_id = ?',
    [userId, gameId],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to remove' });
      res.json({ message: 'removed' });
    }
  );
});

// GET logged in user info
app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  res.json(req.session.user);
});

// GET full favourite games details for logged in user
app.get('/api/favourites/full', (req, res) => {
  if (!req.session.user) return res.json({ message: 'not logged in' });
  const userId = req.session.user.id;

  // Join favourites with games to get full game details
  db.query(
    'SELECT games.id, games.title, games.price, games.image_url, games.steam_url FROM favourites JOIN games ON favourites.game_id = games.id WHERE favourites.user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to load favourites' });
      res.json(results);
    }
  );
});

// CHECK if user is logged in (for navbar)
app.get('/api/session', (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, username: req.session.user.username });
});

// GET real gaming news from NewsAPI
app.get('/api/news', async (req, res) => {
  try {
    const response = await fetch('https://newsapi.org/v2/everything?q=gaming&sortBy=publishedAt&pageSize=11&apiKey=8dbc56579f71817190c879a02222ac0b');
    const data = await response.json();
    res.json(data.articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});