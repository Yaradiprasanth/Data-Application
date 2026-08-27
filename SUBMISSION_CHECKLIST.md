# SUBMISSION_CHECKLIST.md

## ✅ Pre-Submission Verification Checklist

Use this checklist to ensure your submission meets all requirements.

---

## Repository Requirements

- [ ] GitHub repository created (public or private with access for reviewers)
- [ ] All source code committed and pushed
- [ ] `.env` file is NOT in repository (check `.gitignore`)
- [ ] `.env.example` file exists with template
- [ ] `.git` folder exists (git initialized)
- [ ] Initial commit message present
- [ ] Repository has meaningful commit history

---

## Code Requirements

### Backend (Node.js/Express)

- [ ] `server/index.js` — Express server running
- [ ] `server/db.js` — Database driver initialization
- [ ] `server/queries.js` — All Cypher queries are parameterized (no string concatenation)
- [ ] `server/seed.js` — Seed script creates test data
- [ ] All endpoints return proper HTTP status codes (200, 404, 503, etc.)
- [ ] Error handling for database connection failures
- [ ] Connection details read from environment variables (never hardcoded)
- [ ] No security vulnerabilities (no hardcoded passwords, SQL injection risks, etc.)

**Verify:**
```bash
npm start  # Should show "✓ Server running on http://localhost:5000"
curl http://localhost:5000/api/health  # Should show {"status":"connected"}
curl http://localhost:5000/api/movies  # Should return array of movies
```

### Frontend (React)

- [ ] `client/src/App.js` — Main app with routing
- [ ] `client/src/pages/HomePage.js` — Movie listing and filtering
- [ ] `client/src/pages/MovieDetailPage.js` — Movie details + recommendations
- [ ] `client/src/pages/GenrePage.js` — Browse by genre
- [ ] `client/src/pages/ActorPage.js` — Actor details + co-actors
- [ ] `client/src/index.css` — Professional styling
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Responsive design (works on mobile)
- [ ] No console errors or warnings

**Verify:**
```bash
cd client && npm start  # Should open http://localhost:3000
# Check browser console (F12) for errors
```

### Database

