# Architecture & Design Decisions

## Overview

The Movie Recommendation Engine uses a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│   Presentation Layer (React)        │
│   - Components                      │
│   - Routing                         │
│   - State Management (Local)        │
└──────────────────┬──────────────────┘
                   │ HTTP/JSON (RESTful)
┌──────────────────▼──────────────────┐
│   Application Layer (Express)       │
│   - API Routes                      │
│   - Business Logic                  │
│   - Error Handling                  │
└──────────────────┬──────────────────┘
                   │ Bolt Protocol
┌──────────────────▼──────────────────┐
│   Data Layer (CognoDB Graph DB)     │
│   - Node & Relationship Storage     │
│   - Cypher Query Engine             │
│   - Transaction Management          │
└─────────────────────────────────────┘
```

---

## Database Layer (server/db.js)

### Responsibilities
- Manage Neo4j driver lifecycle
- Handle connection pooling
- Provide connection error handling
- Enforce environment-based configuration

### Key Design Decisions

**1. Singleton Pattern for Driver**
```javascript
let driver;

function getDriver() {
  if (!driver) {
    throw new Error('Driver not initialized');
  }
  return driver;
}
```
- Prevents multiple driver instances
- Ensures connection pooling efficiency
- Simplifies resource cleanup

**2. Environment Variables**
```javascript
const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;
```
- Secrets never hardcoded
- Supports multiple environments (dev/prod)
- Aligns with 12-factor app principles

**3. Error-First Connection Testing**
```javascript
const session = driver.session();
try {
  await session.run('RETURN 1');
  console.log('✓ Connected to CognoDB');
} catch (error) {
  console.error('✗ Failed to connect');
  throw error;
}
```
- Fast feedback on configuration issues
- Prevents silent failures
- Clear success/error messaging

---

## Query Layer (server/queries.js)

### Responsibilities
- Encapsulate all Cypher queries
- Provide parameterized queries (no injection risk)
- Handle result parsing
- Separate data access from business logic

### Parameterized Query Pattern

**❌ Dangerous (String Concatenation)**
```javascript
const query = `MATCH (m:Movie {id: '${movieId}'}) RETURN m`;
// Vulnerable to Cypher injection
```

**✅ Safe (Parameterized)**
```javascript
const query = `MATCH (m:Movie {id: $movieId}) RETURN m`;
const result = await session.run(query, { movieId });
// Parameters are escaped and validated
```

### Query Design Principles

**1. Session Management**
```javascript
const session = driver.session();
try {
  // Query logic
} finally {
  await session.close();
}
```
- Always close sessions (resource cleanup)
- Try/finally guarantees closure
- Prevents connection leaks

**2. Result Mapping**
```javascript
return result.records.map(record => record.get('movie'));
// Extracts clean JavaScript objects from Neo4j results
```

**3. Optional Match for Left Joins**
```cypher
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
// Equivalent to SQL LEFT JOIN
// Returns null if no relationship exists
```

---

## API Routes (server/index.js)

### RESTful Endpoint Design

| Resource | Method | Action |
|----------|--------|--------|
| `/api/movies` | GET | List all |
| `/api/movies/:id` | GET | Read single |
| `/movies/:id/recommendations` | GET | Related resource |
| `/api/genres/:id/movies` | GET | Filtered collection |

### Error Handling Strategy

```javascript
try {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const data = await queries.getAllMovies();
  res.json(data);
} catch (error) {
  res.status(500).json({ 
    error: 'Failed to fetch movies',
    details: error.message 
  });
}
```

**Design Decisions:**
- **503 Service Unavailable** for database connection issues
- **500 Internal Server Error** for unexpected errors
- **404 Not Found** for missing resources
- **Details field** included for debugging (remove in production)

### Health Check Endpoint

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: dbConnected ? 'connected' : 'disconnected' });
});
```
- Frontend uses this to show connection status
- Provides graceful degradation
- Useful for monitoring/alerting

---

## Frontend Architecture (client/src/)

### Component Hierarchy

```
App.js (Router & DB Health Check)
├── HomePage.js
│   └── Movie Cards (Grid)
├── MovieDetailPage.js
│   ├── Movie Info
│   ├── Cast List
│   └── Recommendations
├── GenrePage.js
│   └── Movie Cards (Grid)
└── ActorPage.js
    ├── Actor Info
    ├── Filmography
    └── Co-actors
```

### State Management Philosophy

**Decision: No Redux/Context API**
- ✓ Simpler codebase (easier to maintain)
- ✓ Each page manages its own state
- ✓ API calls are self-contained
- ✗ No global state sharing (not needed for this app)

