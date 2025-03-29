// Serverless function for repo info endpoint
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
    
    // GitHub API URLs
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const contributorsUrl = `https://api.github.com/repos/${owner}/${repo}/contributors`;
    
    // Optional GitHub token for increased rate limits
    const githubToken = process.env.GITHUB_TOKEN;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repo-Analyzer'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    // Fetch repo data and contributors in parallel
    const [repoResponse, contributorsResponse] = await Promise.all([
      axios.get(repoUrl, { headers }),
      axios.get(contributorsUrl, { headers, params: { per_page: 10 } })
    ]);

    // Check if we're dealing with a user or organization
    let isOrganization = false;
    let isUser = false;
    let organizationData = null;
    let userData = null;
    let allRepos = [];

    if (repoResponse.data.owner && repoResponse.data.owner.type === 'Organization') {
      isOrganization = true;
      // Fetch organization data
      const orgResponse = await axios.get(
        `https://api.github.com/orgs/${owner}`,
        { headers }
      );
      organizationData = orgResponse.data;
      
      // Fetch organization's popular repos
      const orgReposResponse = await axios.get(
        `https://api.github.com/orgs/${owner}/repos`,
        { 
          headers,
          params: { 
            sort: 'stars',
            direction: 'desc',
            per_page: 6
          } 
        }
      );
      allRepos = orgReposResponse.data;
    } else if (repoResponse.data.owner && repoResponse.data.owner.type === 'User') {
      isUser = true;
      // Fetch user data
      const userResponse = await axios.get(
        `https://api.github.com/users/${owner}`,
        { headers }
      );
      userData = userResponse.data;
      
      // Fetch user's popular repos
      const userReposResponse = await axios.get(
        `https://api.github.com/users/${owner}/repos`,
        { 
          headers,
          params: { 
            sort: 'stars',
            direction: 'desc',
            per_page: 6
          } 
        }
      );
      allRepos = userReposResponse.data;
    }

    // Combine all data
    const responseData = {
      repoInfo: repoResponse.data,
      contributors: contributorsResponse.data,
      isOrganization,
      isUser,
      organization: organizationData,
      userInfo: userData,
      allRepos
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching repo info:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch repository information',
      message: error.message || 'An unexpected error occurred'
    });
  }
}; 