- [ ] CognoDB instance created at console.cognodb.com
- [ ] Connection URI valid (bolt+s://...)
- [ ] Credentials stored in `.env` (not in code)
- [ ] Seed script runs successfully
- [ ] Database contains test data (6 movies, 8 actors, 5 genres minimum)

**Verify:**
```bash
npm run seed  # Should complete with "✓ Database seeded successfully!"
```

---

## Query Requirements

### Cypher Queries

- [ ] At least one multi-hop traversal (2+ hops)
  - **Example**: Movie → Genre → Movie (recommendations)
  - **Location**: `server/queries.js` line ~90

- [ ] At least one awkward-in-relational query
  - **Example**: Co-actors (3-hop traversal)
  - **Location**: `server/queries.js` line ~140

- [ ] All queries are parameterized (using $variables)
  - ✓ Correct: `WHERE m.id = $movieId`
  - ✗ Wrong: `WHERE m.id = '${movieId}'`

- [ ] No query concatenation or injection risks

**Verify:**
```bash
# Open server/queries.js and search for:
# 1. "MATCH (m:Movie {id: $movieId})" — parameterized ✓
# 2. No string template literals in Cypher queries
# 3. No "await session.run(query + ...)"
```

---

## Data Model Requirements

### Graph Structure

- [ ] **Movie** nodes with properties (id, title, releaseYear, rating, description)
- [ ] **Actor** nodes with properties (id, name, birthYear)
- [ ] **Genre** nodes with properties (id, name)
- [ ] **ACTED_IN** relationships (Actor → Movie)
- [ ] **BELONGS_TO** relationships (Movie → Genre)
- [ ] Additional relationships (e.g., SIMILAR_TO for recommendations)

### Seed Data

- [ ] Seed script creates realistic data
- [ ] At least 5 movies (you have 6 ✓)
- [ ] At least 3 actors (you have 8 ✓)
- [ ] At least 3 genres (you have 5 ✓)
- [ ] Data demonstrates relationships clearly

**Verify:**
```bash
npm run seed  # Should show progress: Creating actors, genres, movies
```

---

## API Endpoints

- [ ] `GET /api/movies` — Returns all movies
- [ ] `GET /api/movies/:id` — Returns single movie with details
- [ ] `GET /api/movies/:id/recommendations` — Returns recommendations (multi-hop)
- [ ] `GET /api/genres/:id/movies` — Returns movies in genre
- [ ] `GET /api/actors/:id` — Returns actor with filmography
- [ ] `GET /api/actors/:id/coactors` — Returns co-actors (multi-hop)
- [ ] `GET /api/genres` — Returns all genres
- [ ] `GET /api/health` — Returns connection status

**Verify:**
```bash
curl http://localhost:5000/api/movies | jq .  # Pretty-print JSON
curl http://localhost:5000/api/movies/the-dark-knight | jq .
curl "http://localhost:5000/api/movies/inception/recommendations?limit=5" | jq .
```

---

## Documentation Requirements

### README.md

- [ ] Title and description
- [ ] "Why a Graph Database?" section (250+ words)
  - Explains graph advantages over relational
  - Examples from your use case
  - Performance comparison
  
- [ ] Data model diagram or description
  - Shows nodes (Movie, Actor, Genre)
  - Shows relationships (ACTED_IN, BELONGS_TO)
  - Could be ASCII art or simple text

- [ ] Setup instructions
  - CognoDB account creation
  - .env configuration
  - Dependency installation
  - Database seeding
  - Running the app

- [ ] Main queries explained
  - At least 3 queries documented
  - Explain why graph is better

- [ ] Screenshots of UI (optional but encouraged)
- [ ] Live demo link (if deployed)

### Supporting Docs

- [ ] ARCHITECTURE.md — System design, patterns, trade-offs
- [ ] QUERIES_EXPLAINED.md — Detailed explanation of each query
- [ ] TROUBLESHOOTING.md — Common issues and solutions
- [ ] DEPLOYMENT.md — How to deploy to production

---

## Environment Configuration

- [ ] `.env.example` exists with all required variables
  ```
  COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
  COGNODB_USERNAME=cognodb
  COGNODB_PASSWORD=your-password-here
  PORT=5000
  NODE_ENV=development
  ```

- [ ] `.gitignore` prevents `.env` from being committed
- [ ] Sensitive information never appears in code
- [ ] Environment-based config works for dev and prod

**Verify:**
```bash
# Check .gitignore
grep "\.env" .gitignore  # Should show .env (but not .env.example)

# Check .env is not in git history
git status | grep ".env"  # Should not appear
```

---

## Error Handling

- [ ] Database connection errors handled gracefully
- [ ] Frontend shows error message to user
- [ ] Missing resources return 404
- [ ] Server errors return 500
- [ ] Retry logic or fallback options considered

**Verify:**
```bash
# Test with wrong database credentials
# Frontend should show "Database Connection Error"

# Try to access non-existent movie
curl http://localhost:5000/api/movies/fake-id  # Should return 404
```

---

## UI/UX Quality

- [ ] Clean, professional design
- [ ] Proper typography and spacing
- [ ] Color scheme is consistent
- [ ] Links and buttons work correctly
- [ ] Mobile-friendly (test with F12 mobile view)
- [ ] Loading indicators while fetching
- [ ] Error messages are helpful
- [ ] Empty states are handled

**Verify:**
```
1. Open http://localhost:3000
2. Press F12 (DevTools)
3. Click mobile icon to test responsive design
4. Check all buttons and links work
5. Verify no broken styling
```

---

## Deployment

- [ ] Application deployed to live hosting (Railway, Heroku, etc.)
- [ ] Live URL accessible from any browser
- [ ] Environment variables set on hosting platform
- [ ] CognoDB instance still running (not paused)
- [ ] Live app responds to API calls
- [ ] Frontend loads without errors on live URL

**Verify:**
```bash
# From your deployed URL
curl https://your-app.railway.app/api/health
# Should show {"status":"connected"}

# Visit in browser
https://your-app.railway.app/
# Should load homepage with movies
```

---

## Screen Recording

- [ ] Video recorded (5-10 minutes)
- [ ] Shows key features:
  - Homepage with all movies
  - Genre filtering
  - Movie detail page
  - Recommendations display (multi-hop query in action!)
  - Actor page with co-actors (3-hop traversal)
- [ ] Narration explains graph advantages
- [ ] Code walkthrough of key queries
- [ ] Video uploaded (YouTube, Vimeo, or hosted link)
- [ ] Video link works and plays correctly

**What to demonstrate:**
1. **Homepage** — Browse movies, filter by genre
2. **Recommendations** — Click movie → show recommendations → explain 2-hop traversal
3. **Co-actors** — Click actor → show co-actor network → explain 3-hop traversal
4. **Code** — Show server/queries.js, highlight key Cypher queries
5. **Graph advantage** — Compare to what relational DB would require

---

## Code Quality

- [ ] Code is readable and well-organized
- [ ] Variable names are descriptive
- [ ] No dead code or commented-out sections
- [ ] Consistent indentation and formatting
- [ ] No console.log() left in production code
- [ ] Comments explain complex logic
- [ ] Error messages are helpful

**Verify:**
```bash
# Check for common issues
grep -r "console.log" server/  # Should have minimal logs
grep -r "TODO\|FIXME\|XXX" .   # Should be few or none
```

---

## Security & Best Practices

- [ ] No secrets hardcoded in code
- [ ] All credentials in environment variables
- [ ] Cypher queries parameterized (injection-safe)
- [ ] CORS configured appropriately
- [ ] Error messages don't leak database structure
- [ ] Graceful handling of missing/invalid input
- [ ] Connection pooling configured
- [ ] No sensitive data in commit history

**Verify:**
```bash
# Check for hardcoded secrets
grep -r "password" server/ client/  # Should only see process.env.
grep -r "COGNODB" server/ client/   # Should only see process.env.
grep -r "bolt+s://" server/ client/ # Should NOT appear (only in .env)
```

---

## Performance & Scalability

- [ ] Queries have reasonable performance (<1 second for seed data)
- [ ] Database indexed on key properties (id fields)
- [ ] No N+1 queries
- [ ] Pagination considered for large datasets
- [ ] Caching considered (not required, but good to mention)

**Verify:**
```bash
# Test query performance
time npm run seed  # Should complete in <30 seconds

# Test API response time
curl -w "@curl-format.txt" http://localhost:5000/api/movies
# Should be <200ms for recommendations
```

---

## Submission Package

- [ ] GitHub repository URL ready
- [ ] Live demo URL ready (if deployed)
- [ ] Screen recording video ready
- [ ] All documentation complete and proofread
- [ ] Can explain every part of the code
- [ ] Comfortable discussing design decisions

---

## Final Verification

```bash
# Run this complete checklist before submitting

# 1. Verify git status
git status  # Should show "nothing to commit" (or only new files)

# 2. Verify dependencies
npm ls neo4j-driver  # Should show installed version

# 3. Verify seed script works
npm run seed  # Should complete successfully

# 4. Verify backend starts
timeout 5 npm start  # Starts and can be killed

# 5. Verify frontend builds
cd client && npm run build  # Creates build/ directory

# 6. Verify no secrets in repo
grep -r "bolt+s://" .  # Should NOT appear in code files

# 7. Verify documentation
test -f README.md && test -f ARCHITECTURE.md && test -f QUERIES_EXPLAINED.md

# 8. List all documentation
ls -la *.md
```

---

## Submission

### Email Content

```
To: hr@wexa.ai
Subject: CognoDB Assignment 2 – [Your Full Name]

GitHub Repository: https://github.com/YOUR_USERNAME/movie-recommendation-engine
Live Demo: https://your-app.railway.app (if deployed)
Screen Recording: https://youtube.com/watch?v=... (paste URL)

[Optional: Brief description of your use case and design choices]
```

### Before Sending

- [ ] Proofread email for typos
- [ ] Verify all links are working
- [ ] CognoDB instance is still running
- [ ] No sensitive information in email body
- [ ] Mention if GitHub repo is private (and provide access)

---

## Timeline

- **Deadline**: 48 hours from receiving assignment
- **Recommended**: Submit with 4+ hours to spare (for debugging)
- **Optimal**: Submit 12-24 hours early

---

## Common Issues to Avoid

❌ **Forgetting to delete .env before committing**
✓ Verify: `git ls-files | grep ".env"` shows only `.env.example`

❌ **Hardcoded database credentials**
✓ Verify: `grep -r "password\|cognodb\|bolt" server/ client/` shows only process.env

❌ **Cypher queries with string concatenation**
✓ Verify: All queries use `$variables`, not `${variables}`

❌ **Frontend not connecting to backend**
✓ Verify: `apiClient` baseURL is correct in App.js

❌ **Missing documentation**
✓ Verify: README has "Why Graph DB?" section with 250+ words

❌ **Live demo broken**
✓ Verify: Test live URL before submitting

---

## Sign-Off

Once all items are checked, you're ready to submit!

```
Repository: ✓
Code Quality: ✓
Documentation: ✓
Deployment: ✓
Video: ✓
All Requirements Met: ✓

READY TO SUBMIT! 🚀
```

---

**Last Updated**: August 2024
**Version**: 1.0.0
