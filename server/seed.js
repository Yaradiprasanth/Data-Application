require('dotenv').config();
const { getDriver, initializeDriver, closeDriver } = require('./db');

async function seedDatabase() {
  try {
    await initializeDriver();
    const driver = getDriver();
    const session = driver.session();

    console.log('🌱 Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('🌱 Creating actors...');
    const actorQueries = [
      'CREATE (a:Actor {id: "tom-hanks", name: "Tom Hanks", birthYear: 1956})',
      'CREATE (a:Actor {id: "meg-ryan", name: "Meg Ryan", birthYear: 1961})',
      'CREATE (a:Actor {id: "gary-oldman", name: "Gary Oldman", birthYear: 1958})',
      'CREATE (a:Actor {id: "christian-bale", name: "Christian Bale", birthYear: 1974})',
      'CREATE (a:Actor {id: "heath-ledger", name: "Heath Ledger", birthYear: 1979})',
      'CREATE (a:Actor {id: "aaron-paul", name: "Aaron Paul", birthYear: 1979})',
      'CREATE (a:Actor {id: "anna-gunn", name: "Anna Gunn", birthYear: 1968})',
      'CREATE (a:Actor {id: "leonardo-dicaprio", name: "Leonardo DiCaprio", birthYear: 1974})',
    ];
    for (const query of actorQueries) {
      await session.run(query);
    }

    console.log('🌱 Creating genres...');
    const genreQueries = [
      'CREATE (g:Genre {id: "romance", name: "Romance"})',
      'CREATE (g:Genre {id: "drama", name: "Drama"})',
      'CREATE (g:Genre {id: "thriller", name: "Thriller"})',
      'CREATE (g:Genre {id: "action", name: "Action"})',
      'CREATE (g:Genre {id: "sci-fi", name: "Science Fiction"})',
    ];
    for (const query of genreQueries) {
      await session.run(query);
    }

    console.log('🌱 Creating movies and relationships...');
    const movies = [
      {
        id: 'sleepless-in-seattle',
        title: 'Sleepless in Seattle',
        releaseYear: 1993,
        rating: 6.8,
        actors: ['tom-hanks', 'meg-ryan'],
        genres: ['romance', 'drama'],
        description: 'A widower entrusts his son with the task of finding him a new wife.',
      },
      {
        id: 'you-ve-got-mail',
        title: "You've Got Mail",
        releaseYear: 1998,
        rating: 6.8,
        actors: ['tom-hanks', 'meg-ryan'],
        genres: ['romance', 'drama'],
        description: 'Two business rivals navigate romance via email.',
      },
      {
        id: 'the-dark-knight',
        title: 'The Dark Knight',
        releaseYear: 2008,
        rating: 9.0,
        actors: ['christian-bale', 'heath-ledger', 'gary-oldman'],
        genres: ['action', 'drama', 'thriller'],
        description: 'Batman faces off against the Joker.',
      },
      {
        id: 'batman-begins',
        title: 'Batman Begins',
        releaseYear: 2005,
        rating: 8.3,
        actors: ['christian-bale', 'gary-oldman'],
        genres: ['action', 'drama'],
        description: 'Bruce Wayne becomes Batman.',
      },
      {
        id: 'breaking-bad-movie',
        title: 'El Camino',
        releaseYear: 2019,
        rating: 6.3,
        actors: ['aaron-paul', 'anna-gunn'],
        genres: ['drama', 'thriller'],
        description: 'Jesse Pinkman escapes his captors.',
      },
      {
        id: 'inception',
        title: 'Inception',
        releaseYear: 2010,
        rating: 8.8,
        actors: ['leonardo-dicaprio'],
        genres: ['action', 'sci-fi', 'thriller'],
        description: 'A thief specializes in corporate espionage using dream-sharing technology.',
      },
    ];

    for (const movie of movies) {
      await session.run(
        `CREATE (m:Movie {
          id: $id,
          title: $title,
          releaseYear: $releaseYear,
          rating: $rating,
          description: $description
        })`,
        movie
      );

      // Create ACTED_IN relationships
      for (const actorId of movie.actors) {
        await session.run(
          `MATCH (m:Movie {id: $movieId}), (a:Actor {id: $actorId})
           CREATE (a)-[:ACTED_IN]->(m)`,
          { movieId: movie.id, actorId }
        );
      }

      // Create BELONGS_TO relationships
      for (const genreId of movie.genres) {
        await session.run(
          `MATCH (m:Movie {id: $movieId}), (g:Genre {id: $genreId})
           CREATE (m)-[:BELONGS_TO]->(g)`,
          { movieId: movie.id, genreId }
        );
      }
    }

    console.log('🌱 Creating SIMILAR_TO relationships based on shared genres/actors...');
    await session.run(`
      MATCH (m1:Movie)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(m2:Movie)
      WHERE m1.id < m2.id
      WITH m1, m2, COUNT(DISTINCT g) as commonGenres
      MERGE (m1)-[r:SIMILAR_TO]-(m2)
      SET r.commonGenres = commonGenres
    `);

    console.log('✓ Database seeded successfully!');
    await session.close();
  } catch (error) {
    console.error('✗ Seed error:', error.message);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

seedDatabase();
