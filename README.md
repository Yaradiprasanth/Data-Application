# 🎬 Movie Recommendation Engine

A graph database application built with **CognoDB** that demonstrates the power of graph data modeling for relationship-based movie recommendations.

## 📋 Table of Contents

- [Overview](#overview)
- [Why a Graph Database?](#why-a-graph-database)
- [Data Model](#data-model)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Key Queries](#key-queries)
- [Technical Stack](#technical-stack)
- [Features](#features)

---

## Overview

**Movie Recommendation Engine** is a full-stack web application that leverages CognoDB (a managed graph database) to provide intelligent movie recommendations based on:

- 🎭 **Shared actors** — Find movies through actor connections
- 🎬 **Similar genres** — Discover movies in related categories  
- 👥 **Co-actor networks** — Explore connections between actors who worked together

The application demonstrates multi-hop graph traversals and queries that would be awkward or inefficient in a relational database.

### Live Demo
**URL**: [Add your hosted link here]

---

## Why a Graph Database?

### The Problem
In a traditional relational database, answering questions like *"Which movies should I watch if I like Batman Begins?"* requires multiple JOINs:

```sql
-- Relational approach (3+ JOINs)
SELECT DISTINCT m2.* FROM movies m1
JOIN movie_actors ma1 ON m1.id = ma1.movie_id
JOIN actors a ON ma1.actor_id = a.id
JOIN movie_actors ma2 ON a.id = ma2.actor_id
JOIN movies m2 ON ma2.movie_id = m2.id
WHERE m1.id = 'batman-begins' AND m2.id != m1.id;
-- Plus similar logic for genres, co-actors, etc.
```

### The Graph Solution
With CognoDB, we express the same relationship as a simple graph traversal:

```cypher
// Graph approach (1 query, intuitive)
MATCH (m1:Movie {id: 'batman-begins'})
MATCH (m1)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(m2:Movie)
WHERE m2.id <> m1.id
RETURN DISTINCT m2
ORDER BY m2.rating DESC
```

### Why Graph Excels Here

| Aspect | Relational | Graph |
|--------|-----------|-------|
| **Query complexity** | Multiple JOINs, explicit table relationships | Intuitive relationship traversal |
| **Multi-hop queries** | N JOINs for N-hop paths (slow) | Native multi-hop (fast) |
| **Relationship semantics** | Implicit in foreign keys | Explicit relationship types |
| **Query readability** | SQL verbose | Cypher clear and expressive |
| **Performance** | Degrades with relationship depth | Consistent regardless of depth |

**Recommendation engines, social networks, knowledge graphs, and organizational hierarchies all thrive on graph databases.**

---

## Data Model

### Nodes

```
┌─────────────────────┐
│      MOVIE          │
├─────────────────────┤
│ id (string, unique) │
│ title               │
│ releaseYear         │
│ rating              │
│ description         │
└─────────────────────┘

┌─────────────────────┐
│      ACTOR          │
├─────────────────────┤
│ id (string, unique) │
│ name                │
│ birthYear           │
└─────────────────────┘

┌─────────────────────┐
│      GENRE          │
├─────────────────────┤
│ id (string, unique) │
│ name                │
└─────────────────────┘
```

### Relationships

```
Actor -[ACTED_IN]-> Movie
Movie -[BELONGS_TO]-> Genre
Movie -[SIMILAR_TO]- Movie  (properties: commonGenres)
```

### Entity-Relationship Diagram

```
┌────────┐
│ ACTOR  │
└───┬────┘
    │
    │ ACTED_IN
    │
    ▼
┌────────────┐      BELONGS_TO      ┌────────┐
│   MOVIE    ├─────────────────────>│ GENRE  │
└───┬────────┘                       └────────┘
    │
    │ SIMILAR_TO
    │ (bidirectional)
    ▼
  MOVIE
```

### Sample Data

- **6 Movies**: Sleepless in Seattle, You've Got Mail, The Dark Knight, Batman Begins, El Camino, Inception
- **8 Actors**: Tom Hanks, Meg Ryan, Gary Oldman, Christian Bale, Heath Ledger, Aaron Paul, Anna Gunn, Leonardo DiCaprio
- **5 Genres**: Romance, Drama, Thriller, Action, Science Fiction

---

## Architecture

### System Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
│  - HomePage, MovieDetailPage, GenrePage, ActorPage        │
│  - Responsive UI with loading/error states                │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP/JSON
                     ▼
┌────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                      │
│  - RESTful API endpoints                                  │
│  - Error handling & database connection management        │
│  - Environment-based configuration                        │
└────────────────────┬─────────────────────────────────────┘
                     │ Cypher Queries
                     ▼
┌────────────────────────────────────────────────────────────┐
│              NEO4J DRIVER (Connection Pool)                │
│  - Parameterized queries (no string concatenation)       │
│  - Connection lifecycle management                        │
└────────────────────┬─────────────────────────────────────┘
                     │ Bolt 5.0-5.4 Protocol
                     ▼
┌────────────────────────────────────────────────────────────┐
│           COGNODB CLOUD (Managed Graph DB)                 │
│  - Persistent data storage                                │
│  - ACID transactions                                      │
│  - Cypher query engine                                    │
└────────────────────────────────────────────────────────────┘
```

### Project Structure

```
.
├── server/
│   ├── index.js          # Express server, routes, error handling
│   ├── db.js             # Database driver initialization & connection
│   ├── queries.js        # Parameterized Cypher queries
│   ├── seed.js           # Database seeding script
│   └── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js        # Main app, routing, DB connection check
│   │   ├── index.js      # React entry point
│   │   ├── index.css     # Global styles
│   │   └── pages/
│   │       ├── HomePage.js          # Movie listing & genre filter
│   │       ├── MovieDetailPage.js   # Movie details & recommendations
│   │       ├── GenrePage.js         # Movies by genre
│   │       └── ActorPage.js         # Actor details & co-actors
│   └── package.json
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore rules
├── package.json          # Root package.json
└── README.md             # This file
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v16+ and npm
- **CognoDB Cloud Account** (free tier available at https://console.cognodb.com)
- **Git**

### Step 1: Create CognoDB Instance

1. Go to https://console.cognodb.com/signup and sign up (free tier, no credit card required)
2. Create a free (c0) instance and note the region
3. Wait for provisioning (~1 minute)
4. Copy your connection details:
   - **URI**: `bolt+s://<instance-id>.databases.cognodb.cloud`
   - **Username**: `cognodb`
   - **Password**: (shown once, save immediately)

### Step 2: Clone and Setup Repository

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/movie-recommendation-engine.git
cd movie-recommendation-engine

# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

### Step 3: Configure Environment Variables

```bash
# Create .env file in root directory
cp .env.example .env

# Edit .env with your CognoDB credentials
cat > .env << EOF
COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your-password-here
PORT=5000
NODE_ENV=development
EOF
```

**⚠️ Security Note**: Never commit `.env` to version control. Use `.env.example` as a template.

### Step 4: Seed Database

```bash
# From root directory
npm run seed
```

Expected output:
```
✓ Connected to CognoDB
🌱 Clearing existing data...
🌱 Creating actors...
🌱 Creating genres...
🌱 Creating movies and relationships...
🌱 Creating SIMILAR_TO relationships based on shared genres/actors...
✓ Database seeded successfully!
```

---

## Running the Application

### Development Mode

**Terminal 1 — Backend (Port 5000):**
```bash
npm start
```

Expected: `✓ Server running on http://localhost:5000`

**Terminal 2 — Frontend (Port 3000):**
```bash
cd client && npm start
```

Expected: Browser opens http://localhost:3000

### Production Build

```bash
# Build frontend
npm run build

# Start backend only (serves static frontend)
PORT=5000 npm start
```

---

## API Endpoints

All endpoints are parameterized queries (no SQL injection risk).

### Movies

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/movies` | GET | Get all movies (sorted by rating) |
| `/api/movies/:id` | GET | Get single movie with actors & genres |
| `/api/movies/:id/recommendations` | GET | Get recommendations (multi-hop: 2+ hops) |

**Example:**
```bash
curl http://localhost:5000/api/movies/the-dark-knight
curl "http://localhost:5000/api/movies/inception/recommendations?limit=5"
```

### Genres

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/genres` | GET | Get all genres with movie counts |
| `/api/genres/:id/movies` | GET | Get movies in a genre |

### Actors

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/actors/:id` | GET | Get actor details with filmography |
| `/api/actors/:id/coactors` | GET | Get co-actors (2-hop: Actor → Movie → Actor) |

**Example:**
```bash
curl http://localhost:5000/api/actors/christian-bale
curl http://localhost:5000/api/actors/christian-bale/coactors
```

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check database connection status |

---

## Key Queries

### 1. Multi-Hop: Recommendations by Shared Genres

**Hops: 2** (Movie → Genre → Movie)

```cypher
MATCH (m:Movie {id: $movieId})
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(similar:Movie)
WHERE similar.id <> m.id
RETURN DISTINCT similar
ORDER BY similar.rating DESC
LIMIT $limit
```

**Why Graph**: Each shared genre creates a connection. In SQL, this requires:
- JOINs through movie_genres and genres tables
- DISTINCT to eliminate duplicates from multiple genre matches
- Complex WHERE clause for filtering

### 2. Multi-Hop: Co-Actors

**Hops: 3** (Actor → Movie → Actor)

```cypher
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
```

**Why Graph**: Native relationship traversal. In SQL:
- Multiple JOINs through movie_actors table
- Subquery to collect shared movies
- Difficult to maintain as requirements change

### 3. Relational Awkwardness: Find All Movies Connected to a Genre

**Standard way (relational):**
```sql
SELECT * FROM movies m
JOIN movie_genres mg ON m.id = mg.movie_id
JOIN genres g ON mg.genre_id = g.id
WHERE g.id = 'action';
```

**Graph way (intuitive):**
```cypher
MATCH (g:Genre {id: 'action'})<-[:BELONGS_TO]-(m:Movie)
RETURN m
ORDER BY m.rating DESC
```

The graph version reads like English: "Find movies that belong to the action genre."

### 4. Advanced: Degree Queries (How Well-Connected?)

```cypher
MATCH (a:Actor {id: $actorId})
RETURN a {
  .*,
  filmography_count: SIZE([
    (a)-[:ACTED_IN]->(m:Movie) | m
  ]),
  coactor_count: SIZE([
    (a)-[:ACTED_IN]-(other:Actor) | other
  ])
} as actor
```

**Why Graph**: Computing relationship counts is native. SQL requires separate COUNT subqueries.

---

## Technical Stack

### Frontend
- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **CSS3** — Styling (no build tools needed)

### Backend
- **Node.js** — Runtime
- **Express.js** — Web framework
- **neo4j-driver** — Official Neo4j driver for Cypher queries
- **dotenv** — Environment configuration
- **CORS** — Cross-origin requests

### Database
- **CognoDB Cloud** — Managed graph database (Cypher + Bolt protocol)
- Implements openCypher specification

### Deployment
- **Frontend**: Vercel, Netlify, or any static host
- **Backend**: Railway, Heroku, AWS, or any Node.js host
- **Database**: CognoDB Cloud (free tier)

---

## Features

### ✅ Implemented

- ✓ Full CRUD operations via Cypher queries
- ✓ Multi-hop graph traversals (2-3+ hops)
- ✓ Parameterized queries (no string concatenation)
- ✓ Seed script with realistic data (6 movies, 8 actors, 5 genres)
- ✓ Responsive React UI (mobile-friendly)
- ✓ Loading and error states
- ✓ Database connection health check
- ✓ Environment-based configuration
- ✓ RESTful API with graceful error handling
- ✓ Graph-native queries that demonstrate relationship-heavy use cases

### 🔄 Graph Traversals Demonstrated

1. **2-hop: Genre-based recommendations**
   - Movie → Genre → Movie

2. **2-hop: Actor filmography**
   - Actor → Movie → (retrieve movies)

3. **3-hop: Co-actor networks**
   - Actor → Movie → Actor → (filter & collect)

4. **2-hop: Similar movies**
   - Movie → Genre → Movie (SIMILAR_TO relationship)

---

## Usage Examples

### Homepage
- Browse all movies sorted by rating
- Filter by genre
- Click on a movie for details

### Movie Detail Page
- View full movie information
- See cast and genres
- Get **AI-powered recommendations** (multi-hop query)

### Actor Page
- View filmography
- See co-actors and shared movies (3-hop traversal)
- Navigate to co-actors' pages

---

## Debugging

### Database Connection Issues

```
Error: "Database connection lost"
```

**Solution:**
1. Verify `COGNODB_URI`, `COGNODB_USERNAME`, `COGNODB_PASSWORD` in `.env`
2. Check CognoDB Cloud console (status page)
3. Ensure instance is running (c0 instances auto-suspend after inactivity)
4. Test connection: `npm run seed` should display `✓ Connected to CognoDB`

### API Errors

**500 Internal Server Error:**
- Check backend server logs
- Verify Cypher query syntax in `server/queries.js`
- Ensure database has seed data (`npm run seed`)

**404 Not Found:**
- Verify entity ID exists in database (case-sensitive)
- Check Cypher query filters

---

## Performance Considerations

### Graph Database Advantages

| Query Type | Relational | Graph |
|------------|-----------|-------|
| Find actors in a movie | 1 JOIN | 1 traversal |
| Find co-actors | 2 JOINs | 2 traversals |
| Find movies by genre | 1 JOIN | 1 traversal |
| Find similar movies | 3+ JOINs | 2 traversals |

### Free Tier Limits

- **Connections**: Up to 200
- **Storage**: 1 GB disk
- **Compute**: 0.5 vCPU, 256 MB RAM (burstable)

**Recommendation:** Keep dataset under 100K nodes for optimal performance on free tier.

---

## Future Enhancements

- [ ] User ratings and reviews (User → [RATED] → Movie)
- [ ] Collaborative filtering (User → [LIKED] → Movie ← [LIKED] → User)
- [ ] Full-text search on movie descriptions
- [ ] Graph analytics (PageRank for actor influence)
- [ ] Real-time notifications for new releases
- [ ] Authentication & user profiles
- [ ] Watchlist functionality

---

## Security

### ✓ Implemented

- Environment variables for secrets (never committed)
- Parameterized queries (prevent Cypher injection)
- CORS configuration
- Error messages don't leak database structure
- Connection pooling with retry logic

### To-Do

- Add authentication (JWT)
- Rate limiting on API endpoints
- HTTPS in production
- API key rotation for CognoDB

---

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

MIT License — See LICENSE file for details

---

## Support & Questions

- **CognoDB Issues**: cognodb@wexa.ai
- **Assignment Questions**: Reply to assignment email
- **Code Questions**: Open an issue on GitHub

---

## Acknowledgments

Built as a CognoDB take-home assignment demonstrating:
- ✓ Graph data modeling
- ✓ Multi-hop Cypher queries
- ✓ Full-stack web application
- ✓ Production-ready architecture
- ✓ UI/UX best practices

**Developed with GitHub Copilot**

---

## Next Steps

1. **Setup CognoDB Instance**: https://console.cognodb.com/signup
2. **Configure .env** with your credentials
3. **Run seed script**: `npm run seed`
4. **Start development**: `npm start` (backend) + `cd client && npm start` (frontend)
5. **Deploy**: Push to GitHub, deploy to hosting platforms
6. **Record demo**: Show recommendations, co-actor networks, and UI
