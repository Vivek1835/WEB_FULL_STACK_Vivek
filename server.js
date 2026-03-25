const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./db');

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

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});