# Quick Start Guide - Movie Recommendation Engine

## 📋 What You Have

A complete, production-ready graph database application with:

✅ **Backend API** (Node.js/Express) with 8 RESTful endpoints
✅ **Frontend UI** (React) with 4 interactive pages
✅ **Database Layer** (CognoDB with Neo4j driver)
✅ **Seed Script** with realistic movie/actor/genre data
✅ **Comprehensive Documentation** (README, Architecture, Queries, Troubleshooting)
✅ **Multi-hop Graph Queries** demonstrating Cypher advantages
✅ **Error Handling** with graceful degradation
✅ **Git Repository** ready for deployment

---

## 🚀 Get Started in 5 Minutes

### Step 1: Create CognoDB Instance (1 minute)

1. Go to **https://console.cognodb.com/signup**
2. Sign up (free, no credit card needed)
3. Create a **free (c0) instance**
4. **Save these three values**:
   - **COGNODB_URI** — `bolt+s://your-instance-id.databases.cognodb.cloud`
   - **COGNODB_USERNAME** — `cognodb`
   - **COGNODB_PASSWORD** — (save immediately!)

### Step 2: Configure Environment (1 minute)

```bash
# In d:\Assignment directory, create .env file:
COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your-password-here
PORT=5000
NODE_ENV=development
```

### Step 3: Install & Seed (2 minutes)

**Option A: Windows (Batch Script)**
```bash
cd d:\Assignment
setup.bat
```

**Option B: Manual Install**
```bash
cd d:\Assignment
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
npm run seed
```

Expected output:
```
✓ Connected to CognoDB
🌱 Creating actors...
🌱 Creating genres...
🌱 Creating movies and relationships...
✓ Database seeded successfully!
```

### Step 4: Start the Application (1 minute)

**Terminal 1 — Backend:**
```bash
npm start
```
Expected: `✓ Server running on http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm start
```
Expected: Browser opens http://localhost:3000

### Step 5: Explore!

1. Browse movies on homepage
2. Filter by genre
3. Click a movie for recommendations
4. Click an actor to see co-actors

---

## 📁 Project Structure

```
movie-recommendation-engine/
├── server/                 # Backend (Node.js + Express + Neo4j)
│   ├── index.js           # API routes and error handling
│   ├── db.js              # Database connection management
│   ├── queries.js         # Parameterized Cypher queries
│   └── seed.js            # Database seeding script
├── client/                 # Frontend (React)
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js         # Router and DB health check
│       ├── index.css      # Global styles
│       └── pages/
│           ├── HomePage.js           # Movie listing
│           ├── MovieDetailPage.js    # Recommendations
│           ├── GenrePage.js          # Filter by genre
│           └── ActorPage.js          # Co-actor network
├── README.md              # Main documentation
├── ARCHITECTURE.md        # System design & patterns
├── QUERIES_EXPLAINED.md   # Detailed query explanations
├── TROUBLESHOOTING.md     # Common issues & fixes
├── DEPLOYMENT.md          # Hosting instructions
├── .env.example           # Environment template
└── package.json           # Dependencies
```

---

## 🔄 Typical Development Workflow

```bash
# Terminal 1: Start backend (watches for changes with nodemon optional)
npm start

# Terminal 2: Start frontend (hot reload enabled)
cd client && npm start

# Terminal 3: When updating database structure
npm run seed

# Terminal 4: Run tests (optional)
npm test
```

---

## 🌐 Deploy to Hosting (Choose One)

### Option 1: Railway (⭐ Recommended - Simplest)

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub Repo**:
   - Login to railway.app
   - New Project → Deploy from GitHub
   - Select your repo
3. **Set Environment Variables** in Railway dashboard:
   ```
   COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
   COGNODB_USERNAME=cognodb
   COGNODB_PASSWORD=your-password
   NODE_ENV=production
   ```
4. **Done!** Railway deploys automatically on git push

### Option 2: Heroku

```bash
npm install -g heroku
heroku login
heroku create your-app-name

heroku config:set COGNODB_URI=bolt+s://...
heroku config:set COGNODB_USERNAME=cognodb
heroku config:set COGNODB_PASSWORD=...
heroku config:set NODE_ENV=production

git push heroku main
heroku open
```

### Option 3: Netlify (Frontend Only) + Railway (Backend)

See `DEPLOYMENT.md` for detailed instructions.

---

## 📸 Create Demo Screen Recording

### What to Show (5-10 minutes)

1. **Homepage (30 sec)**
   - Show all movies
   - Filter by genre (e.g., "Action")
   - Show UI responsiveness

2. **Movie Detail Page (2 min)**
   - Click on a movie (The Dark Knight)
   - Show full details (cast, genres, rating)
   - Show **recommendations** (multi-hop query in action!)
   - Explain: "Found via shared genres and actors"

3. **Actor Page (1 min)**
   - Click on actor (Christian Bale)
   - Show filmography
   - Show co-actors (co-actor network - 3-hop query!)

