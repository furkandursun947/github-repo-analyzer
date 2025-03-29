import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TechnologySchemaPage from './pages/TechnologySchemaPage';
import { RepositoryProvider } from './contexts/RepositoryContext';
import './App.css'

function App() {
  return (
    <RepositoryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tech-schema" element={<TechnologySchemaPage />} />
        </Routes>
      </Router>
    </RepositoryProvider>
  );
}

export default App;
