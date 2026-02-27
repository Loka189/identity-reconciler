const express = require('express');
const { initializeDatabase } = require('./config/db');
const identifyRoute = require('./routes/identify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Identity Reconciler is running' });
});

app.use('/', identifyRoute);

initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});