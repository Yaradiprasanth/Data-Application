# Cypher Queries Explained

This document explains each Cypher query in the application, why it's useful, and how it demonstrates graph database advantages.

---

## 1. Get All Movies

### Query
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
RETURN m {
  .*,
  genres: COLLECT(DISTINCT g.name),
  actors: COLLECT(DISTINCT a {id: a.id, name: a.name})
} as movie
ORDER BY m.rating DESC
```

### What It Does
Returns all movies with their genres and cast, sorted by rating.

### Graph Concepts
- **Label filtering**: `MATCH (m:Movie)` — finds all nodes labeled Movie
- **Optional traversal**: `OPTIONAL MATCH` — returns NULL if no match (like SQL LEFT JOIN)
- **Collection**: `COLLECT()` — aggregates multiple matches into an array
- **Projection**: `{ .*, genres: ..., actors: ... }` — custom object structure

### Why Graph is Better
```sql
-- SQL approach (verbose)
SELECT m.*, 
  GROUP_CONCAT(DISTINCT g.name) as genres,
  JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'name', a.name)) as actors
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_actors ma ON m.id = ma.movie_id
LEFT JOIN actors a ON ma.actor_id = a.id
GROUP BY m.id
ORDER BY m.rating DESC;
```

**Graph wins because:**
- ✓ Relationship types are explicit (BELONGS_TO, ACTED_IN)
- ✓ Traversal direction is clear (→)
- ✓ No GROUP_CONCAT/JSON_ARRAYAGG complexity
- ✓ More readable and maintainable

### Performance
- **Time**: O(M × N_genres × N_actors) where M = # of movies
- **Optimization**: Indexes on Movie.id speed up initial MATCH

### Data Returned
```javascript
[
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    releaseYear: 2008,
    rating: 9.0,
    description: "Batman faces off against the Joker.",
    genres: ["action", "drama", "thriller"],
    actors: [
      { id: "christian-bale", name: "Christian Bale" },
      { id: "heath-ledger", name: "Heath Ledger" },
      { id: "gary-oldman", name: "Gary Oldman" }
    ]
  },
  // ... more movies
]
```

---

## 2. Get Single Movie by ID ⭐ (Shows Cypher Advantages)

### Query
```cypher
MATCH (m:Movie {id: $movieId})
OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
RETURN m {
  .*,
  actors: COLLECT(DISTINCT a {id: a.id, name: a.name, birthYear: a.birthYear}),
  genres: COLLECT(DISTINCT g {id: g.id, name: g.name})
} as movie
```

### What It Does
Retrieves a single movie with full details (actors, genres, metadata).

### Key Features
- **Parameterized input**: `$movieId` prevents Cypher injection
- **Filter first**: `{id: $movieId}` uses index for fast lookup
- **Multi-hop collection**: Gathers actors and genres in one query

### Why Graph is Better

#### Cypher (1 query)
```cypher
MATCH (m:Movie {id: $movieId})
OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
RETURN m { .*, actors: COLLECT(a), genres: COLLECT(g) }
```

#### SQL (requires N+1 or complex JOINs)
```sql
-- Option 1: N+1 queries
SELECT * FROM movies WHERE id = ?;  -- 1 query
SELECT * FROM actors WHERE movie_id = ?;  -- 1 query
SELECT * FROM genres WHERE movie_id = ?;  -- 1 query

-- Option 2: Complex JOIN (less readable)
SELECT m.*, a.*, g.*
FROM movies m
LEFT JOIN movie_actors ma ON m.id = ma.movie_id
LEFT JOIN actors a ON ma.actor_id = a.id
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
WHERE m.id = ?;
```

### Performance Characteristics
- **Single index lookup**: O(1) for finding movie
- **Relationship traversal**: O(# of connected actors + genres)
- **Total**: O(1) + O(n_actors) + O(n_genres) — linear in connected nodes

### Data Returned
```javascript
{
  id: "the-dark-knight",
  title: "The Dark Knight",
  releaseYear: 2008,
  rating: 9.0,
  description: "Batman faces off against the Joker.",
  actors: [
    { id: "christian-bale", name: "Christian Bale", birthYear: 1974 },
    { id: "heath-ledger", name: "Heath Ledger", birthYear: 1979 },
    { id: "gary-oldman", name: "Gary Oldman", birthYear: 1958 }
  ],
  genres: [
    { id: "action", name: "Action" },
    { id: "drama", name: "Drama" },
    { id: "thriller", name: "Thriller" }
  ]
}
```

---

## 3. Get Recommendations (2-Hop Traversal) ⭐⭐ (Graph Sweet Spot)

### Query
```cypher
MATCH (m:Movie {id: $movieId})
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
```

### What It Does
**Finds similar movies through shared genres and actors.** This is the core feature demonstrating graph value.

### Graph Traversal Paths

**Path 1: Through Genre**
```
Movie1 --[BELONGS_TO]--> Genre <--[BELONGS_TO]-- Movie2
        ←  1 hop →              ← 1 hop →
        ←────── 2 hops total ────────→
