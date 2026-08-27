const { getDriver } = require('./db');

// Get all movies with their actors and genres
async function getAllMovies() {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Movie)
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
      WITH m, [name IN COLLECT(DISTINCT g.name) WHERE name IS NOT NULL] AS genres
      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
      WITH m, genres, [actor IN COLLECT(DISTINCT CASE WHEN a IS NULL THEN NULL ELSE {id: a.id, name: a.name} END) WHERE actor IS NOT NULL] AS actors
      RETURN {id: m.id, title: m.title, releaseYear: m.releaseYear, rating: m.rating, description: m.description, genres: genres, actors: actors} AS movie
      ORDER BY m.rating DESC
    `);

    return result.records.map(record => record.get('movie'));
  } finally {
    await session.close();
  }
}

// Get a single movie with details (2-hop: Movie <- Actor and Movie -> Genre)
async function getMovieById(movieId) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Movie {id: $movieId})
      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
      WITH m, [actor IN COLLECT(DISTINCT CASE WHEN a IS NULL THEN NULL ELSE {id: a.id, name: a.name, birthYear: a.birthYear} END) WHERE actor IS NOT NULL] AS actors
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
      WITH m, actors, [genre IN COLLECT(DISTINCT CASE WHEN g IS NULL THEN NULL ELSE {id: g.id, name: g.name} END) WHERE genre IS NOT NULL] AS genres
      RETURN {id: m.id, title: m.title, releaseYear: m.releaseYear, rating: m.rating, description: m.description, actors: actors, genres: genres} AS movie
    `, { movieId });

    const records = result.records;
    return records.length > 0 ? records[0].get('movie') : null;
  } finally {
    await session.close();
  }
}

// Get recommendations: movies with shared actors or genres (multi-hop traversal)
async function getRecommendations(movieId, limit = 5) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Movie {id: $movieId})
      MATCH (recommended:Movie)
      WHERE recommended.id <> m.id
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(sharedGenre:Genre)<-[:BELONGS_TO]-(recommended)
      OPTIONAL MATCH (m)<-[:ACTED_IN]-(sharedActor:Actor)-[:ACTED_IN]->(recommended)
      WITH m, recommended,
           COUNT(DISTINCT sharedGenre) AS sharedGenreCount,
           COUNT(DISTINCT sharedActor) AS sharedActorCount
      WHERE sharedGenreCount > 0 OR sharedActorCount > 0
      OPTIONAL MATCH (recommended)-[:BELONGS_TO]->(rg:Genre)
      
      WITH recommended, [name IN COLLECT(DISTINCT rg.name) WHERE name IS NOT NULL] AS genres
      OPTIONAL MATCH (ra:Actor)-[:ACTED_IN]->(recommended)
      WITH recommended, genres, [actor IN COLLECT(DISTINCT CASE WHEN ra IS NULL THEN NULL ELSE {id: ra.id, name: ra.name} END) WHERE actor IS NOT NULL] AS actors
      RETURN {id: recommended.id, title: recommended.title, releaseYear: recommended.releaseYear, rating: recommended.rating, description: recommended.description, genres: genres, actors: actors} AS movie
      ORDER BY recommended.rating DESC
      LIMIT $limit
    `, { movieId, limit });

    return result.records
      .map(record => record.get('movie'))
      .filter(movie => movie && movie.id !== movieId);
  } finally {
    await session.close();
  }
}

// Find movies by genre
async function getMoviesByGenre(genreId, limit = 10) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (g:Genre {id: $genreId})<-[:BELONGS_TO]-(m:Movie)
      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
      WITH m, [actor IN COLLECT(DISTINCT CASE WHEN a IS NULL THEN NULL ELSE {id: a.id, name: a.name} END) WHERE actor IS NOT NULL] AS actors
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(genre:Genre)
      WITH m, actors, [name IN COLLECT(DISTINCT genre.name) WHERE name IS NOT NULL] AS genres
      RETURN {id: m.id, title: m.title, releaseYear: m.releaseYear, rating: m.rating, description: m.description, genres: genres, actors: actors} AS movie
      ORDER BY m.rating DESC
      LIMIT $limit
    `, { genreId, limit });

    return result.records.map(record => record.get('movie'));
  } finally {
    await session.close();
  }
}

// Find all actors in a movie and other movies they appeared in
async function getActorDetails(actorId) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (a:Actor {id: $actorId})
      OPTIONAL MATCH (a)-[:ACTED_IN]->(m:Movie)
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
      RETURN a {
        .*,
        movies: [movie IN COLLECT(DISTINCT CASE WHEN m IS NULL THEN NULL ELSE {
          id: m.id,
          title: m.title,
          releaseYear: m.releaseYear,
          rating: m.rating,
          genres: []
        } END) WHERE movie IS NOT NULL]
      } as actor
    `, { actorId });

    const records = result.records;
    return records.length > 0 ? records[0].get('actor') : null;
  } finally {
    await session.close();
  }
}

// Get actors who appeared in a specific movie
async function getActorsByMovie(movieId) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (a:Actor)-[:ACTED_IN]->(m:Movie {id: $movieId})
      RETURN a {
        .*,
        otherMoviesCount: SIZE([
          (a)-[:ACTED_IN]->(other:Movie) WHERE other.id <> m.id | other
        ])
      } as actor
      ORDER BY a.name
    `, { movieId });

    return result.records.map(record => record.get('actor'));
  } finally {
    await session.close();
  }
}

// Advanced query: Find co-actors (actors who appeared in movies together)
async function findCoActors(actorId) {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (a:Actor {id: $actorId})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Actor)
      WHERE coActor.id <> a.id
      RETURN DISTINCT coActor {
        .*,
        sharedMovies: COLLECT(DISTINCT m {
          id: m.id,
          title: m.title,
          releaseYear: m.releaseYear
        })
      } as actor
      ORDER BY SIZE(coActor.sharedMovies) DESC
    `, { actorId });

    return result.records.map(record => record.get('actor'));
  } finally {
    await session.close();
  }
}

// Get all genres
async function getAllGenres() {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (g:Genre)
      RETURN g {
        .*,
        movieCount: SIZE([
          (g)<-[:BELONGS_TO]-(m:Movie) | m
        ])
      } as genre
      ORDER BY g.name
    `);

    return result.records.map(record => record.get('genre'));
  } finally {
    await session.close();
  }
}

module.exports = {
  getAllMovies,
  getMovieById,
  getRecommendations,
  getMoviesByGenre,
  getActorDetails,
  getActorsByMovie,
  findCoActors,
  getAllGenres,
};
