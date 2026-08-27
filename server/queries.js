const { getDriver } = require('./db');

// Get all movies with their actors and genres
async function getAllMovies() {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Movie)
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
      RETURN m {
        .*,
        genres: COLLECT(DISTINCT g.name),
        actors: COLLECT(DISTINCT a {id: a.id, name: a.name})
      } as movie
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
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
      RETURN m {
        .*,
        actors: COLLECT(DISTINCT a {id: a.id, name: a.name, birthYear: a.birthYear}),
        genres: COLLECT(DISTINCT g {id: g.id, name: g.name})
      } as movie
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
      // Find movies through shared actors (2-hop: Movie -> Actor -> Movie)
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(similar:Movie)
      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)-[:ACTED_IN]-(similarActor:Movie)
      WITH similar, similarActor, m
      WHERE similar.id <> m.id AND similarActor.id <> m.id
      WITH COALESCE(similar, similarActor) as recommended
      WHERE recommended IS NOT NULL
      
      OPTIONAL MATCH (recommended)-[:BELONGS_TO]->(rg:Genre)
      OPTIONAL MATCH (ra:Actor)-[:ACTED_IN]->(recommended)
      
      RETURN DISTINCT recommended {
        .*,
        genres: COLLECT(DISTINCT rg.name),
        actors: COLLECT(DISTINCT ra {id: ra.id, name: ra.name})
      } as movie
      ORDER BY recommended.rating DESC
      LIMIT $limit
    `, { movieId, limit });

    return result.records.map(record => record.get('movie'));
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
      OPTIONAL MATCH (m)-[:BELONGS_TO]->(genre:Genre)
      RETURN m {
        .*,
        genres: COLLECT(DISTINCT genre.name),
        actors: COLLECT(DISTINCT a {id: a.id, name: a.name})
      } as movie
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
        movies: COLLECT(DISTINCT m {
          id: m.id,
          title: m.title,
          releaseYear: m.releaseYear,
          rating: m.rating,
          genres: []
        })
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
