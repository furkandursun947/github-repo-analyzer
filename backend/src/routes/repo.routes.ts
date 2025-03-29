import express, { RequestHandler } from 'express';
import { getRepoInfo, getRepoLanguages, getRepoTechnologies } from '../controllers/repo.controller';

const router = express.Router();

// Get basic repository information
router.get('/info', getRepoInfo as RequestHandler);

// Get repository languages
router.get('/languages', getRepoLanguages as RequestHandler);

// Get repository technologies
router.get('/technologies', getRepoTechnologies as RequestHandler);

export const repoRoutes = router; 