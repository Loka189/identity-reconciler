# 🔗 Identity Reconciler

A REST API that links different customer contacts (email/phone) to a single identity. When a customer uses different emails or phone numbers across purchases, this service reconciles them into one unified contact.

**Live URL:** `https://identity-reconciler-hmw3.onrender.com`

---

## How It Works

Every contact is either **primary** or **secondary**.

```
Customer places Order 1 → email: tony@stark.com, phone: 1111111 → Primary (id: 1)
Customer places Order 2 → email: tony@stark.com, phone: 2222222 → Secondary (id: 2, linked to 1)
Customer places Order 3 → email: pepper@stark.com, phone: 3333333 → Primary (id: 3)
Customer places Order 4 → email: pepper@stark.com, phone: 1111111 → Merge! (id: 3 becomes secondary of id: 1)
```

Three cases are handled:
- **New customer** → creates a primary contact
- **Existing customer with new info** → creates a secondary contact
- **Two separate customers linked** → merges them (oldest stays primary)

---

## API

### `POST /identify`

**Request:**

```json
{
  "email": "tony@stark.com",
  "phoneNumber": "1111111"
}
```

At least one of `email` or `phoneNumber` is required.

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["tony@stark.com", "pepper@stark.com"],
    "phoneNumbers": ["1111111", "2222222", "3333333"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Run Locally

```bash
git clone https://github.com/Loka189/identity-reconciler.git
cd identity-reconciler
npm install
npm run dev
```

Server starts at `http://localhost:3000`

---

## Test It

Send a POST request using cURL or Postman:

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "9876543"}'
```

---

## Tech Stack

- **Node.js** + **Express**
- **SQLite** (via better-sqlite3)
- **Render** (deployment)

---

## DB Schema

```sql
CREATE TABLE Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (linkedId) REFERENCES Contact(id)
);
```

---

## Project Structure

```
src/
├── config/
│   └── db.js              # SQLite connection + table setup
├── routes/
│   └── identify.js         # POST /identify route
├── services/
│   └── contactService.js   # Core reconciliation logic
└── index.js                # Express server entry point
```