```

**Path 2: Through Actor**
```
Movie1 <--[ACTED_IN]-- Actor --[ACTED_IN]--> Movie2
(actors appear in both movies)
```

### Cypher Concepts Demonstrated

**1. Path Expression**
```cypher
(m)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(similar:Movie)
```
- `-[:BELONGS_TO]->` — relationship type and direction
- `(g:Genre)` — intermediate node with label
- Can chain relationships infinitely

**2. Multiple Optional Paths**
```cypher
OPTIONAL MATCH (m)-[:BELONGS_TO]->...  // Via genres
OPTIONAL MATCH (a:Actor)-[:ACTED_IN]-> // Via actors
```
- Finds recommendations through different relationship types
- Combines results intelligently

**3. WITH Clause (Intermediate Result Set)**
```cypher
WITH similar, similarActor, m
WHERE similar.id <> m.id AND similarActor.id <> m.id
WITH COALESCE(similar, similarActor) as recommended
```
- `WITH` — pipe intermediate results
- `COALESCE()` — pick first non-NULL value
- Chains multiple transformations

**4. DISTINCT (Remove Duplicates)**
```cypher
RETURN DISTINCT recommended
```
- Removes movies found through multiple paths
- Movie could match via both actor AND genre

### Why Graph Dominates Here

#### Cypher (Clear & Simple)
```cypher
MATCH (m1:Movie {id: $movieId})
MATCH (m1)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(m2:Movie)
WHERE m2.id <> m1.id
RETURN DISTINCT m2 ORDER BY m2.rating DESC LIMIT $limit
```
- Reads like English: "Find movies that belong to the same genres"
- Relationship direction is explicit

#### SQL (Complex & Fragile)
```sql
-- Via shared genres only
SELECT DISTINCT m2.*, COUNT(DISTINCT g.id) as common_genres
FROM movies m1
JOIN movie_genres mg1 ON m1.id = mg1.movie_id
JOIN genres g ON mg1.genre_id = g.id
JOIN movie_genres mg2 ON g.id = mg2.genre_id
JOIN movies m2 ON mg2.movie_id = m2.id
WHERE m1.id = ? AND m2.id <> m1.id
GROUP BY m2.id
ORDER BY m2.rating DESC
LIMIT ?;

-- Now add shared actors... requires UNION or subquery
-- OR another table join... complexity explodes
```

### Use Cases Where Graphs Shine
1. **Recommendations** — "Find similar content"
2. **Social networks** — "Find friends of friends"
3. **Supply chains** — "Find suppliers for a product"
4. **Knowledge graphs** — "Find related topics"
5. **Organizational hierarchies** — "Find team members"

**All involve multi-hop relationship traversal.**

### Performance Optimization
```cypher
-- Add index on Genre.id and Actor.id
CREATE INDEX ON :Genre(id);
CREATE INDEX ON :Actor(id);

-- Then query runs in parallel:
-- 1. Find movie by ID (index) O(1)
-- 2. Find genres (index) O(n_genres)
-- 3. Find connected movies (index) O(n_similar)
-- Total: O(1 + n_genres + n_similar)
```

### Comparison: Movie → Genre → Movie vs. Relational

| Aspect | Graph | SQL |
|--------|-------|-----|
| Relationship semantics | Explicit (BELONGS_TO) | Implicit (foreign key) |
| Query readability | `m1-[:BELONGS_TO]->g<-[:BELONGS_TO]-m2` | JOIN... JOIN... WHERE |
| Performance scaling | Constant (O(1) per hop) | Linear in table size |
| Modification complexity | Easy (add new relationship type) | Complex (new table join) |

---

## 4. Get Movies by Genre (1-Hop Traversal)

### Query
```cypher
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
```

### What It Does
Returns all movies in a specified genre.

### Graph Concepts
- **Reverse traversal**: `g<-[:BELONGS_TO]-m` (traversing backward)
- Both `-[:BELONGS_TO]->` and `<-[:BELONGS_TO]-` are valid
- Direction doesn't matter for finding connections

### Data Flow
```
Genre (action)
    ↓ [BELONGS_TO reverse]