4. **Database Query (1 min)**
   - Open browser DevTools
   - Show Network tab requesting `/api/movies/the-dark-knight/recommendations`
   - Explain the Cypher query doing the work

5. **Code Walk-Through (2-3 min)**
   - Show `server/queries.js` — Cypher queries
   - Highlight recommendations query (multi-hop traversal)
   - Show co-actors query (3-hop traversal)

### Tools

**Windows:**
- Built-in: Win + Shift + S (screenshot)
- OBS Studio (free): https://obsproject.com/
- Screencastify: Chrome extension

**Mac/Linux:**
- OBS Studio (free)
- Quicktime (Mac)

**Keep it simple:**
- 1080p resolution
- Screen + voice narration
- 5-10 minutes total
- Upload to YouTube (unlisted) or Vimeo

---

## 🚨 Before Submitting

### Checklist

- [ ] All code is in GitHub repository
- [ ] `.env` is NOT committed (check `.gitignore`)
- [ ] `.env.example` shows template with YOUR variable names
- [ ] Backend runs without errors (`npm start`)
- [ ] Frontend loads without errors (`cd client && npm start`)
- [ ] Seed script completes successfully (`npm run seed`)
- [ ] API endpoints return correct data
- [ ] README explains the use case
- [ ] README explains "Why a Graph Database?"
- [ ] Data model diagram is in README
- [ ] Queries are documented (QUERIES_EXPLAINED.md)
- [ ] Application is deployed to live URL
- [ ] Screen recording demonstrates features
- [ ] Can explain every line of code

### Example Submission Email

```
To: hr@wexa.ai
Subject: CognoDB Assignment 2 – [Your Name]

Repository: https://github.com/YOUR_USERNAME/movie-recommendation-engine
Demo Link: https://movie-recommendation-engine.railway.app/
Screen Recording: https://youtube.com/watch?v=... OR https://vimeo.com/...

Quick start:
1. Clone repo
2. Copy .env.example to .env
3. Add CognoDB credentials
4. npm install && npm run seed
5. npm start (backend) && cd client && npm start (frontend)

Highlights:
- Uses CognoDB graph database (bolt+s protocol)
- Multi-hop Cypher queries for recommendations
- React frontend with responsive design
- Clean error handling and loading states
- Production-ready architecture

[Add any notes about your implementation choices]
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Main project documentation, setup, and use case |
| **ARCHITECTURE.md** | System design, patterns, and scalability |
| **QUERIES_EXPLAINED.md** | Deep dive into each Cypher query |
| **TROUBLESHOOTING.md** | Common issues and solutions |
| **DEPLOYMENT.md** | Hosting options (Railway, Heroku, Vercel) |

Read these in order to understand the project fully.

---

## 🎓 Key Concepts Demonstrated

### Graph Database Advantages
- ✓ Multi-hop traversals (2-3+ hops efficiently)
- ✓ Relationship-centric queries
- ✓ Intuitive path expressions
- ✓ Cleaner code than relational joins

### Cypher Query Patterns
- ✓ Single node retrieval with index
- ✓ One-hop relationship traversal
- ✓ Two-hop path expression (recommendations)
- ✓ Three-hop traversal (co-actors)
- ✓ Aggregation with COLLECT
- ✓ Optional matches (LEFT JOINs)
- ✓ WHERE filtering
- ✓ Parameterized queries (injection-safe)

### Full-Stack Development
- ✓ RESTful API design
- ✓ React component architecture
- ✓ Routing and navigation
- ✓ Error handling and loading states
- ✓ Environment configuration
- ✓ Database connection management
- ✓ Production-ready code structure

---

## 🤔 Frequently Asked Questions

**Q: Can I add more movies/actors?**
A: Yes! Edit `server/seed.js` and re-run `npm run seed`. Data is wiped and reloaded each time.

**Q: How do I change the recommendation algorithm?**
A: Edit `server/queries.js` → `getRecommendations()` function. Current logic uses genres + actors.

**Q: Can I deploy just the frontend?**
A: Yes! But you need a backend. Recommended: Deploy both to same service (Railway, Heroku) for simplicity.

**Q: What if I get "database connection lost"?**
A: See TROUBLESHOOTING.md → "Database Connection Issues". Usually .env credentials or CognoDB instance paused.

**Q: How do I scale this?**
A: See ARCHITECTURE.md → "Scalability Path". Add caching, upgrade CognoDB instance, use CDN.

---

## 📞 Getting Help

- **CognoDB issues**: cognodb@wexa.ai
- **Assignment questions**: Reply to assignment email
- **Code questions**: Review TROUBLESHOOTING.md and ARCHITECTURE.md

---

## 🎉 You're Ready!

Your application is:
- ✅ Fully functional
- ✅ Production-ready
- ✅ Demonstrates graph database advantages
- ✅ Well-documented
- ✅ Ready to deploy
- ✅ Ready to present

**Next Steps:**
1. Deploy to Railway/Heroku
2. Create screen recording
3. Double-check checklist
4. Submit to hr@wexa.ai

Good luck! 🚀

---

**Last Updated**: August 2024
**Version**: 1.0.0
