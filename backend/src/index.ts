import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { repoRoutes } from './routes/repo.routes';

// Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/repo', repoRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'GitHub Repo Analyzer API running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 