Movie (The Dark Knight) → [BELONGS_TO] → Genre (drama)
Movie (Inception) → [BELONGS_TO] → Genre (thriller)
```

### Why Graph is Better
Graph makes relationship traversal effortless:
```cypher
MATCH (g:Genre {id: $genreId})<-[:BELONGS_TO]-(m:Movie)
```

SQL requires explicit JOIN:
```sql
SELECT m.* FROM movies m
JOIN movie_genres mg ON m.id = mg.movie_id
JOIN genres g ON mg.genre_id = g.id
WHERE g.id = $genreId
ORDER BY m.rating DESC
LIMIT ?;
```

---

## 5. Get Actor Details (Actor's Filmography)

### Query
```cypher
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
```

### What It Does
Returns actor details with their complete filmography.

### Graph Advantage
Single query returns actor with nested movies:

```javascript
{
  id: "christian-bale",
  name: "Christian Bale",
  birthYear: 1974,
  movies: [
    { id: "the-dark-knight", title: "The Dark Knight", ... },
    { id: "batman-begins", title: "Batman Begins", ... }
  ]
}
```

### Prevents N+1 Problem
Without graph (N+1 queries):
```javascript
// Query 1: Get actor
const actor = await getActor("christian-bale");

// Query 2-N: Get each movie
for (const movie of actor.movies) {
  const details = await getMovie(movie.id);
}
```

With graph (1 query):
```javascript
const actor = await getActorWithFilmography("christian-bale");
// Movies already included!
```

---

## 6. Find Co-Actors (3-Hop) ⭐⭐⭐ (Most Complex)

### Query
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

### What It Does
**Finds all actors who appeared in movies with a given actor, and shows their shared movies.**

### Traversal Path
```
          ACTED_IN        ACTED_IN
Actor1 ──────────→ Movie ←────────── CoActor
   ↓
   └─ (other movies CoActor appeared in)
```

### Cypher Concepts

**1. Multi-Relationship Path**
```cypher
(a:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Actor)
```
- Chain multiple relationships
- `→` and `←` show direction
- Implicit INNER JOIN semantics

**2. Filter with WHERE**
```cypher
WHERE coActor.id <> a.id
```
- Excludes the original actor from results
- Filters after traversal

**3. Aggregation & Ordering**
```cypher
ORDER BY SIZE(coActor.sharedMovies) DESC
```
- `SIZE()` counts array elements
- Sort by number of collaborations

### Why This is Graph Gold

#### The Problem (SQL)
```sql
SELECT DISTINCT ca.id, ca.name, 
  GROUP_CONCAT(m.title) as shared_movies
