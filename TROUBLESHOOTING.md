# Troubleshooting Guide

## Common Issues & Solutions

### 1. Database Connection Issues

#### Error: "Database connection lost"

**Symptoms:**
- Frontend shows error banner
- Backend logs: `✗ Failed to connect to CognoDB`
- API returns 503 Service Unavailable

**Causes & Solutions:**

1. **Missing or Invalid Credentials**
   ```bash
   # Check .env file exists
   ls -la .env
   
   # Verify content
   cat .env | grep COGNODB
   ```
   
   **Fix:**
   ```bash
   # Get new credentials from https://console.cognodb.com
   # Update .env with correct URI and password
   COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
   COGNODB_PASSWORD=your-new-password
   ```

2. **CognoDB Instance Not Running**
   ```
   Check https://console.cognodb.com/console
   - Is instance status "Running"?
   - Free tier instances auto-pause after 7 days
   ```
   
   **Fix:**
   ```
   1. Go to console.cognodb.com
   2. Click on your instance
   3. Click "Resume" if paused
   4. Wait 1-2 minutes for startup
   ```

3. **Incorrect URI Format**
   ```
   ✗ Wrong: bolt://instance-id...  (missing +s for secure)
   ✗ Wrong: http://instance-id...  (wrong protocol)
   ✓ Correct: bolt+s://instance-id.databases.cognodb.cloud
   ```

4. **Network/Firewall Issues**
   ```bash
   # Test connection from terminal
   telnet your-instance-id.databases.cognodb.cloud 7687
   
   # Should show "Connected to..."
   ```

5. **Password Contains Special Characters**
   ```bash
   # If password has @ or /, escape it
   # For example: password@123 becomes password%40123
   
   COGNODB_URI=bolt+s://user:password%40123@instance.databases.cognodb.cloud
   ```

---

#### Error: "connect ECONNREFUSED 127.0.0.1:7687"

**Meaning:** Backend can't reach CognoDB server

**Solution:**
```bash
# 1. Verify COGNODB_URI is reachable
curl -I https://your-instance-id.databases.cognodb.cloud

# 2. Check if it's a firewall issue (corporate network?)
# Contact your network admin or use VPN

# 3. Verify credentials one more time
# Copy directly from CognoDB console (don't retype)
```

---

### 2. API Response Issues

#### Error: "TypeError: Cannot read property 'map' of undefined"

**Symptoms:**
- Frontend crashes when loading movies
- Console shows array.map() error
- Backend returns null data

**Cause:** Query returned null or empty array

**Solution:**
```javascript
// In queries.js, check for null values
const result = await session.run(query);
if (!result.records || result.records.length === 0) {
  return [];  // Return empty array, not null
}
return result.records.map(...);
```

---

#### Error: "Invalid value for parameter"

**Symptoms:**
- API returns 400 Bad Request
- Message like: "Invalid value for parameter movieId"

**Cause:** Parameter is not being passed correctly

**Solution:**
```javascript
// ✗ Wrong: Forgetting to pass parameters
const result = await session.run(query);

// ✓ Correct: Always pass parameters object
const result = await session.run(query, { movieId });
```

---

#### Error: 404 Not Found (Movie doesn't exist)

**Symptoms:**
- Movie detail page shows error
- Network tab shows 404 response

**Solution:**
```bash
# 1. Check if database has seed data
npm run seed

# 2. Query directly to verify data exists
# Connect to CognoDB console and run:
# MATCH (m:Movie {id: 'the-dark-knight'}) RETURN m
```

---

### 3. Frontend Issues

#### Frontend Blank Page

**Symptoms:**
- Browser shows nothing
- No console errors

**Cause:** React failed to mount

**Solution:**
```bash
# 1. Check browser console
F12 → Console tab

# 2. Check for errors
# Common: "Cannot find module 'react'"

# 3. Reinstall dependencies
cd client && rm -rf node_modules && npm install

# 4. Restart dev server
npm start
```

---

#### "Cannot GET /api/movies"

**Symptoms:**
- Frontend shows error
- Trying to access API directly returns 404

**Cause:** Backend not running on correct port

**Solution:**
```bash
# 1. Start backend
npm start  # Should show "✓ Server running on http://localhost:5000"

# 2. Check if port 5000 is in use
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000

# 3. Use different port if needed
PORT=3001 npm start
```

---

#### Movie cards not displaying

**Symptoms:**
- Grid shows empty boxes
- No movie titles/images

