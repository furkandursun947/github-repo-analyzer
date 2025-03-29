import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions
export interface RepoInfo {
  repoInfo: {
    name: string;
    description: string;
    owner: {
      login: string;
      avatar_url: string;
    };
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    created_at: string;
    updated_at: string;
    html_url: string;
  };
  contributors: Array<{
    login: string;
    avatar_url: string;
    contributions: number;
  }>;
  isOrganization?: boolean;
  allRepos?: Array<{
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
  }>;
  organization?: {
    login: string;
    name: string;
    description: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    public_members_url: string;
    repos_url: string;
  };
  isUser?: boolean;
  userInfo?: {
    login: string;
    name: string;
    bio: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
  };
}

export interface TechnologiesData {
  technologies: string[];
  packageDetails: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
}

interface RepositoryContextType {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  repoInfo: RepoInfo | null;
  setRepoInfo: (info: RepoInfo | null) => void;
  languages: Record<string, number>;
  setLanguages: (langs: Record<string, number>) => void;
  technologies: TechnologiesData | null;
  setTechnologies: (techs: TechnologiesData | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearAnalysis: () => void;
  analyzed: boolean;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

interface RepositoryProviderProps {
  children: ReactNode;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
  // Get any saved state from localStorage
  const getSavedState = () => {
    try {
      const savedAnalysis = localStorage.getItem('repoAnalysis');
      if (savedAnalysis) {
        const parsedData = JSON.parse(savedAnalysis);
        return {
          repoUrl: parsedData.repoUrl || '',
          repoInfo: parsedData.repoInfo || null,
          languages: parsedData.languages || {},
          technologies: parsedData.technologies || null,
          analyzed: !!parsedData.repoUrl
        };
      }
    } catch (err) {
      console.error('Error parsing saved repo analysis:', err);
    }
    return {
      repoUrl: '',
      repoInfo: null,
      languages: {},
      technologies: null,
      analyzed: false
    };
  };

  const savedState = getSavedState();

  // State definitions
  const [repoUrl, setRepoUrl] = useState<string>(savedState.repoUrl);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(savedState.repoInfo);
  const [languages, setLanguages] = useState<Record<string, number>>(savedState.languages);
  const [technologies, setTechnologies] = useState<TechnologiesData | null>(savedState.technologies);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState<boolean>(savedState.analyzed);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (repoUrl) {
      localStorage.setItem('repoAnalysis', JSON.stringify({
        repoUrl,
        repoInfo,
        languages,
        technologies,
      }));
      setAnalyzed(true);
    }
  }, [repoUrl, repoInfo, languages, technologies]);

  // Clear all analysis data
  const clearAnalysis = () => {
    setRepoUrl('');
    setRepoInfo(null);
    setLanguages({});
    setTechnologies(null);
    setError(null);
    setAnalyzed(false);
    localStorage.removeItem('repoAnalysis');
    // Clear any cached data that might be in memory
    window.sessionStorage.clear();
  };

  return (
    <RepositoryContext.Provider value={{
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
      clearAnalysis,
      analyzed
    }}>
      {children}
    </RepositoryContext.Provider>
  );
};

// Custom hook for using the repository context
export const useRepository = (): RepositoryContextType => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}; 