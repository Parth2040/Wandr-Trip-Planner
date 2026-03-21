const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./services/routes/authRoutes');
const tripRoutes = require('./services/routes/tripRoutes');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Wandr' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong in Wandr server.' });
});

module.exports = app;
