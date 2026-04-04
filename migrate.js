const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        return;
    }
    
    db.serialize(() => {
        db.run("ALTER TABLE registrations ADD COLUMN teamId TEXT UNIQUE", (err) => {
            if (err) console.log("teamId result:", err.message);
            else console.log("Successfully added teamId column");
        });
        db.run("ALTER TABLE registrations ADD COLUMN membersJSON TEXT", (err) => {
            if (err) console.log("membersJSON result:", err.message);
            else console.log("Successfully added membersJSON column");
        });
    });
    
    // Close db after running commands
    db.close((err) => {
        if (err) console.error("Error closing db:", err.message);
        else console.log("Database connection closed gracefully.");
    });
});
