import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 bg-white dark:bg-dark-card shadow-md mt-auto transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-2 md:mb-0">
            &copy; {currentYear} {t('app.title')}
          </div>
          <div className="flex items-center">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {t('app.footer.developer')}{' '}
              <a 
                href="https://github.com/furkanemredursun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Furkan Emre Dursun
              </a>
            </div>
            <span className="mx-2 text-gray-400 dark:text-gray-600">•</span>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              <a 
                href="https://github.com/furkanemredursun/github-analyzer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('app.footer.sourceCode')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 