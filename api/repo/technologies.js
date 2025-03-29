// Serverless function for repo technologies endpoint
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
    
    // GitHub API URL for content
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const packageJsonUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;
    
    // Optional GitHub token for increased rate limits
    const githubToken = process.env.GITHUB_TOKEN;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repo-Analyzer'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    // Technologies to detect
    const technologies = [];
    let packageDetails = { dependencies: {}, devDependencies: {} };

    // Try to find package.json for dependencies
    try {
      const packageResponse = await axios.get(packageJsonUrl, { headers });
      
      if (packageResponse.data && packageResponse.data.content) {
        // Decode base64 content
        const content = Buffer.from(packageResponse.data.content, 'base64').toString('utf8');
        const packageJson = JSON.parse(content);
        
        // Extract dependencies
        if (packageJson.dependencies) {
          packageDetails.dependencies = packageJson.dependencies;
          
          // Add detected technologies based on dependencies
          Object.keys(packageJson.dependencies).forEach(dep => {
            if (!technologies.includes(dep)) {
              technologies.push(dep);
            }
          });
        }
        
        // Extract dev dependencies
        if (packageJson.devDependencies) {
          packageDetails.devDependencies = packageJson.devDependencies;
          
          // Add detected technologies based on dev dependencies
          Object.keys(packageJson.devDependencies).forEach(dep => {
            if (!technologies.includes(dep)) {
              technologies.push(dep);
            }
          });
        }
      }
    } catch (packageError) {
      console.log('No package.json found or error parsing it:', packageError.message);
    }
    
    // Detect technologies by scanning for common files
    try {
      const contentsResponse = await axios.get(contentsUrl, { headers });
      
      if (contentsResponse.data && Array.isArray(contentsResponse.data)) {
        const files = contentsResponse.data.map(item => item.name.toLowerCase());
        
        // Detect frontend frameworks
        if (files.includes('angular.json') || files.some(f => f.includes('angular'))) {
          technologies.push('Angular');
        }
        if (files.includes('react-app-env.d.ts') || files.some(f => f.includes('react'))) {
          technologies.push('React');
        }
        if (files.includes('vue.config.js') || files.some(f => f.includes('vue'))) {
          technologies.push('Vue.js');
        }
        if (files.includes('svelte.config.js') || files.some(f => f.includes('svelte'))) {
          technologies.push('Svelte');
        }
        if (files.includes('next.config.js')) {
          technologies.push('Next.js');
        }
        
        // Detect backend technologies
        if (files.includes('express.js') || files.some(f => f.includes('express'))) {
          technologies.push('Express');
        }
        if (files.includes('app.py') || files.some(f => f.endsWith('.py'))) {
          technologies.push('Python');
        }
        if (files.includes('requirements.txt')) {
          technologies.push('Python');
        }
        if (files.some(f => f.endsWith('.java'))) {
          technologies.push('Java');
        }
        if (files.some(f => f.endsWith('.go'))) {
          technologies.push('Go');
        }
        if (files.includes('Gemfile')) {
          technologies.push('Ruby');
        }
        
        // Detect databases
        if (files.some(f => f.includes('mongo'))) {
          technologies.push('MongoDB');
        }
        if (files.some(f => f.includes('postgres'))) {
          technologies.push('PostgreSQL');
        }
        if (files.some(f => f.includes('mysql'))) {
          technologies.push('MySQL');
        }
        
        // Detect CSS frameworks
        if (files.includes('tailwind.config.js')) {
          technologies.push('Tailwind');
        }
        
        // Detect TypeScript
        if (files.includes('tsconfig.json') || files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
          technologies.push('TypeScript');
        }
        
        // Detect JavaScript
        if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
          technologies.push('JavaScript');
        }
        
        // Detect HTML/CSS
        if (files.some(f => f.endsWith('.html'))) {
          technologies.push('HTML');
        }
        if (files.some(f => f.endsWith('.css'))) {
          technologies.push('CSS');
        }
        
        // Detect Docker
        if (files.includes('dockerfile') || files.includes('docker-compose.yml')) {
          technologies.push('Docker');
        }
      }
    } catch (contentsError) {
      console.log('Error scanning contents:', contentsError.message);
    }
    
    // Remove duplicates and sort
    const uniqueTechnologies = [...new Set(technologies)].sort();
    
    return res.status(200).json({
      technologies: uniqueTechnologies,
      packageDetails
    });
  } catch (error) {
    console.error('Error detecting technologies:', error);
    
    return res.status(500).json({
      error: 'Failed to detect repository technologies',
      message: error.message || 'An unexpected error occurred',
      technologies: [],
      packageDetails: { dependencies: {}, devDependencies: {} }
    });
  }
}; 