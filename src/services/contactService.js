const { db } = require('../config/db');

function findMatchingContacts(email, phoneNumber) {
  if (email && phoneNumber) {
    return db.prepare(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL 
        AND (email = ? OR phoneNumber = ?)
    `).all(email, phoneNumber);
  }

  if (email) {
    return db.prepare(`
      SELECT * FROM Contact 
      WHERE deletedAt IS NULL 
        AND email = ?
    `).all(email);
  }

  return db.prepare(`
    SELECT * FROM Contact 
    WHERE deletedAt IS NULL 
      AND phoneNumber = ?
  `).all(phoneNumber);
}

function getPrimaryContacts(matches) {
  const primaryIds = new Set();

  for (const match of matches) {
    if (match.linkPrecedence === 'primary') {
      primaryIds.add(match.id);
    } else {
      primaryIds.add(match.linkedId);
    }
  }

  if (primaryIds.size === 0) return [];

  const placeholders = [...primaryIds].map(() => '?').join(',');
  return db.prepare(`
    SELECT * FROM Contact 
    WHERE id IN (${placeholders}) 
      AND deletedAt IS NULL
    ORDER BY createdAt ASC
  `).all(...primaryIds);
}

function createPrimaryContact(email, phoneNumber) {
  const result = db.prepare(`
    INSERT INTO Contact (email, phoneNumber, linkPrecedence)
    VALUES (?, ?, 'primary')
  `).run(email, phoneNumber);

  return db.prepare('SELECT * FROM Contact WHERE id = ?').get(result.lastInsertRowid);
}

function getAllContactsInGroup(primaryId) {
  return db.prepare(`
    SELECT * FROM Contact 
    WHERE (id = ? OR linkedId = ?) 
      AND deletedAt IS NULL
    ORDER BY createdAt ASC
  `).all(primaryId, primaryId);
}

function createSecondaryIfNeeded(primaryId, email, phoneNumber) {
  const group = getAllContactsInGroup(primaryId);

  const emails = group.map(c => c.email).filter(Boolean);
  const phones = group.map(c => c.phoneNumber).filter(Boolean);

  const hasNewEmail = email && !emails.includes(email);
  const hasNewPhone = phoneNumber && !phones.includes(phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    db.prepare(`
      INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
      VALUES (?, ?, ?, 'secondary')
    `).run(email, phoneNumber, primaryId);
  }
}

function mergePrimaryContacts(primaries) {
  const winner = primaries[0];
  const losers = primaries.slice(1);

  for (const loser of losers) {
    db.prepare(`
      UPDATE Contact 
      SET linkedId = ?, linkPrecedence = 'secondary', updatedAt = datetime('now')
      WHERE id = ?
    `).run(winner.id, loser.id);

    db.prepare(`
      UPDATE Contact 
      SET linkedId = ?, updatedAt = datetime('now')
      WHERE linkedId = ?
    `).run(winner.id, loser.id);
  }

  return winner;
}

function buildResponse(primaryId) {
  const group = getAllContactsInGroup(primaryId);
  const primary = group.find(c => c.id === primaryId);

  const emails = [...new Set(group.map(c => c.email).filter(Boolean))];
  const phones = [...new Set(group.map(c => c.phoneNumber).filter(Boolean))];
  const secondaryIds = group.filter(c => c.id !== primaryId).map(c => c.id);

  return {
    contact: {
      primaryContactId: primaryId,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds
    }
  };
}

function identify(email, phoneNumber) {
  const matches = findMatchingContacts(email, phoneNumber);
  const primaries = getPrimaryContacts(matches);

  //Case A: No matches - new customer
  if (primaries.length === 0) {
    const newContact = createPrimaryContact(email, phoneNumber);
    return buildResponse(newContact.id);
  }

  //Case C: Multiple primaries - merge first
  if (primaries.length > 1) {
    mergePrimaryContacts(primaries);
  }

  //Case B & C: Single primary (after merge if needed)
  const primaryId = primaries[0].id;
  createSecondaryIfNeeded(primaryId, email, phoneNumber);
  return buildResponse(primaryId);
}

module.exports = { identify };