**Cause:** API returning wrong format or HTML/CSS issue

**Solution:**
```javascript
// 1. Check API response format
// DevTools → Network → /api/movies → Response

// 2. Should look like:
[
  { id: "...", title: "...", releaseYear: ... },
  // ...
]

// 3. If format is wrong, check server/queries.js
// Make sure RETURN statement includes all fields
```

---

### 4. Seed Script Issues

#### Error: "Timeout waiting for session"

**Symptoms:**
- Seed script hangs for 30+ seconds
- Eventually shows timeout error

**Cause:** Database connection slow or non-responsive

**Solution:**
```bash
# 1. Check CognoDB status
# Is instance running? Check console.cognodb.com

# 2. Increase timeout in server/db.js
const driver = neo4j.driver(uri, neo4j.auth.basic(...), {
  connectionTimeout: 10000,  // 10 seconds (default: 5000)
  disableLosslessIntegers: true,
});

# 3. Try seed again
npm run seed
```

---

#### Error: "CONSTRAINT_VIOLATION - Duplicate node ID"

**Symptoms:**
- Seed runs but errors near the end
- Message: "already exists with the same id"

**Cause:** Running seed multiple times without clearing

**Solution:**
```bash
# Seed script clears all data first, so shouldn't happen
# If it does, manually clear:

# 1. Stop seed process (Ctrl+C)

# 2. In CognoDB console, run:
# MATCH (n) DETACH DELETE n
# Returns: Deleted 0 relationships, deleted X nodes

# 3. Try seed again
npm run seed
```

---

#### Error: "Out of memory"

**Symptoms:**
- Seed crashes with "HeapOutOfMemory"
- Error: "Cannot allocate memory"

**Cause:** Too much data being collected in memory

**Solution:**
```bash
# 1. Reduce dataset size in server/seed.js
# Remove some movies or actors

# 2. Increase Node.js memory limit
NODE_OPTIONS="--max_old_space_size=512" npm run seed

# 3. Check free disk space on CognoDB instance
# Free tier: 1 GB disk limit
```

---

### 5. Deployment Issues

#### "Build failed: Cannot find module 'neo4j-driver'"

**Symptoms:**
- Deployment fails during build
- Heroku/Railway shows error

**Cause:** Dependencies not installed

**Solution:**
```bash
# 1. Make sure dependencies are in package.json
npm install neo4j-driver  # Install if missing

# 2. Commit package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"

# 3. Push and redeploy
git push heroku main
```

---

#### "Cannot read process.env variables"

**Symptoms:**
- Deployed app crashes
- Error: "Missing COGNODB_URI"

**Cause:** Environment variables not set on hosting platform

**Solution:**

**For Heroku:**
```bash
heroku config:set COGNODB_URI=bolt+s://...
heroku config:set COGNODB_USERNAME=cognodb
heroku config:set COGNODB_PASSWORD=...

# Verify
heroku config
```

**For Railway:**
```
1. Go to railway.app dashboard
2. Click your project
3. Click "Variables" tab
4. Add:
   COGNODB_URI=bolt+s://...
   COGNODB_USERNAME=cognodb
   COGNODB_PASSWORD=...
5. Redeploy
```

**For Vercel:**
```
1. Go to vercel.com dashboard
2. Click project → Settings
3. Click "Environment Variables"
4. Add variables (only for backend if separate)
```

---

#### Frontend shows "Cannot reach server" on deployed app

