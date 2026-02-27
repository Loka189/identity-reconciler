const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Contact (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      phoneNumber     TEXT,
      email           TEXT,
      linkedId        INTEGER REFERENCES Contact(id),
      linkPrecedence  TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
      createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
      deletedAt       TEXT
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_email ON Contact(email);
    CREATE INDEX IF NOT EXISTS idx_phone ON Contact(phoneNumber);
    CREATE INDEX IF NOT EXISTS idx_linked ON Contact(linkedId);
  `);

  console.log('✅ Database initialized');
}

module.exports = { db, initializeDatabase };