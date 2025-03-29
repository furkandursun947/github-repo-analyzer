import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { getRepoInfo, getRepoLanguages, getRepoTechnologies } from '../services/githubService';
import { useRepository } from '../contexts/RepositoryContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';
import Footer from '../components/Footer';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the repository context
  const { 
    repoUrl, 
    setRepoUrl,
    repoInfo, 
    setRepoInfo, 
    languages, 
    setLanguages, 
    technologies, 
    setTechnologies,
    loading,
    setLoading,
    error,
    setError,
    analyzed,
    clearAnalysis
  } = useRepository();

  useEffect(() => {
    // URL'den repo URL'sini al
    const query = new URLSearchParams(location.search);
    const urlFromQuery = query.get('url');
    const isFreshAnalysis = query.get('fresh') === 'true';

    if (!urlFromQuery) {
      setError(t('dashboard.error'));
      setLoading(false);
      return;
    }

    // Clear previous data if this is a fresh analysis request
    if (isFreshAnalysis) {
      // We don't call clearAnalysis() here because that would clear the URL too
      // Instead, we'll just reset the data but keep the URL
      setRepoInfo(null);
      setLanguages({});
      setTechnologies(null);
      setError(null);
    }

    // Check if we're already analyzing the same repo and it's not a fresh analysis
    if (repoUrl === urlFromQuery && analyzed && repoInfo && !isFreshAnalysis) {
      // Data is already in state, no need to fetch again
      return;
    }

    // Set the new URL in context
    setRepoUrl(urlFromQuery);
    
    // Fetch repo data
    fetchRepoData(urlFromQuery);
    
    // Clean up the URL by removing the fresh parameter after handling it
    if (isFreshAnalysis) {
      const cleanQuery = new URLSearchParams();
      cleanQuery.set('url', urlFromQuery);
      navigate(`/dashboard?${cleanQuery.toString()}`, { replace: true });
    }
  }, [location, t, repoUrl, analyzed, repoInfo, setError, setLoading, setRepoUrl, navigate]);

  // Tüm repo verilerini getir
  const fetchRepoData = async (url: string) => {
    setLoading(true);
    setError(null);

    try {
      // Paralel olarak tüm API çağrılarını yap
      const [infoResponse, languagesResponse, technologiesResponse] = await Promise.all([
        getRepoInfo(url),
        getRepoLanguages(url),
        getRepoTechnologies(url)
      ]);

      setRepoInfo(infoResponse);
      setLanguages(languagesResponse);
      setTechnologies(technologiesResponse);
    } catch (err) {
      console.error('Error fetching repo data:', err);
      setError('Repo verileri getirilirken bir hata oluştu. Lütfen URL\'nin doğru olduğundan emin olun.');
    } finally {
      setLoading(false);
    }
  };

  // Ana sayfaya dön ve analizi temizle
  const handleGoBack = () => {
    // Clear all analysis data before navigating
    clearAnalysis();
    navigate('/');
  };

  // Teknoloji şeması sayfasına git
  const handleViewTechSchema = () => {
    const query = new URLSearchParams(location.search);
    navigate(`/tech-schema?${query.toString()}`);
  };

  // Dil grafiği için veri hazırlama
  const prepareLanguageChartData = () => {
    if (!languages || Object.keys(languages).length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 1
          }
        ]
      };
    }

    // Rastgele renkler oluştur
    const backgroundColors = Object.keys(languages).map(() => 
      `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
    );

    return {
      labels: Object.keys(languages),
      datasets: [
        {
          data: Object.values(languages),
          backgroundColor: backgroundColors,
          borderWidth: 1
        }
      ]
    };
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col transition-colors">
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
            <div className="flex space-x-3">
              <LanguageSelector />
              <ThemeToggle />
              <button 
                onClick={handleGoBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none transition-colors"
              >
                {t('dashboard.newAnalysis')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-500 dark:text-gray-400">{t('dashboard.loading')}</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <div className="text-red-700 dark:text-red-400">{error}</div>
            </div>
          ) : (
            <>
              {/* Repo veya Organizasyon Bilgileri */}
              {repoInfo && (
                <div className="bg-white dark:bg-dark-card shadow rounded-lg mb-6 overflow-hidden transition-colors">
                  <div className="p-6">
                    <div className="flex items-start">
                      {/* Organizasyon veya kullanıcı avatarı */}
                      {repoInfo.isOrganization && repoInfo.organization ? (
                        <img 
                          src={repoInfo.organization.avatar_url} 
                          alt="Organization Avatar" 
                          className="h-16 w-16 rounded-full mr-4"
                        />
                      ) : repoInfo.isUser && repoInfo.userInfo ? (
                        <img 
                          src={repoInfo.userInfo.avatar_url} 
                          alt="User Avatar" 
                          className="h-16 w-16 rounded-full mr-4"
                        />
                      ) : (
                        <img 
                          src={repoInfo.repoInfo.owner.avatar_url} 
                          alt="Owner Avatar" 
                          className="h-16 w-16 rounded-full mr-4"
                        />
                      )}
                      <div>
                        {/* Organizasyon/Kullanıcı adı veya Repo adı */}
                        <h2 className="text-2xl font-bold">
                          {repoInfo.isOrganization && repoInfo.organization ? (
                            <a href={repoInfo.organization.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {repoInfo.organization.name || repoInfo.organization.login}
                            </a>
                          ) : repoInfo.isUser && repoInfo.userInfo ? (
                            <a href={repoInfo.userInfo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {repoInfo.userInfo.name || repoInfo.userInfo.login}
                            </a>
                          ) : (
                            <a href={repoInfo.repoInfo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {repoInfo.repoInfo.name}
                            </a>
                          )}
                        </h2>
                        
                        {/* Açıklama */}
                        {repoInfo.isOrganization && repoInfo.organization?.description ? (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{repoInfo.organization.description}</p>
                        ) : repoInfo.isUser && repoInfo.userInfo?.bio ? (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{repoInfo.userInfo.bio}</p>
                        ) : repoInfo.repoInfo.description ? (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{repoInfo.repoInfo.description}</p>
                        ) : null}
                        
                        {/* Normal repo için owner bilgisi */}
                        {!repoInfo.isOrganization && !repoInfo.isUser && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('dashboard.repoInfo.by')} <a href={`https://github.com/${repoInfo.repoInfo.owner.login}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {repoInfo.repoInfo.owner.login}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* İstatistikler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      {/* Organizasyon veya Kullanıcı için istatistikler */}
                      {(repoInfo.isOrganization || repoInfo.isUser) ? (
                        <>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.publicRepos')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {repoInfo.isOrganization 
                                ? repoInfo.organization?.public_repos 
                                : repoInfo.userInfo?.public_repos}
                            </div>
                          </div>
                          {repoInfo.allRepos && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                              <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.popularRepos')}</div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {repoInfo.allRepos[0]?.name}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Normal repo için istatistikler */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.stars')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{repoInfo.repoInfo.stargazers_count.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.forks')}</div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">{repoInfo.repoInfo.forks_count.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.createdAt')}</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(repoInfo.repoInfo.created_at)}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg transition-colors">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.repoInfo.stats.updatedAt')}</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(repoInfo.repoInfo.updated_at)}</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Organizasyon için Repo Listesi */}
                    {repoInfo.allRepos && repoInfo.allRepos.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                          {t('dashboard.repoInfo.popularRepos')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {repoInfo.allRepos.slice(0, 6).map(repo => (
                            <a 
                              key={repo.id} 
                              href={repo.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="font-medium text-blue-600 dark:text-blue-400">{repo.name}</div>
                              {repo.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{repo.description}</p>
                              )}
                              <div className="flex mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center mr-3">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                                  </svg>
                                  {repo.stargazers_count}
                                </span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 3h-4l-2-2H9L7 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z"></path>
                                  </svg>
                                  {repo.forks_count}
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dil ve Teknoloji Analizi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Dil İstatistikleri */}
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 transition-colors">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('dashboard.languages.title')}</h3>
                  {Object.keys(languages).length > 0 ? (
                    <div className="h-64">
                      <Pie data={prepareLanguageChartData()} options={{ maintainAspectRatio: false }} />
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.languages.noData')}</p>
                  )}
                </div>

                {/* Teknolojiler */}
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.technologies.title')}</h3>
                    {technologies && technologies.technologies.length > 0 && (
                      <button
                        onClick={handleViewTechSchema}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      >
                        {t('techSchema.title')} 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {technologies && technologies.technologies.length > 0 ? (
                    <div className="flex flex-wrap">
                      {technologies.technologies.map((tech, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.technologies.noData')}</p>
                  )}
                </div>
              </div>

              {/* Bağımlılıklar */}
              {technologies && (technologies.packageDetails.dependencies || technologies.packageDetails.devDependencies) && (
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 transition-colors">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('dashboard.dependencies.title')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dependencies */}
                    {technologies.packageDetails.dependencies && Object.keys(technologies.packageDetails.dependencies).length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">{t('dashboard.dependencies.dependencies')}</h4>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(technologies.packageDetails.dependencies).map(([name, version]) => (
                            <li key={name} className="py-2">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                                <span className="text-gray-500 dark:text-gray-400">{version}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* DevDependencies */}
                    {technologies.packageDetails.devDependencies && Object.keys(technologies.packageDetails.devDependencies).length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">{t('dashboard.dependencies.devDependencies')}</h4>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(technologies.packageDetails.devDependencies).map(([name, version]) => (
                            <li key={name} className="py-2">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                                <span className="text-gray-500 dark:text-gray-400">{version}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contributors */}
              {repoInfo && repoInfo.contributors && repoInfo.contributors.length > 0 && (
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 transition-colors">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('dashboard.contributors.title')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {repoInfo.contributors.slice(0, 8).map((contributor) => (
                      <div key={contributor.login} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
                        <img 
                          src={contributor.avatar_url} 
                          alt={`${contributor.login} avatar`} 
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div>
                          <a 
                            href={`https://github.com/${contributor.login}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {contributor.login}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{contributor.contributions} {t('dashboard.contributors.commits')}</p>
                        </div>
                      </div>
                    ))}
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

export default DashboardPage; 