// Serverless function for repo languages endpoint
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        message: 'Please provide a GitHub repository URL'
      });
    }

    // Parse GitHub URL to extract owner and repo
    const githubUrlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubUrlPattern);
    
    if (!match) {
      return res.status(400).json({
        error: 'Invalid GitHub URL',
        message: 'The provided URL is not a valid GitHub repository URL'
      });
    }

    const [, owner, repo] = match;
    
    // GitHub API URL for languages
    const languagesUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;
    
    // Optional GitHub token for increased rate limits
    const githubToken = process.env.GITHUB_TOKEN;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repo-Analyzer'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    // Fetch languages data
    const response = await axios.get(languagesUrl, { headers });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching repo languages:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch repository languages',
      message: error.message || 'An unexpected error occurred'
    });
  }
}; 