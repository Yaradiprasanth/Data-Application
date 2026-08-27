require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDriver, closeDriver } = require('./db');
const queries = require('./queries');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling for database
let dbConnected = false;

// Initialize database on startup
(async () => {
  try {
    await initializeDriver();
    dbConnected = true;
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    console.error('The API will remain available and report a disconnected health status.');
  }
})();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: dbConnected ? 'connected' : 'disconnected' });
});

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const movies = await queries.getAllMovies();
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies', details: error.message });
  }
});

// Get movie by ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const movie = await queries.getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie', details: error.message });
  }
});

// Get recommendations for a movie
app.get('/api/movies/:id/recommendations', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const limit = parseInt(req.query.limit) || 5;
    const recommendations = await queries.getRecommendations(req.params.id, limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
  }
});

// Get movies by genre
app.get('/api/genres/:id/movies', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const movies = await queries.getMoviesByGenre(req.params.id);
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({ error: 'Failed to fetch movies', details: error.message });
  }
});

// Get actor details
app.get('/api/actors/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const actor = await queries.getActorDetails(req.params.id);
    if (!actor) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    res.json(actor);
  } catch (error) {
    console.error('Error fetching actor:', error);
    res.status(500).json({ error: 'Failed to fetch actor', details: error.message });
  }
});

// Get co-actors (actors who worked together)
app.get('/api/actors/:id/coactors', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const coactors = await queries.findCoActors(req.params.id);
    res.json(coactors);
  } catch (error) {
    console.error('Error fetching co-actors:', error);
    res.status(500).json({ error: 'Failed to fetch co-actors', details: error.message });
  }
});

// Get all genres
app.get('/api/genres', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database connection lost' });
    }
    const genres = await queries.getAllGenres();
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres', details: error.message });
  }
});

// Serve the production React build from the same process as the API.
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Closing database connection...');
  await closeDriver();
  process.exit(0);
});
