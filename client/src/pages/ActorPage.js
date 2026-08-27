import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../App';

export default function ActorPage() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [coactors, setCoactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actorRes, coactorsRes] = await Promise.all([
        apiClient.get(`/actors/${id}`),
        apiClient.get(`/actors/${id}/coactors`),
      ]);
      setActor(actorRes.data);
      setCoactors(coactorsRes.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching actor data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading actor details...</div>
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="container">
        <Link to="/" className="btn back-btn">← Back to Home</Link>
        <div className="error">
          <strong>Error:</strong> {error || 'Actor not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/" className="btn back-btn">← Back to Home</Link>

      <div className="detail-view">
        <div className="detail-header">
          <h1>{actor.name}</h1>
          {actor.birthYear && (
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Birth Year</span>
                <span className="meta-value">{actor.birthYear}</span>
              </div>
            </div>
          )}
        </div>

        {actor.movies && actor.movies.length > 0 && (
          <div className="section">
            <h2>🎬 Filmography</h2>
            <div className="grid">
              {actor.movies.map(movie => (
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
                      <div className="card-subtitle">{movie.releaseYear}</div>
                      {movie.rating && (
                        <div className="rating">⭐ {movie.rating}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {coactors && coactors.length > 0 && (
          <div className="section">
            <h2>👥 Co-Actors</h2>
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95em' }}>
              Actors who appeared in the same movies
            </p>
            <div className="grid">
              {coactors.map(coactor => (
                <Link
                  key={coactor.id}
                  to={`/actor/${coactor.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">{coactor.name}</div>
                    </div>
                    <div className="card-body">
                      <div style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '10px' }}>
                        Shared movies: {coactor.sharedMovies?.length || 0}
                      </div>
                      {coactor.sharedMovies && coactor.sharedMovies.length > 0 && (
                        <div>
                          <strong style={{ color: '#666' }}>Appeared together in:</strong>
                          {coactor.sharedMovies.map(movie => (
                            <div key={movie.id} style={{ color: '#999', fontSize: '0.9em', marginTop: '5px' }}>
                              • {movie.title} ({movie.releaseYear})
                            </div>
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

        {(!coactors || coactors.length === 0) && (!actor.movies || actor.movies.length === 0) && (
          <div className="empty-state">
            <h2>No data available</h2>
            <p>This actor has no associated movies or co-actors.</p>
          </div>
        )}
      </div>
    </div>
  );
}