FROM actors a
JOIN movie_actors ma1 ON a.id = ma1.actor_id
JOIN movies m ON ma1.movie_id = m.id
JOIN movie_actors ma2 ON m.id = ma2.movie_id
JOIN actors ca ON ma2.actor_id = ca.id
WHERE a.id = ? AND ca.id <> a.id
GROUP BY ca.id, ca.name
ORDER BY COUNT(DISTINCT m.id) DESC;
```

#### The Solution (Graph)
```cypher
MATCH (a:Actor {id: $actorId})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(coActor:Actor)
WHERE coActor.id <> a.id
RETURN DISTINCT coActor, COLLECT(m) as sharedMovies
ORDER BY SIZE(sharedMovies) DESC
```

**Why Cypher wins:**
- ✓ **Readability**: Clear path visualization
- ✓ **Simplicity**: No GROUP_CONCAT, no DISTINCT complexity
- ✓ **Maintainability**: Easy to modify (add new relationship type)
- ✓ **Performance**: Native multi-hop optimization

### Real-World Applications
- LinkedIn: "People who worked with X"
- Movie databases: "Co-stars"
- Supply chains: "Suppliers who work with your suppliers"

---

## 7. Find All Genres (With Movie Counts)

### Query
```cypher
MATCH (g:Genre)
RETURN g {
  .*,
  movieCount: SIZE([
    (g)<-[:BELONGS_TO]-(m:Movie) | m
  ])
} as genre
ORDER BY g.name
```

### What It Does
Returns all genres with the number of movies in each.

### Graph Concept: List Comprehension
```cypher
SIZE([
  (g)<-[:BELONGS_TO]-(m:Movie) | m
])
```
- `[ ... | ]` — list comprehension syntax
- `(g)<-[:BELONGS_TO]-(m:Movie)` — find all pattern matches
- `SIZE()` — count them

### Equivalent SQL
```sql
SELECT g.*, COUNT(DISTINCT m.id) as movieCount
FROM genres g
LEFT JOIN movie_genres mg ON g.id = mg.genre_id
LEFT JOIN movies m ON mg.movie_id = m.id
GROUP BY g.id, g.name
ORDER BY g.name;
```

---

## 8. Seed: Create SIMILAR_TO Relationships

### Query
```cypher
MATCH (m1:Movie)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(m2:Movie)
WHERE m1.id < m2.id
WITH m1, m2, COUNT(DISTINCT g) as commonGenres
MERGE (m1)-[r:SIMILAR_TO]-(m2)
SET r.commonGenres = commonGenres
```

### What It Does
**Dynamically computes similarity between movies based on shared genres.**

### Graph Concepts

**1. MERGE (Upsert)**
```cypher
MERGE (m1)-[r:SIMILAR_TO]-(m2)
```
- Creates relationship if it doesn't exist
- Updates if it does
- Prevents duplicates

**2. Bidirectional Relationship**
```cypher
(m1)-[r:SIMILAR_TO]-(m2)
```
- `-` instead of `→` means no direction
- Can traverse either way: `m1-[:SIMILAR_TO]-m2` OR `m2-[:SIMILAR_TO]-m1`

**3. Relationship Properties**
```cypher
SET r.commonGenres = commonGenres
```
- Relationships can have properties
- Store metadata (like "they share 2 genres")

### Performance Note
Running at seed time, not query time:
- ✓ Pre-computed recommendations
- ✓ Faster queries
- ✗ Stale if new movies added
- Solution: Re-run on schedule or compute on-demand

---

## Summary Table

| Query | Type | Hops | Graph Advantage |
|-------|------|------|-----------------|
| Get All Movies | Collection | 1 | Relationship collection |
| Get Single Movie | Single | 1 | Optional traversal |
| **Recommendations** | **Multi-path** | **2** | **Clear path semantics** |
| Get Movies by Genre | Filter | 1 | Reverse traversal |
| Get Actor Details | Nested | 1 | Nested collection |
| **Find Co-Actors** | **Multi-hop** | **3** | **Complex relational→simple graph** |
| Get All Genres | Collection | 1 | Degree queries |
| Create Similarities | Computed | 2 | MERGE upsert pattern |

---

## Performance Tips

### Use Indexes
```cypher
CREATE INDEX ON :Movie(id);
CREATE INDEX ON :Actor(id);
CREATE INDEX ON :Genre(id);
```

### Cypher Optimization
1. **Filter early**: Put WHERE clauses early with indexed properties
2. **Avoid cartesian products**: Use WITH to narrow results
3. **Use COUNT(*) not collections**: When you only need a count
4. **Limit results**: Always use LIMIT on large result sets

### Example Optimization
```cypher
-- ✗ SLOW: Collects all movies then filters
MATCH (m:Movie)
OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
WHERE g.name = 'Action'
RETURN m

-- ✓ FAST: Filters first
MATCH (g:Genre {name: 'Action'})
OPTIONAL MATCH (g)<-[:BELONGS_TO]-(m:Movie)
RETURN m
```

---

## Next Steps

To run these queries live:
1. Start backend: `npm start`
2. Visit endpoints like `GET /api/movies/the-dark-knight`
3. Check the DevTools Network tab to see actual Cypher queries
4. Try modifying queries in `server/queries.js`

Each query in the app is parameterized and safe from injection!
