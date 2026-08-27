# Movie Recommendation Engine - Deployment Guide

## Deploying to Vercel (Frontend Only)

### Step 1: Build the frontend
```bash
cd client
npm run build
```

### Step 2: Create vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 3: Deploy
```bash
npm i -g vercel
vercel
```

---

## Deploying to Railway (Full Stack)

### Recommended for simplicity and free tier

1. **Create Railway Account**: https://railway.app
2. **Create New Project** → Deploy from GitHub
3. **Connect GitHub Repository**
4. **Set Environment Variables** in Railway dashboard:
   ```
   COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
   COGNODB_USERNAME=cognodb
   COGNODB_PASSWORD=your-password-here
   NODE_ENV=production
   ```

5. Railway will automatically:
   - Detect Node.js from `package.json`
   - Install dependencies
   - Run `npm start`
   - Expose on public URL

---

## Deploying to Heroku (Full Stack)

### Step 1: Install Heroku CLI
```bash
npm install -g heroku
heroku login
```

### Step 2: Create Heroku App
```bash
heroku create your-app-name
```

### Step 3: Set Environment Variables
```bash
heroku config:set COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
heroku config:set COGNODB_USERNAME=cognodb
heroku config:set COGNODB_PASSWORD=your-password-here
heroku config:set NODE_ENV=production
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: Open App
```bash
heroku open
```

---

## Environment Variables

**Never expose secrets in code!** Always use environment variables:

- `COGNODB_URI` — Your CognoDB connection string
- `COGNODB_USERNAME` — Usually "cognodb"
- `COGNODB_PASSWORD` — From CognoDB console (save immediately)
- `PORT` — Server port (default: 5000)
- `NODE_ENV` — "development" or "production"
- `REACT_APP_API_BASE` — Backend API URL (for frontend)

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run seed
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: build
          path: client/build/
```

---

## Monitoring & Debugging

### Check CognoDB Status
```bash
curl -X GET "https://console.cognodb.com/api/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Backend Logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail
```

### Test API
```bash
curl http://your-app.herokuapp.com/api/health
```

---

## Scaling Considerations

### Free Tier Limits
- CognoDB c0: 0.5 vCPU, 256 MB RAM, 1 GB disk
- Suitable for ~100K nodes/relationships
- Up to 200 concurrent connections

### To Scale Up
1. **Upgrade CognoDB instance** (console.cognodb.com)
2. **Use database indexing** for frequently queried properties
3. **Implement caching** (Redis) for recommendations
4. **Use read replicas** for scaling read-heavy workloads

---

## Troubleshooting

### "Cannot connect to CognoDB"
- Verify credentials in environment variables
- Check instance status in CognoDB console
- Ensure IP whitelist allows your server IP

### "Out of memory"
- Reduce dataset size or seed data
- Implement pagination in API endpoints
- Use LIMIT in Cypher queries

### "Slow recommendations query"
- Add index on Movie.id and Genre.id
- Increase LIMIT to reduce result size
- Consider caching frequent queries

---

## Production Checklist

- [ ] Environment variables are set (never in .env)
- [ ] Database credentials are secure
- [ ] HTTPS is enabled
- [ ] CORS is configured properly
- [ ] Rate limiting is in place
- [ ] Error logging is configured
- [ ] Database backups are scheduled
- [ ] Monitoring/alerts are set up
- [ ] API documentation is available
- [ ] Load testing has been performed

---

For questions: hr@wexa.ai