**Component State Pattern:**
```javascript
const [movies, setMovies] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**useEffect for Side Effects:**
```javascript
useEffect(() => {
  fetchData();
}, [id]); // Re-fetch when ID changes
```

### API Client Configuration

```javascript
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
});
```
- Centralized configuration
- Easily overridden for different environments
- Supports proxying in development

### UI/UX Patterns

**1. Loading State**
```javascript
if (loading) {
  return <div className="loading">Loading movies...</div>;
}
```

**2. Error State**
```javascript
if (error) {
  return <div className="error"><strong>Error:</strong> {error}</div>;
}
```

**3. Empty State**
```javascript
if (movies.length === 0) {
  return <div className="empty-state">No movies found</div>;
}
```

**4. Navigation with Links**
```javascript
<Link to={`/movie/${movie.id}`} style={{ textDecoration: 'none' }}>
  <div className="card">...</div>
</Link>
```

---

## Data Model Design

### Why These Entities?

| Entity | Why Needed |
|--------|-----------|
| **Movie** | Central entity; all recommendations branch from here |
| **Actor** | Enables relationship-based queries (co-actors, filmography) |
| **Genre** | Enables similarity-based recommendations |

### Relationship Design

```cypher
Actor -[ACTED_IN]-> Movie
```
- Directional: actor performed in movie
- No properties needed (simple fact)

```cypher
Movie -[BELONGS_TO]-> Genre
```
- Directional: movie categorized by genre
- No properties needed

```cypher
Movie -[SIMILAR_TO]- Movie
```
- **Bidirectional** (using `-` instead of `->`)
- Properties: `commonGenres` (count for ranking)
- Computed at seed time (could be dynamic)

### Indexing Strategy

**Indexes created at seed time:**
```cypher
CREATE INDEX ON :Movie(id);
CREATE INDEX ON :Actor(id);
CREATE INDEX ON :Genre(id);
```
- **Primary key indexing** for fast lookups
- Improves query performance by 10-100x
- Especially important for initial `MATCH` clauses

---

## Cypher Query Patterns

### Pattern 1: Single Node Retrieval
```cypher
MATCH (m:Movie {id: $movieId})
RETURN m
```
- **Use case**: Movie details page
- **Performance**: O(1) with index

### Pattern 2: One-Hop Traversal
```cypher
MATCH (m:Movie {id: $movieId})-[:BELONGS_TO]->(g:Genre)
RETURN g
```
- **Use case**: Get genres of a movie
- **Graph advantage**: Direct relationship traversal
- **SQL equivalent**: JOIN with WHERE clause

### Pattern 3: Two-Hop Traversal (Recommendations)
```cypher
MATCH (m1:Movie {id: $movieId})
MATCH (m1)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(m2:Movie)
WHERE m2.id <> m1.id
RETURN DISTINCT m2
```
- **Use case**: Find similar movies
- **Graph advantage**: Natural relationship navigation
- **SQL equivalent**: 3-way JOIN with DISTINCT
- **Hops**: Movie → Genre → Movie (2 hops)

### Pattern 4: Three-Hop Traversal (Co-Actors)
```cypher
MATCH (a:Actor {id: $actorId})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Actor)
RETURN DISTINCT coActor
```
- **Use case**: Find co-actors
- **Graph advantage**: Intuitive path expression
- **SQL equivalent**: 2 JOINs through movie_actors
- **Hops**: Actor → Movie → Actor (2 hops, but through intermediate node)

### Pattern 5: Aggregation & Collection
```cypher
MATCH (a:Actor {id: $actorId})-[:ACTED_IN]->(m:Movie)
RETURN a {
  .*,
  movies: COLLECT(m { id: m.id, title: m.title })
} as actor
```
- **Use case**: Nested data (actor with filmography)
- **Graph advantage**: COLLECT creates nested structures
- **SQL equivalent**: Subquery or GROUP_CONCAT
- **Benefit**: Single query instead of N+1 queries

### Pattern 6: Degree Queries (Relationship Counts)
```cypher
RETURN SIZE([(a)-[:ACTED_IN]-(m:Movie) | m]) as filmography_count
```
- **Use case**: How many movies has this actor appeared in?
- **Graph advantage**: Native relationship counting
- **SQL equivalent**: Separate COUNT subquery

---

## Performance Optimization

### Query Optimization Checklist

```cypher
// ✓ GOOD: Filters early with index
MATCH (m:Movie {id: $movieId})-[:BELONGS_TO]->(g:Genre)
RETURN g

// ✗ BAD: Scans all movies first
MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre)
WHERE m.id = $movieId
RETURN g
```

### Caching Strategy

**Current**: No caching (suitable for small datasets)

**For Production Scaling**:
```javascript
const cache = new Map();

