# 🚀 Deployment Checklist

Quick reference for deploying the auction system.

## ✅ Pre-Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Port 3000 available (or change in docker-compose.yml)
- [ ] Admin password changed (if needed)
- [ ] Code pushed to repository (if using Git)

## 🐳 Docker Deployment Steps

### 1. Build and Start
```bash
docker-compose up -d
```

### 2. Verify Running
```bash
docker-compose ps
```
Should show `Up` status.

### 3. Check Logs
```bash
docker-compose logs -f
```
Look for "✅ Database seeded successfully!" and "🎯 Starting Next.js server..."

### 4. Test Application
Visit: http://localhost:3000 (or your-domain.com)

- [ ] Public dashboard loads
- [ ] Items are visible
- [ ] Leaderboard shows 16 bidders
- [ ] Admin panel accessible at /admin
- [ ] Can login with password: `admin123`

## 🌍 Production Platforms

### Railway
```bash
# Push to GitHub, then in Railway:
1. New Project → Deploy from GitHub
2. Select your repo
3. Auto-detects Dockerfile
4. Deploy!
```

### Render
```bash
1. New Web Service
2. Connect GitHub repo
3. Environment: Docker
4. Deploy
```

### DigitalOcean / AWS / GCP
```bash
# SSH to server
ssh user@your-server

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repo
git clone <your-repo>
cd auction-app

# Start
docker compose up -d

# Setup domain + SSL (recommended)
# Use Caddy or Nginx with Let's Encrypt
```

### Fly.io
```bash
fly launch
fly deploy
```

## 🔒 Security Checklist

- [ ] Change admin password (app/admin/page.tsx)
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure firewall (only allow ports 80, 443, 22)
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Monitor logs for errors

## 📊 Post-Deployment

### Verify Everything Works
- [ ] Public page loads
- [ ] Auto-refresh works (page updates every 3s)
- [ ] Admin login works
- [ ] Can record a sale
- [ ] Can create wildcards
- [ ] Leaderboard updates correctly
- [ ] Budget calculations accurate

### Monitor Health
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Recent logs
docker-compose logs --tail=50

# Follow live logs
docker-compose logs -f
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Database
```bash
# Backup
docker cp $(docker-compose ps -q auction-app):/app/data/dev.db ./backup-$(date +%Y%m%d).db

# Restore
docker cp ./backup.db $(docker-compose ps -q auction-app):/app/data/dev.db
docker-compose restart
```

### Reset Auction
Use the "Reset Auction Data" button in Admin Panel, or:
```bash
docker-compose down -v
docker-compose up -d
```

## 🆘 Troubleshooting

### Container won't start
```bash
docker-compose logs
docker-compose down
docker-compose up
```

### Port conflict
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"
```

### Database corruption
```bash
docker-compose down -v
docker-compose up -d
```

### Out of memory
Check resources:
```bash
docker stats
```
Increase server RAM or add swap.

## 📞 Quick Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Shell access
docker-compose exec auction-app sh

# Rebuild
docker-compose up -d --build

# Full reset
docker-compose down -v && docker-compose up -d
```

## ✨ Success Indicators

You're successfully deployed when:
- ✅ Container status shows "Up (healthy)"
- ✅ Public page shows all 16 bidders
- ✅ 67 items are listed
- ✅ Admin can login and record sales
- ✅ Leaderboard updates in real-time
- ✅ No errors in logs

---

**Need help?** Check [DOCKER.md](DOCKER.md) for detailed documentation.
