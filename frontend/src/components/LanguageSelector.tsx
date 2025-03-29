import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Dil seçenekleri
const languageOptions = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında dropdown'u kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Aktif dili bulma
  const activeLanguage = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[1]; // Fallback to English

  // Dil değiştirme fonksiyonu
  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 rounded-lg bg-gray-200 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-1">{activeLanguage.flag}</span>
        <span className="hidden sm:inline-block">{t(`language.${activeLanguage.code}`)}</span>
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg z-10 overflow-hidden transition-all origin-top-right ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {languageOptions.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`
                  w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${language.code === i18n.language ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}
                `}
              >
                <span className="mr-2">{language.flag}</span>
                {t(`language.${language.code}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 