**Symptoms:**
- Local works, deployed doesn't
- Network tab shows failed requests to /api/*

**Cause:** API URL is hardcoded to localhost

**Solution:**
```javascript
// In client/src/App.js
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
  // ↑ Uses environment variable if set, defaults to localhost
});
```

**Fix for deployment:**
```bash
# Option 1: Same domain (backend serves frontend)
# Then API_BASE auto-detects from current domain

# Option 2: Set environment variable
# Heroku: heroku config:set REACT_APP_API_BASE=https://my-api.herokuapp.com/api
# Railway: Add REACT_APP_API_BASE=https://my-api.railway.app/api
```

---

### 6. Performance Issues

#### Recommendations query is slow

**Symptoms:**
- Movie detail page takes 5+ seconds
- Recommendations endpoint returns 500

**Solution:**
```bash
# 1. Check indexes exist
# In CognoDB console, run:
# SHOW INDEXES
# Should show indexes on Movie.id, Actor.id, Genre.id

# 2. Create indexes if missing
# CREATE INDEX ON :Movie(id);
# CREATE INDEX ON :Actor(id);
# CREATE INDEX ON :Genre(id);

# 3. Limit results
# Add LIMIT 10 to recommendations query

# 4. Add caching (server/index.js)
const cache = new Map();
async function getCachedRecommendations(movieId) {
  if (cache.has(movieId)) return cache.get(movieId);
  const recs = await queries.getRecommendations(movieId);
  cache.set(movieId, recs);
  return recs;
}
```

---

#### "Too many connections" error

**Symptoms:**
- App crashes after running for a while
- Error: "Unable to acquire connection"

**Cause:** Connection pool exhausted (free tier limit: 200)

**Solution:**
```javascript
// In server/db.js
const driver = neo4j.driver(uri, neo4j.auth.basic(...), {
  maxConnectionPoolSize: 50,  // Reduce from default 100
  connectionAcquisitionTimeout: 5000,
});

// Also ensure sessions are closed
finally {
  await session.close();  // ALWAYS close sessions
}
```

---

### 7. CORS & Security Issues

#### "Access to XMLHttpRequest blocked by CORS policy"

**Symptoms:**
- Browser console shows CORS error
- Network tab shows request to /api/* returns CORS error

**Cause:** Frontend and backend on different domains

**Solution:**
```javascript
// In server/index.js
const cors = require('cors');

// Option 1: Allow all (development only)
app.use(cors());

// Option 2: Specify origin (production)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Then restart backend
npm start
```

---

#### "Unauthorized: Invalid password"

**Symptoms:**
- Seed script fails immediately
- Error: "Invalid password"

**Cause:** Wrong password copied from CognoDB

**Solution:**
```bash
# 1. Go to https://console.cognodb.com
# 2. Click your instance
# 3. Copy password from "Connection Details"
# 4. PASTE (don't retype to avoid typos)
# 5. Update .env
# 6. Restart backend
npm start
```

---

### 8. Git & Version Control Issues

#### "fatal: Not a git repository"

**Symptoms:**
- Git commands fail
- No .git folder

**Solution:**
```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/REPO.git
git push -u origin main
```

---

#### ".env file tracked in Git"

**Symptoms:**
- Accidentally committed .env
- Want to remove it

**Solution:**
```bash
# Remove from Git history (but keep local file)
git rm --cached .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit the change
git add .gitignore
git commit -m "Remove .env from git tracking"

# Push
git push
```

---

### 9. Debugging Tips

#### Enable detailed logging

```javascript
// In server/index.js
const neo4j = require('neo4j-driver');
neo4j.logging.configure({
  level: 'debug'
});

// Shows all database operations
```

#### Use browser DevTools

```
1. Right-click → Inspect
2. Network tab: See all API calls
3. Console tab: See JS errors
4. Application tab: Check localStorage/cookies
```

#### Test API directly

```bash
# Get all movies
curl http://localhost:5000/api/movies

# Get single movie
curl http://localhost:5000/api/movies/the-dark-knight

# Get recommendations
curl "http://localhost:5000/api/movies/inception/recommendations?limit=5"

# Check health
curl http://localhost:5000/api/health
```

---

### 10. Getting Help

**Resources:**
- **CognoDB Issues**: cognodb@wexa.ai
- **Neo4j Documentation**: https://neo4j.com/docs/
- **Cypher Help**: https://neo4j.com/docs/cypher-manual/
- **Node.js Neo4j Driver**: https://github.com/neo4j/neo4j-javascript-driver

**When asking for help, provide:**
1. Error message (full stack trace)
2. Your environment:
   ```bash
   node --version
   npm --version
   ```
3. Steps to reproduce
4. What you've already tried

---

## Quick Diagnosis Checklist

- [ ] Is `npm start` running the backend?
- [ ] Does `npm run seed` complete successfully?
- [ ] Does `curl http://localhost:5000/api/health` return `{"status":"connected"}`?
- [ ] Is `cd client && npm start` showing the frontend?
- [ ] Are all environment variables in `.env` filled?
- [ ] Did you check the browser console for errors (F12)?
- [ ] Did you check the backend server logs (terminal)?
- [ ] Is CognoDB instance running in console.cognodb.com?

---

## Still Stuck?

1. Read the full error message (not just the headline)
2. Check server logs: `npm start` output
3. Check browser console: F12 → Console
4. Check network requests: F12 → Network
5. Search this file for your error keyword
6. Email hr@wexa.ai with steps to reproduce

---

**Last Updated**: August 2024
**Version**: 1.0.0
