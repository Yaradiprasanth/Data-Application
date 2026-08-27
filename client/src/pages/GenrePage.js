import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../App';

export default function GenrePage() {
  const { id } = useParams();
  const [movies, setMovies] = useState([]);
  const [genreName, setGenreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [moviesRes, genresRes] = await Promise.all([
        apiClient.get(`/genres/${id}/movies`),
        apiClient.get('/genres'),
      ]);
      setMovies(moviesRes.data);
      const genre = genresRes.data.find(item => item.id === id);
      setGenreName(genre?.name || '');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching genre movies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Link to="/" className="btn back-btn">← Back to Home</Link>

      <div className="header">
        <h1>🎬 {genreName || 'Genre'}</h1>
        <p>{movies.length} movies in this genre</p>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading movies...</div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <h2>No movies found</h2>
          <p>This genre has no movies yet.</p>
        </div>
      ) : (
        <div className="grid">
          {movies.map(movie => (
            <Link
              key={movie.id}
              to={`/movie/${movie.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card">
                <div className="card-header">
                  <div className="card-title">{movie.title}</div>
                </div>
                <div className="card-body">
                  <div className="card-subtitle">
                    {movie.releaseYear}
                  </div>
                  {movie.rating && (
                    <div className="rating">⭐ {movie.rating}</div>
                  )}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="tags">
                      {movie.genres.map(genre => (
                        <span key={genre} className="tag">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
