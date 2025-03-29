import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRepository } from '../contexts/RepositoryContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';
import Footer from '../components/Footer';

const HomePage = () => {
  const { t } = useTranslation();
  const { setRepoUrl, clearAnalysis } = useRepository();
  const [localRepoUrl, setLocalRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form gönderimini işleyen fonksiyon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Temel URL doğrulama
    if (!localRepoUrl) {
      setError(t('home.errors.emptyUrl'));
      return;
    }

    try {
      // GitHub URL formatını kontrol et - hem organizasyon hem de repo URL'lerini kabul eder
      const urlPattern = /^https?:\/\/github\.com\/[\w-]+(?:\/[\w.-]+)?\/?$/;
      if (!urlPattern.test(localRepoUrl)) {
        setError(t('home.errors.invalidUrl'));
        return;
      }

      // Yükleniyor durumunu ayarla
      setIsLoading(true);
      
      // Always clear previous analysis data first - ensures fresh data fetch
      clearAnalysis();
      
      // Store the URL in the context
      setRepoUrl(localRepoUrl);

      // Navigate to dashboard with the URL as query param and indicate this is a new analysis
      navigate(`/dashboard?url=${encodeURIComponent(localRepoUrl)}&fresh=true`);
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
      setError(t('home.errors.generalError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col transition-colors">
      <div className="absolute top-4 right-4 flex space-x-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-dark-text">
            {t('app.title')}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('app.description')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-dark-card py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('home.repoUrlLabel')}
                </label>
                <div className="mt-1">
                  <input
                    id="repoUrl"
                    name="repoUrl"
                    type="text"
                    required
                    placeholder={t('home.repoUrlPlaceholder')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    value={localRepoUrl}
                    onChange={(e) => setLocalRepoUrl(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-dark-bg disabled:opacity-50 transition-colors"
                >
                  {isLoading ? t('home.loading') : t('home.analyzeButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage; 