# GitHub Repo Analyzer

This application is an analysis tool that provides detailed information about a GitHub repository (technologies used, languages, dependencies, etc.) by taking a GitHub repo URL.

Check the site: https://github-repo-analyzer-furkandursun.vercel.app/

## Features

- GitHub repo analysis
- Visual graph of languages used
- List of detected technologies
- Detailed view of package dependencies
- List of contributors

## Technology Stack

### Frontend

- React + TypeScript
- Tailwind CSS
- React Router
- Chart.js & React-ChartJS-2
- Axios

### Backend

- Node.js + Express
- TypeScript
- GitHub API Integration

### Deployment
- Vercel

## Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Backend Installation

```bash
# Go to Backend directory
cd github-analyzer/backend

# Install dependencies
npm install

# Create .env file (optional but recommended)
cp .env.example .env
# You can add a GitHub token by editing the .env file

# Start the server
npm run dev
```

### Frontend Installation

```bash
# Go to Frontend directory
cd github-analyzer/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Open the frontend application (default: http://localhost:5173/)
2. Enter the GitHub repo URL you want to analyze (e.g., https://github.com/username/repo)
3. Click the "Analyze" button
4. View detailed analysis about the repo

## License

MIT

# github-repo-analyzer
