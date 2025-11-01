# 🐳 Docker Deployment Guide

Deploy the auction system using Docker in minutes.

## Quick Start

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

Access the app at: **http://localhost:3000**

## What Happens Automatically

When you run `docker-compose up`, the system automatically:

1. ✅ Builds the Next.js application
2. ✅ Creates the SQLite database
3. ✅ Runs database migrations (Prisma)
4. ✅ Seeds sample data (16 bidders + 67 items)
5. ✅ Starts the web server on port 3000

**No manual setup required!** Everything is configured and ready to use.

## Docker Commands

### Start the Application
```bash
docker-compose up -d
```
The `-d` flag runs it in detached mode (background).

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Stop the Application
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Reset Everything (Fresh Start)
```bash
# Stop and remove containers + volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Data Persistence

Database is stored in a Docker volume named `auction-data`. Your auction data persists even if you:
- Stop the container
- Restart your computer
- Rebuild the image

To completely reset and start fresh, use:
```bash
docker-compose down -v
```

## Environment Variables

Default configuration works out-of-the-box. To customize:

```yaml
# In docker-compose.yml
environment:
  - NODE_ENV=production
  - DATABASE_URL=file:/app/data/dev.db
```

## Port Configuration

Change the exposed port in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Access at localhost:8080
```

## Production Deployment

### Deploy to Any VPS (AWS, DigitalOcean, etc.)

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# 3. Clone or upload your code
git clone <your-repo>
cd auction-app

# 4. Start the application
docker compose up -d

# 5. (Optional) Set up reverse proxy with Nginx
```

### Deploy to Railway

1. Push code to GitHub
2. Import project in Railway
3. Add Dockerfile deployment
4. Railway auto-detects and deploys

### Deploy to Render

1. Create new Web Service
2. Connect GitHub repo
3. Select "Docker" as environment
4. Deploy

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

## Health Checks

The container includes automatic health checks:
- Checks `/api/items` endpoint every 30 seconds
- Restarts automatically if unhealthy
- 40-second startup grace period

## Troubleshooting

### Container won't start?
```bash
# Check logs
docker-compose logs

# Verify Docker is running
docker ps
```

### Port 3000 already in use?
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Database issues?
```bash
# Reset database volume
docker-compose down -v
docker-compose up -d
```

### Need to access the database?
```bash
# Enter container
docker-compose exec auction-app sh

# Access SQLite
sqlite3 /app/data/dev.db
```

## Development vs Production

**Development (local):**
```bash
npm run dev
```

**Production (Docker):**
```bash
docker-compose up -d
```

Docker is optimized for production with:
- Multi-stage builds (smaller image)
- Static file optimization
- Automatic health checks
- Data persistence
- Easy scaling

## Resource Requirements

**Minimum:**
- 512 MB RAM
- 1 CPU core
- 1 GB disk space

**Recommended:**
- 1 GB RAM
- 2 CPU cores
- 2 GB disk space

## Monitoring

View real-time stats:
```bash
docker stats
```

Check container health:
```bash
docker-compose ps
```

## Backup Database

```bash
# Copy database from container
docker cp $(docker-compose ps -q auction-app):/app/data/dev.db ./backup.db

# Restore database
docker cp ./backup.db $(docker-compose ps -q auction-app):/app/data/dev.db
```

## Security Notes

For production deployments:

1. **Change admin password** in `/app/admin/page.tsx`
2. **Use HTTPS** with reverse proxy (Nginx/Caddy)
3. **Regular backups** of database volume
4. **Update dependencies** regularly
5. **Limit exposed ports** via firewall

## Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify Docker version: `docker --version`
3. Ensure ports are available: `netstat -an | grep 3000`
4. Try fresh start: `docker-compose down -v && docker-compose up -d`

---

**Ready to deploy! 🚀** Just run `docker-compose up -d` and you're live.
