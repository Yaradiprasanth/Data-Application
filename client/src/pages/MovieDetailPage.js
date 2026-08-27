import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../App';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [movieRes, recsRes] = await Promise.all([
        apiClient.get(`/movies/${id}`),
        apiClient.get(`/movies/${id}/recommendations`),
      ]);
      setMovie(movieRes.data);
      setRecommendations(recsRes.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading movie details...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container">
        <Link to="/" className="btn back-btn">← Back to Home</Link>
        <div className="error">
          <strong>Error:</strong> {error || 'Movie not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/" className="btn back-btn">← Back to Home</Link>

      <div className="detail-view">
        <div className="detail-header">
          <h1>{movie.title}</h1>
          {movie.rating && <div className="rating">⭐ {movie.rating}/10</div>}
          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Release Year</span>
              <span className="meta-value">{movie.releaseYear}</span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="meta-item">
                <span className="meta-label">Genres</span>
                <div className="tags">
                  {movie.genres.map(g => (
                    <span key={g.id} className="tag">{g.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {movie.description && (
          <div className="section">
            <h2>📖 Synopsis</h2>
            <p style={{ lineHeight: '1.6', fontSize: '1.05em', color: '#555' }}>
              {movie.description}
            </p>
          </div>
        )}

        {movie.actors && movie.actors.length > 0 && (
          <div className="section">
            <h2>🎭 Cast</h2>
            <div className="section-content">
              {movie.actors.map(actor => (
                <Link
                  key={actor.id}
                  to={`/actor/${actor.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="person-card">
                    <strong>{actor.name}</strong>
                    {actor.birthYear && (
                      <div className="person-meta">
                        Born {actor.birthYear}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div className="section">
            <h2>🎬 Recommended Movies</h2>
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95em' }}>
              Based on shared genres and actors
            </p>
            <div className="grid">
              {recommendations.map(rec => (
                <Link
                  key={rec.id}
                  to={`/movie/${rec.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">{rec.title}</div>
                    </div>
                    <div className="card-body">
                      <div className="card-subtitle">{rec.releaseYear}</div>
                      {rec.rating && <div className="rating">⭐ {rec.rating}</div>}
                      {rec.genres && rec.genres.length > 0 && (
                        <div className="tags">
                          {rec.genres.map(g => (
                            <span key={g.id} className="tag">{g.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
