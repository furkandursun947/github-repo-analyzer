import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

// Dotenv'i burada da yükleyelim
dotenv.config();

// GitHub API base URL
const GITHUB_API_URL = 'https://api.github.com';

// GitHub token from environment variables - direkt olarak process.env'den alalım
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Debug: Token kontrolü
console.log('ENV GITHUB_TOKEN:', process.env.GITHUB_TOKEN);
console.log('Token exists:', !!GITHUB_TOKEN);
console.log('Token value (first few chars):', GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 10) + '...' : 'not set');

// Headers for GitHub API requests - token'ı doğrudan axios instance'ına ekleyelim
const axiosInstance = axios.create({
  baseURL: GITHUB_API_URL,
  headers: GITHUB_TOKEN ? {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  } : {}
});

// Debug: Headers kontrolü
console.log('Headers being used:', axiosInstance.defaults.headers);

// Extract owner and repo name from GitHub URL
const extractRepoDetails = (repoUrl: string) => {
  try {
    // Support for different GitHub URL formats
    const url = new URL(repoUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // URL sadece bir segment içeriyorsa (örn: github.com/exercism/) bu bir organizasyon veya kullanıcı olabilir
    if (pathSegments.length === 1) {
      return {
        owner: pathSegments[0],
        repo: null, // Repo belirtilmemiş, tüm organizasyon repolarını alabiliriz
        isOrganization: true
      };
    }
    
    if (pathSegments.length >= 2) {
      return {
        owner: pathSegments[0],
        repo: pathSegments[1],
        isOrganization: false
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Get basic repository information
export const getRepoInfo = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const repoDetails = extractRepoDetails(url);
    
    if (!repoDetails) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    const { owner, repo, isOrganization } = repoDetails;
    
    // Eğer bu bir organizasyonsa ve belirli bir repo belirtilmemişse
    if (isOrganization && !repo) {
      try {
        // Organizasyona ait repoları al
        const orgReposResponse = await axiosInstance.get(`/orgs/${owner}/repos`, {
          params: {
            per_page: 10, // Sadece ilk 10 repo (limiti ayarlayabilirsiniz)
            sort: 'updated'
          }
        });
        
        // İlk repo bilgilerini al
        if (orgReposResponse.data.length > 0) {
          const firstRepo = orgReposResponse.data[0];
          
          // İlk repo için katkıda bulunanları al
          const contributorsResponse = await axiosInstance.get(`/repos/${owner}/${firstRepo.name}/contributors`);
          
          // Organizasyon bilgilerini al
          const orgResponse = await axiosInstance.get(`/orgs/${owner}`);
          
          return res.json({
            organization: orgResponse.data,
            repoInfo: firstRepo,
            contributors: contributorsResponse.data,
            allRepos: orgReposResponse.data,
            isOrganization: true
          });
        } else {
          return res.status(404).json({ error: 'No repositories found for this organization' });
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        
        // Belki bir kullanıcıdır, kullanıcı bilgilerini almayı dene
        try {
          const userResponse = await axiosInstance.get(`/users/${owner}`);
          const userReposResponse = await axiosInstance.get(`/users/${owner}/repos`, {
            params: {
              per_page: 10,
              sort: 'updated'
            }
          });
          
          if (userReposResponse.data.length > 0) {
            const firstRepo = userReposResponse.data[0];
            const contributorsResponse = await axiosInstance.get(`/repos/${owner}/${firstRepo.name}/contributors`);
            
            return res.json({
              userInfo: userResponse.data,
              repoInfo: firstRepo,
              contributors: contributorsResponse.data,
              allRepos: userReposResponse.data,
              isUser: true
            });
          } else {
            return res.status(404).json({ error: 'No repositories found for this user' });
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          return res.status(404).json({ error: 'Could not find organization or user' });
        }
      }
    }
    
    // Normal bir repo ise
    if (repo) {
      // Fetch repository information using axiosInstance
      const repoResponse = await axiosInstance.get(`/repos/${owner}/${repo}`);
      
      // Get contributors
      const contributorsResponse = await axiosInstance.get(`/repos/${owner}/${repo}/contributors`);
      
      // Return combined data
      res.json({
        repoInfo: repoResponse.data,
        contributors: contributorsResponse.data,
        isOrganization: false
      });
    } else {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
  } catch (error) {
    console.error('Error fetching repository information:', error);
    res.status(500).json({ error: 'Failed to fetch repository information' });
  }
};

// Get repository languages
export const getRepoLanguages = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const repoDetails = extractRepoDetails(url);
    
    if (!repoDetails) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    const { owner, repo, isOrganization } = repoDetails;
    
    // Eğer bu bir organizasyonsa ve belirli bir repo belirtilmemişse
    if (isOrganization && !repo) {
      try {
        // Organizasyona ait repoları al
        const orgReposResponse = await axiosInstance.get(`/orgs/${owner}/repos`, {
          params: {
            per_page: 5, // İlk 5 repo için dil bilgilerini alsın
            sort: 'updated'
          }
        });
        
        if (orgReposResponse.data.length > 0) {
          // İlk birkaç repo için dil bilgilerini topla
          const languagePromises = orgReposResponse.data.slice(0, 5).map(async (repo: any) => {
            const langResponse = await axiosInstance.get(`/repos/${owner}/${repo.name}/languages`);
            return { repo: repo.name, languages: langResponse.data };
          });
          
          const languageResults = await Promise.all(languagePromises);
          
          // Tüm dilleri birleştir ve bir araya getir
          const combinedLanguages: Record<string, number> = {};
          
          languageResults.forEach(result => {
            Object.entries(result.languages).forEach(([lang, bytes]) => {
              if (combinedLanguages[lang]) {
                combinedLanguages[lang] += bytes as number;
              } else {
                combinedLanguages[lang] = bytes as number;
              }
            });
          });
          
          return res.json(combinedLanguages);
        } else {
          return res.status(404).json({ error: 'No repositories found for this organization' });
        }
      } catch (error) {
        console.error('Error fetching organization languages:', error);
        return res.status(500).json({ error: 'Failed to fetch organization languages' });
      }
    }
    
    // Normal bir repo ise
    if (repo) {
      // Fetch languages
      const languagesResponse = await axiosInstance.get(`/repos/${owner}/${repo}/languages`);
      res.json(languagesResponse.data);
    } else {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
  } catch (error) {
    console.error('Error fetching repository languages:', error);
    res.status(500).json({ error: 'Failed to fetch repository languages' });
  }
};

// Analyze technologies based on files and dependencies
export const getRepoTechnologies = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    const repoDetails = extractRepoDetails(url);
    
    if (!repoDetails) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    const { owner, repo, isOrganization } = repoDetails;
    
    // Eğer bu bir organizasyonsa ve belirli bir repo belirtilmemişse
    if (isOrganization && !repo) {
      try {
        // Organizasyona ait repoları al
        const orgReposResponse = await axiosInstance.get(`/orgs/${owner}/repos`, {
          params: {
            per_page: 5, // İlk 5 repo için teknoloji bilgilerini alsın
            sort: 'updated'
          }
        });
        
        if (orgReposResponse.data.length > 0) {
          const allTechnologies: string[] = [];
          const allPackageDetails: any = {
            dependencies: {},
            devDependencies: {}
          };
          
          // İlk birkaç repo için dosya içeriklerini topla
          for (const orgRepo of orgReposResponse.data.slice(0, 3)) { // İlk 3 repo yeterli olur
            try {
              // Repo içeriklerini al
              const contentsResponse = await axiosInstance.get(`/repos/${owner}/${orgRepo.name}/contents`);
              const fileNames = contentsResponse.data.map((item: any) => item.name);
              
              // Teknolojileri tespit et
              const repoTechnologies = detectTechnologies(fileNames);
              repoTechnologies.forEach(tech => {
                if (!allTechnologies.includes(tech)) {
                  allTechnologies.push(tech);
                }
              });
              
              // Package.json varsa analiz et
              if (fileNames.includes('package.json')) {
                try {
                  const packageResponse = await axiosInstance.get(`/repos/${owner}/${orgRepo.name}/contents/package.json`);
                  const packageContent = Buffer.from(packageResponse.data.content, 'base64').toString();
                  const packageJson = JSON.parse(packageContent);
                  
                  // Dependencies ekle
                  if (packageJson.dependencies) {
                    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                      allPackageDetails.dependencies[name] = version;
                      if (!allTechnologies.includes(name)) {
                        allTechnologies.push(name);
                      }
                    });
                  }
                  
                  // DevDependencies ekle
                  if (packageJson.devDependencies) {
                    Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
                      allPackageDetails.devDependencies[name] = version;
                      if (!allTechnologies.includes(name)) {
                        allTechnologies.push(name);
                      }
                    });
                  }
                  
                } catch (packageError) {
                  console.error(`Error analyzing package.json for ${orgRepo.name}:`, packageError);
                }
              }
              
            } catch (repoError) {
              console.error(`Error processing repo ${orgRepo.name}:`, repoError);
              // Bir repo hata verirse diğer repolara devam et
              continue;
            }
          }
          
          return res.json({
            technologies: allTechnologies,
            packageDetails: allPackageDetails,
            analyzedRepoCount: Math.min(3, orgReposResponse.data.length)
          });
          
        } else {
          return res.status(404).json({ error: 'No repositories found for this organization' });
        }
      } catch (error) {
        console.error('Error analyzing organization technologies:', error);
        return res.status(500).json({ error: 'Failed to analyze organization technologies' });
      }
    }
    
    // Normal bir repo ise
    if (repo) {
      // Get repository contents
      const contentsResponse = await axiosInstance.get(`/repos/${owner}/${repo}/contents`);
      
      // Check for package files to detect technologies
      const fileNames = contentsResponse.data.map((item: any) => item.name);
      
      // Basic technology detection based on common files
      const technologies = detectTechnologies(fileNames);
      
      // Try to get package.json for more detailed JS/TS analysis
      const packageJsonExists = fileNames.includes('package.json');
      let packageDetails = {};
      
      if (packageJsonExists) {
        try {
          const packageResponse = await axiosInstance.get(`/repos/${owner}/${repo}/contents/package.json`);
          
          const packageContent = Buffer.from(packageResponse.data.content, 'base64').toString();
          const packageJson = JSON.parse(packageContent);
          
          packageDetails = {
            dependencies: packageJson.dependencies || {},
            devDependencies: packageJson.devDependencies || {}
          };
          
          // Enhance technologies with package.json details
          Object.keys({
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          }).forEach(dep => {
            if (!technologies.includes(dep)) {
              technologies.push(dep);
            }
          });
          
        } catch (error) {
          console.error('Error analyzing package.json:', error);
        }
      }
      
      res.json({
        technologies,
        packageDetails
      });
    } else {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
  } catch (error) {
    console.error('Error detecting technologies:', error);
    res.status(500).json({ error: 'Failed to detect technologies' });
  }
};

