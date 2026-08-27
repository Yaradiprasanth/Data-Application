import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../App';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [moviesRes, genresRes] = await Promise.all([
        apiClient.get('/movies'),
        apiClient.get('/genres'),
      ]);
      setMovies(moviesRes.data);
      setGenres(genresRes.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = selectedGenre
    ? movies.filter(m => m.genres && m.genres.includes(selectedGenre))
    : movies;

  return (
    <div className="container">
      <div className="header">
        <h1>🎬 Movie Recommendation Engine</h1>
        <p>Discover movies powered by graph database technology</p>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading movies and genres...</div>
      ) : (
        <>
          {/* Genre Filter */}
          {genres.length > 0 && (
            <div className="section" style={{ marginBottom: '30px' }}>
              <h2>🎭 Filter by Genre</h2>
              <div className="tags" style={{ gap: '10px' }}>
                <button
                  className="tag"
                  style={{
                    cursor: 'pointer',
                    background: !selectedGenre ? '#667eea' : '#e8f0ff',
                    color: !selectedGenre ? 'white' : '#667eea',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                  }}
                  onClick={() => setSelectedGenre(null)}
                >
                  All ({movies.length})
                </button>
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    className="tag"
                    style={{
                      cursor: 'pointer',
                      background: selectedGenre === genre.id ? '#667eea' : '#e8f0ff',
                      color: selectedGenre === genre.id ? 'white' : '#667eea',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '20px',
                    }}
                    onClick={() => setSelectedGenre(genre.id)}
                  >
                    {genre.name} ({genre.movieCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Movies Grid */}
          {filteredMovies.length === 0 ? (
            <div className="empty-state">
              <h2>No movies found</h2>
              <p>Try selecting a different filter.</p>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>
                📽️ Movies {selectedGenre && `in ${genres.find(g => g.id === selectedGenre)?.name}`}
              </h2>
              <div className="grid">
                {filteredMovies.map(movie => (
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
                          {movie.releaseYear} • {movie.description}
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
                        {movie.actors && movie.actors.length > 0 && (
                          <div className="actor-list">
                            <strong>Cast:</strong>
                            {movie.actors.slice(0, 3).map(actor => (
                              <div key={actor.id} className="actor-name">
                                • {actor.name}
                              </div>
                            ))}
                            {movie.actors.length > 3 && (
                              <div style={{ color: '#999', marginTop: '5px' }}>
                                +{movie.actors.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
