require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const server = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
server.use(cors({
  origin: '*', // In development, allow all origins.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express middleware
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Print logging request details for development
server.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Bind Routing pathways
server.use('/api/auth', require('./routes/auth'));
server.use('/api/vendors', require('./routes/vendors'));
server.use('/api/rfqs', require('./routes/rfqs'));
server.use('/api/quotations', require('./routes/quotations'));
server.use('/api/approvals', require('./routes/approvals'));
server.use('/api/orders', require('./routes/orders'));
server.use('/api/invoices', require('./routes/invoices'));
server.use('/api/logs', require('./routes/logs'));
server.use('/api/reports', require('./routes/reports'));
// Serve uploaded images publicly
server.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Product routes
server.use('/api/products', require('./routes/products'));

// Default base route
server.get('/', (req, res) => {
  res.json({ message: 'Welcome to VendorBridge ERP API' });
});

// Global Error Handler
server.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 VendorBridge ERP Server is running on port ${PORT}`);
  console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
});
