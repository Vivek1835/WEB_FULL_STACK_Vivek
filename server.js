const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// In-memory user storage (for demo; use database in production)
let users = [];

// Load users from file if exists
const usersFile = path.join(__dirname, 'users.json');
if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

// Routes
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).send('User already exists');
    }
    
    // Add new user
    const newUser = { username, email, password };
    users.push(newUser);
    
    // Save to file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    // Redirect to home
    res.redirect('/home.html');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).send('Invalid credentials');
    }
    
    // Redirect to home
    res.redirect('/home.html');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});