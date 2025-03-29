// Vercel Serverless Function for GitHub API
const axios = require('axios');

// Handle GitHub API requests
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { url, endpoint } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'GitHub repository URL is required'
      });
    }

    // Extract owner and repo from GitHub URL
    const githubUrlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubUrlPattern);
    
    if (!match) {
      return res.status(400).json({
        error: 'Invalid GitHub URL',
        message: 'The provided URL is not a valid GitHub repository URL'
      });
    }

    const [, owner, repo] = match;
    let apiUrl;

    // Determine which GitHub API endpoint to use based on the requested endpoint
    switch (endpoint) {
      case 'info':
        apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        break;
      case 'languages':
        apiUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;
        break;
      case 'technologies':
        // Example - you might need to implement this differently based on your needs
        apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
        break;
      default:
        return res.status(400).json({
          error: 'Invalid endpoint',
          message: 'The requested endpoint is not supported'
        });
    }

    // Make the request to GitHub API
    const githubResponse = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Repo-Analyzer'
      }
    });

    // Return the data from GitHub API
    return res.status(200).json(githubResponse.data);
  } catch (error) {
    console.error('Error processing GitHub API request:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}; 