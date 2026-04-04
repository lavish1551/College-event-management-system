const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like the HTML)
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        // Create table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId TEXT UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            track TEXT NOT NULL,
            membersJSON TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            } else {
                console.log("Registrations table ready.");
            }
        });
    }
});

// Helper function to generate unique ID
function generateTeamId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KRMU-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Registration Endpoint
app.post('/register', (req, res) => {
    const { name, email, phone, track, members } = req.body;

    if (!name || !email || !phone || !track) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    // Verify email domain
    if (!email.toLowerCase().endsWith('@krmu.edu.in')) {
        return res.status(400).json({ error: "Only @krmu.edu.in emails are allowed." });
    }
    
    // Verify dynamic member email domains
    if (members && Array.isArray(members)) {
        for (let mem of members) {
            if (!mem.email || !mem.email.toLowerCase().endsWith('@krmu.edu.in')) {
                return res.status(400).json({ error: `Team member '${mem.name}' must also use an @krmu.edu.in email address.` });
            }
        }
    }

    const teamId = generateTeamId();
    const membersJSON = members ? JSON.stringify(members) : "[]";

    const sql = `INSERT INTO registrations (teamId, name, email, phone, track, membersJSON) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [teamId, name, email, phone, track, membersJSON], function(err) {
        if (err) {
            console.error("Error inserting data:", err.message);
            return res.status(500).json({ error: "Failed to save to database." });
        }
        console.log(`New registration added with Team ID: ${teamId}`);
        res.status(201).json({ message: "Registration successful!", teamId: teamId });
    });
});

// Get all registrations
app.get('/registrations', (req, res) => {
    const sql = `SELECT * FROM registrations ORDER BY timestamp DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching data:", err.message);
            return res.status(500).json({ error: "Failed to retrieve records." });
        }
        res.json(rows);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`To view the website, open http://localhost:${PORT}/finalideasproject.html in your browser.`);
    console.log(`To see all registrations (API), visit http://localhost:${PORT}/registrations`);
    console.log(`========================================================`);
});