// Helper function to detect technologies based on file patterns
const detectTechnologies = (fileNames: string[]): string[] => {
  const technologies: string[] = [];
  
  // Front-end frameworks/libraries
  if (fileNames.some(file => file.includes('react'))) technologies.push('React');
  if (fileNames.some(file => file.includes('angular'))) technologies.push('Angular');
  if (fileNames.some(file => file.includes('vue'))) technologies.push('Vue.js');
  
  // Backend frameworks
  if (fileNames.includes('requirements.txt')) technologies.push('Python');
  if (fileNames.includes('Gemfile')) technologies.push('Ruby');
  if (fileNames.includes('composer.json')) technologies.push('PHP');
  if (fileNames.includes('pom.xml')) technologies.push('Java');
  if (fileNames.includes('go.mod')) technologies.push('Go');
  if (fileNames.includes('Cargo.toml')) technologies.push('Rust');
  
  // Configuration files
  if (fileNames.includes('package.json')) technologies.push('Node.js');
  if (fileNames.includes('tsconfig.json')) technologies.push('TypeScript');
  if (fileNames.includes('webpack.config.js')) technologies.push('Webpack');
  if (fileNames.includes('docker-compose.yml')) technologies.push('Docker');
  if (fileNames.includes('Dockerfile')) technologies.push('Docker');
  if (fileNames.includes('.travis.yml')) technologies.push('Travis CI');
  if (fileNames.includes('.github/workflows')) technologies.push('GitHub Actions');
  
  return technologies;
}; 