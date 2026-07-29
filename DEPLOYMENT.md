# 🚀 Deployment Guide - DJ TrackPrep v1.1

This guide covers deploying Sprint 2 of DJ TrackPrep to production environments.

## Prerequisites

- GitHub account with repository access
- Vercel account (for frontend)
- Railway or Render account (for backend)
- PostgreSQL database (Cloud provider or self-hosted)

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository
1. Go to https://vercel.com/new
2. Import the repository `https://github.com/thayy29/dj-trackprep`
3. Select root directory: `my-app`
4. Click "Deploy"

### Step 2: Environment Variables
In Vercel Project Settings > Environment Variables, add:
```
VITE_API_URL=https://api.trackprep.dev  # Your backend URL
```

### Step 3: Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### Deployment Complete ✅
- Frontend URL: `https://trackprep.vercel.app` (default) or custom domain
- Auto-deploys on push to `main` branch

---

## Backend Deployment (Railway or Render)

### Option A: Railway

#### Step 1: Connect Repository
1. Go to https://railway.app/dashboard
2. Click "New" > "Project from GitHub"
3. Select repository `dj-trackprep`
4. Select root directory: `backend`

#### Step 2: Configure Database
1. In Railway dashboard, add PostgreSQL plugin
2. Copy `DATABASE_URL` from plugin config
3. Add to project variables

#### Step 3: Environment Variables
Add to Railway Variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/trackprep
LOG_LEVEL=info
CORS_ORIGIN=https://trackprep.vercel.app,https://your-custom-domain.com
API_KEY=your-secret-api-key-here  # Optional but recommended
UPLOAD_DIR=/data/uploads
EXPORT_DIR=/data/exports
```

#### Step 4: Deploy
Railway auto-deploys on push to branch. View logs in dashboard.

---

### Option B: Render

#### Step 1: Create Web Service
1. Go to https://dashboard.render.com
2. Click "New Web Service"
3. Connect GitHub repository
4. Select root directory: `backend`

#### Step 2: Configure Build & Deploy
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: Node

#### Step 3: Add Environment Variables
Add all variables from "Option A: Step 3" above

#### Step 4: Configure Database
1. Create PostgreSQL database in Render
2. Copy connection string to `DATABASE_URL`
3. Deploy

---

## Production Checklist

### Security
- [ ] Set strong `API_KEY` in production
- [ ] Restrict `CORS_ORIGIN` to your frontend domain
- [ ] Enable HTTPS (automatic on Vercel/Railway/Render)
- [ ] Rotate credentials regularly
- [ ] Monitor error logs for suspicious activity
- [ ] Backup database daily

### Performance
- [ ] Set `LOG_LEVEL=info` (not debug)
- [ ] Monitor database performance
- [ ] Test rate limiting (100 req/10min)
- [ ] Monitor upload directory disk space
- [ ] Set up monitoring/alerting

### Data Management
- [ ] Configure automatic backups
- [ ] Test restore procedures
- [ ] Document data retention policies
- [ ] Plan cleanup strategy for old exports

---

## Testing Production Deployment

### 1. Frontend
```bash
# Verify frontend loads
curl -I https://your-frontend-url.com

# Check API connectivity
curl https://your-api-url.com/health
```

### 2. Backend API
```bash
# Check health endpoint
curl https://your-api-url.com/health

# Test rate limiting (should get 429 after 100 requests)
for i in {1..101}; do curl -s https://your-api-url.com/health; done

# Test API key (should get 401 if API_KEY is set)
curl https://your-api-url.com/api/tracks  # Without x-api-key header
```

### 3. Full Flow
1. Open frontend in browser
2. Upload audio file
3. Verify analysis completes
4. Export playlist to ZIP
5. Download and verify ZIP contents
6. Check server logs for errors

---

## Rollback Plan

### If Issues Occur
1. **Database Issues**: Restore from backup
2. **Code Issues**: Redeploy previous commit
   ```bash
   git revert <problematic-commit>
   git push main
   ```
3. **Performance Issues**: Increase server resources or scale up

---

## Monitoring & Maintenance

### Logs
- **Vercel**: Vercel Dashboard > Logs
- **Railway**: Railway Dashboard > Logs
- **Render**: Render Dashboard > Logs

### Metrics to Watch
- Response time (target: <500ms)
- Error rate (target: <0.1%)
- Upload success rate (target: >99%)
- Database connection pool usage

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Check disk usage
- [ ] Quarterly: Update dependencies
- [ ] Annually: Security audit

---

## Troubleshooting

### 500 Errors
Check:
- DATABASE_URL is correct
- Database is accessible
- Migrations ran successfully: `knex migrate:latest`

### 401 Unauthorized
- Verify API_KEY is set correctly
- Check x-api-key header in requests
- Reload browser to clear cache

### 429 Rate Limited
- Expected behavior when rate limit exceeded
- Clients should implement exponential backoff
- Check CORS_ORIGIN in logs

### CORS Errors
- Verify CORS_ORIGIN in environment includes frontend URL
- Restart backend after changing CORS_ORIGIN
- Check browser console for full error message

---

## Support & Issues

For deployment issues:
1. Check production logs
2. Verify environment variables
3. Test with `curl` commands above
4. Check GitHub Issues: https://github.com/thayy29/dj-trackprep/issues

---

**Deployment Date**: [Add date here]
**Deployed By**: [Add name here]
**Status**: 🟢 Live / 🟡 Staging / 🔴 Rollback

---

For more information, see:
- [README.md](./README.md) - Features and setup
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Architecture
- [.env.example](./backend/.env.example) - All available variables
