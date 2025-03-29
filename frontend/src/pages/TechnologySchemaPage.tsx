import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRepoTechnologies } from '../services/githubService';
import { useRepository } from '../contexts/RepositoryContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';
import Footer from '../components/Footer';

// Teknoloji kategorileri
const technologyCategories = {
  frontend: [
    'React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 
    'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
    'Material-UI', 'Chakra UI', 'Styled Components'
  ],
  backend: [
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 
    'Laravel', 'Ruby on Rails', 'PHP', 'Java', 'Python', 'Go', 'Rust'
  ],
  database: [
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
    'Firestore', 'DynamoDB', 'Cassandra', 'Neo4j'
  ],
  devops: [
    'Docker', 'Kubernetes', 'GitHub Actions', 'Travis CI', 'Jenkins',
    'CircleCI', 'AWS', 'Google Cloud', 'Azure', 'Heroku', 'Netlify', 'Vercel'
  ],
  testing: [
    'Jest', 'Mocha', 'Cypress', 'Selenium', 'Puppeteer', 'React Testing Library',
    'Enzyme', 'JUnit', 'PyTest'
  ],
  mobile: [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin'
  ],
  tools: [
    'Webpack', 'Babel', 'ESLint', 'Prettier', 'npm', 'Yarn', 'Vite', 'Rollup'
  ]
};

// Teknoloji tipini belirleyen fonksiyon
const determineTechnologyType = (tech: string): string => {
  tech = tech.toLowerCase();
  
  for (const [category, technologies] of Object.entries(technologyCategories)) {
    if (technologies.some(t => t.toLowerCase() === tech || tech.includes(t.toLowerCase()))) {
      return category;
    }
  }
  
  // Spesifik kontrollerle kategori belirle
  if (tech.includes('lint') || tech.includes('format')) return 'tools';
  if (tech.includes('db') || tech.includes('sql')) return 'database';
  if (tech.includes('test') || tech.includes('spec')) return 'testing';
  if (tech.includes('ui') || tech.includes('css')) return 'frontend';
  if (tech.includes('server') || tech.includes('api')) return 'backend';
  
  return 'other';
};

// Teknolojiler için renkler
const categoryColors: Record<string, string> = {
  frontend: '#3B82F6', // blue
  backend: '#10B981',  // green
  database: '#6366F1', // indigo
  devops: '#F59E0B',   // amber
  testing: '#EC4899',  // pink
  mobile: '#8B5CF6',   // purple
  tools: '#6B7280',    // gray
  other: '#9CA3AF'     // gray
};

interface TechnologyNode {
  id: string;
  label: string;
  category: string;
  color: string;
}

interface TechnologyLink {
  source: string;
  target: string;
}

const TechnologySchemaPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use repository context
  const { 
    repoUrl, 
    setRepoUrl, 
    technologies: contextTechnologies, 
    setTechnologies,
    loading: contextLoading,
    setLoading,
    error: contextError,
    setError,
    analyzed
  } = useRepository();
  
  // Component-specific state
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [devDependencies, setDevDependencies] = useState<Record<string, string>>({});
  const [nodes, setNodes] = useState<TechnologyNode[]>([]);
  const [links, _setLinks] = useState<TechnologyLink[]>([]);

  useEffect(() => {
    // URL'den repo URL'sini al
    const query = new URLSearchParams(location.search);
    const urlFromQuery = query.get('url');

    if (!urlFromQuery) {
      setError(t('techSchema.error'));
      setLoading(false);
      return;
    }

    // Check if we're using the same URL as in the context
    if (repoUrl !== urlFromQuery) {
      setRepoUrl(urlFromQuery);
    }

    // If we already have technologies data in context and URL matches, use it
    if (analyzed && contextTechnologies && repoUrl === urlFromQuery) {
      setDependencies(contextTechnologies.packageDetails?.dependencies || {});
      setDevDependencies(contextTechnologies.packageDetails?.devDependencies || {});
      
      // Generate the technology graph
      generateTechnologyGraph(
        contextTechnologies.technologies || [],
        contextTechnologies.packageDetails?.dependencies || {},
        contextTechnologies.packageDetails?.devDependencies || {}
      );
      return;
    }

    fetchTechnologies(urlFromQuery);
  }, [location, t, repoUrl, analyzed, contextTechnologies]);

  const fetchTechnologies = async (url: string) => {
    setLoading(true);
    setError(null);

    try {
      const techData = await getRepoTechnologies(url);
      
      // Save all analysis data to context
      setTechnologies(techData);
      
      // Save to component state
      setDependencies(techData.packageDetails?.dependencies || {});
      setDevDependencies(techData.packageDetails?.devDependencies || {});
      
      // Generate the technology graph
      generateTechnologyGraph(
        techData.technologies || [],
        techData.packageDetails?.dependencies || {},
        techData.packageDetails?.devDependencies || {}
      );
    } catch (err) {
      console.error('Error fetching technologies:', err);
      setError(t('techSchema.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const generateTechnologyGraph = (
    techs: string[],
    deps: Record<string, string>,
    devDeps: Record<string, string>
  ) => {
    const newNodes: TechnologyNode[] = [];
    const newLinks: TechnologyLink[] = [];
    const processedTechs = new Set<string>();
    
    // Ana teknolojileri ekle
    for (const tech of techs) {
      if (!processedTechs.has(tech.toLowerCase())) {
        const category = determineTechnologyType(tech);
        newNodes.push({
          id: tech,
          label: tech,
          category: category,
          color: categoryColors[category]
        });
        processedTechs.add(tech.toLowerCase());
      }
    }
    
    // Bağımlılıkları ekle
    const allDeps = { ...deps, ...devDeps };
    
    // Node.js varsa ona diğer bağımlılıkları bağla
    const hasNodeJs = newNodes.some(node => node.id === 'Node.js');
    
    Object.keys(allDeps).forEach(dep => {
      if (!processedTechs.has(dep.toLowerCase())) {
        const category = determineTechnologyType(dep);
        newNodes.push({
          id: dep,
          label: dep,
          category: category,
          color: categoryColors[category]
        });
        processedTechs.add(dep.toLowerCase());
      }
      
      // Bağlantıları oluştur
      if (hasNodeJs) {
        newLinks.push({
          source: 'Node.js',
          target: dep
        });
      }
    });
    
    // Belirli ilişkileri ekle
    const addRelationIfBothExist = (source: string, target: string) => {
      const sourceExists = newNodes.some(node => node.id === source);
      const targetExists = newNodes.some(node => node.id === target);
      
      if (sourceExists && targetExists) {
        newLinks.push({ source, target });
      }
    };
    
    // Frontend framework bağlantıları
    addRelationIfBothExist('React', 'TypeScript');
    addRelationIfBothExist('React', 'JavaScript');
    addRelationIfBothExist('Vue.js', 'JavaScript');
    addRelationIfBothExist('Angular', 'TypeScript');
    
    // Backend bağlantıları
    addRelationIfBothExist('Express', 'Node.js');
    addRelationIfBothExist('Mongoose', 'MongoDB');
    addRelationIfBothExist('Sequelize', 'PostgreSQL');
    addRelationIfBothExist('Sequelize', 'MySQL');
    
    // CI/CD ve DevOps bağlantıları
    addRelationIfBothExist('GitHub Actions', 'Docker');
    addRelationIfBothExist('Travis CI', 'Docker');
    
    setNodes(newNodes);
    _setLinks(newLinks);
  };

  const handleBackToDashboard = () => {
    const query = new URLSearchParams(location.search);
    navigate(`/dashboard?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col transition-colors">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('app.title')}
            </h1>
            <div className="flex space-x-3">
              <LanguageSelector />
              <ThemeToggle />
              <button 
                onClick={handleBackToDashboard}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none transition-colors"
              >
                {t('techSchema.backToDashboard')}
              </button>
            </div>
          </div>

          {contextLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-500 dark:text-gray-400">
                {t('techSchema.loading')}
              </div>
            </div>
          ) : contextError ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <div className="text-red-700 dark:text-red-400">{contextError}</div>
            </div>
          ) : (
            <>
              {/* Kategori Lejantı */}
              <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('techSchema.categories')}
                  </h2>
                  <button 
                    onClick={handleBackToDashboard}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('techSchema.backToDashboard')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(categoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {t(`techSchema.categoryNames.${category}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teknoloji Şeması */}
              <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('techSchema.diagram')}
                  </h2>
                </div>
                
                {nodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(technologyCategories).map(([category, _]) => {
                      const categoryNodes = nodes.filter(node => node.category === category);
                      
                      if (categoryNodes.length === 0) return null;
                      
                      return (
                        <div key={category} className="border dark:border-gray-700 rounded-lg p-4">
                          <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200 capitalize">
                            {t(`techSchema.categoryNames.${category}`)}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {categoryNodes.map(node => (
                              <span 
                                key={node.id}
                                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: node.color }}
                              >
                                {node.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('techSchema.noTechnologies')}
                  </p>
                )}
              </div>

              {/* Bağımlılıklar Bölümü */}
              {(Object.keys(dependencies).length > 0 || Object.keys(devDependencies).length > 0) && (
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('techSchema.dependencyRelations')}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dependencies */}
                    {Object.keys(dependencies).length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">
                          {t('dashboard.dependencies.dependencies')}
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(dependencies).map(([name, version]) => {
                            const category = determineTechnologyType(name);
                            return (
                              <li key={name} className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: categoryColors[category] }}
                                ></div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                <span className="ml-auto text-xs text-gray-500">{version}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* DevDependencies */}
                    {Object.keys(devDependencies).length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">
                          {t('dashboard.dependencies.devDependencies')}
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(devDependencies).map(([name, version]) => {
                            const category = determineTechnologyType(name);
                            return (
                              <li key={name} className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: categoryColors[category] }}
                                ></div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                <span className="ml-auto text-xs text-gray-500">{version}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TechnologySchemaPage; 