import axios from 'axios';

// API için temel URL - ortama göre değişebilir
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// GitHub repo bilgilerini almak için API çağrısı
export const getRepoInfo = async (repoUrl: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/repo/info`, {
      params: { url: repoUrl }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching repo info:', error);
    throw error;
  }
};

// GitHub repo dil istatistiklerini almak için API çağrısı
export const getRepoLanguages = async (repoUrl: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/repo/languages`, {
      params: { url: repoUrl }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching repo languages:', error);
    throw error;
  }
};

// GitHub repo teknolojilerini almak için API çağrısı
export const getRepoTechnologies = async (repoUrl: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/repo/technologies`, {
      params: { url: repoUrl }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching repo technologies:', error);
    throw error;
  }
}; 