async function getCachedRecommendations(movieId) {
  if (cache.has(movieId)) {
    return cache.get(movieId);
  }
  const recs = await queries.getRecommendations(movieId);
  cache.set(movieId, recs);
  
  // Invalidate after 1 hour
  setTimeout(() => cache.delete(movieId), 3600000);
  
  return recs;
}
```

### Pagination Pattern

```cypher
MATCH (m:Movie)
RETURN m
ORDER BY m.rating DESC
SKIP $offset
LIMIT $limit
```

**Implementation:**
```javascript
app.get('/api/movies', async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const offset = page * limit;
  
  const movies = await queries.getMoviesPaginated(offset, limit);
  res.json({ page, limit, data: movies });
});
```

---

## Testing Strategy

### Unit Tests (queries.js)

```javascript
describe('queries', () => {
  describe('getAllMovies', () => {
    it('should return array of movies', async () => {
      const movies = await queries.getAllMovies();
      expect(Array.isArray(movies)).toBe(true);
      expect(movies[0]).toHaveProperty('id');
      expect(movies[0]).toHaveProperty('title');
    });
  });
});
```

### Integration Tests (API endpoints)

```javascript
describe('GET /api/movies', () => {
  it('should return 200 with movies array', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### End-to-End Tests (Frontend)

```javascript
describe('Movie recommendation flow', () => {
  it('should navigate from home to movie to recommendations', async () => {
    // 1. User sees movies on home page
    // 2. Clicks on a movie
    // 3. Sees recommendations on detail page
  });
});
```

---

## Deployment Architecture

### Development Environment
```
┌──────────────┐
│ npm start    │ Backend on :5000
├──────────────┤
│ npm run dev  │ Watches for changes
│ (nodemon)    │
└──────────────┘

┌──────────────┐
│ npm start    │ Frontend on :3000
├──────────────┤ (client/ directory)
│ React Dev    │ Hot module reload
│ Server       │
└──────────────┘
```

### Production Environment
```
┌──────────────────────────────┐
│   CDN / Static Hosting       │
│   (Vercel for Frontend)      │
│   - dist/ folder             │
│   - Gzip compression         │
│   - Caching headers          │
└────────────────┬─────────────┘
                 │ API calls
┌────────────────▼─────────────┐
│   Application Server         │
│   (Railway / Heroku)         │
│   - Node.js runtime          │
│   - Environment vars         │
│   - Graceful shutdown        │
└────────────────┬─────────────┘
                 │ Bolt protocol
┌────────────────▼─────────────┐
│   CognoDB Cloud              │
│   - Managed database         │
│   - Auto-scaling             │
│   - Backups                  │
└──────────────────────────────┘
```

---

## Security Considerations

### Input Validation

**Cypher Injection Prevention:**
```javascript
// ✗ Vulnerable
const query = `MATCH (m:Movie {id: '${req.params.id}'})`;

// ✓ Safe
const query = `MATCH (m:Movie {id: $id})`;
const result = await session.run(query, { id: req.params.id });
// Neo4j driver escapes parameters automatically
```

### Secrets Management

```javascript
// ✗ BAD: Secrets in code
const password = 'abc123xyz';

// ✓ GOOD: Environment variables
const password = process.env.COGNODB_PASSWORD;
if (!password) throw new Error('Missing COGNODB_PASSWORD');
```

### CORS Configuration

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Error Information Leakage

```javascript
// ✗ BAD: Exposes database structure
res.status(500).json({ 
  error: error.message,  // "Neo4j connection refused"
  query: query           // Reveals data model
});

// ✓ GOOD: Generic errors in production
res.status(500).json({ 
  error: 'An error occurred',
  ...(process.env.NODE_ENV !== 'production' && { details: error.message })
});
```

---

## Scalability Path

### Current Limitations
- Single database instance (CognoDB free tier)
- No caching layer
- In-memory state on frontend
- No pagination

### Scaling Strategy
1. **Database**: Upgrade CognoDB instance or migrate to Neo4j Enterprise
2. **Cache**: Add Redis for frequently accessed data
3. **API**: Horizontal scaling (multiple server instances behind load balancer)
4. **Frontend**: CDN with edge caching
5. **Monitoring**: Add APM tool (DataDog, New Relic)

---

## Code Quality

### Linting
```bash
npm install --save-dev eslint
npx eslint server/ client/src/
```

### Formatting
```bash
npm install --save-dev prettier
npx prettier --write .
```

### Type Safety (Optional)
Consider TypeScript for future versions:
```typescript
interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  rating: number;
}
```

---

## Summary

This architecture prioritizes:

1. **Separation of Concerns** — Clear layers (DB, API, Frontend)
2. **Security** — Parameterized queries, environment variables
3. **Maintainability** — Modular code, clear error handling
4. **Performance** — Indexing, caching potential
5. **Scalability** — Stateless API, horizontal scaling ready

The result is a production-ready application that demonstrates graph database capabilities while maintaining industry best practices.
