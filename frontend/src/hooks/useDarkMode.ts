import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useDarkMode = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Yerel depolamadan tema tercihini al veya varsayılan olarak 'light' kullan
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Eğer sistem karanlık tema kullanıyorsa ve kullanıcı henüz bir tema seçmediyse dark tema kullan
    if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return savedTheme || 'light';
  });

  // Tema değiştiğinde belgeye dark sınıfını ekle/çıkar
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Yerel depolamada tema tercihini kaydet
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Temayı değiştirmek için fonksiyon
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return [theme, toggleTheme];
}; 