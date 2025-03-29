// Vercel Serverless Function Entry Point
const { createServer } = require('http');
const { parse } = require('url');

// Backend path - adjust this to match your actual backend app location
const appPath = '../backend/src/app';

// Try to load the backend application
let app;
try {
  app = require(appPath);
} catch (error) {
  console.error(`Error loading backend application from ${appPath}:`, error);
}

// Create a simple handler for serverless function
module.exports = async (req, res) => {
  if (!app || !app.default) {
    return res.status(500).json({
      error: 'Backend application could not be loaded',
      message: 'Server configuration error'
    });
  }
  
  // Forward the request to the actual backend implementation
  return app.default(req, res);
}; 