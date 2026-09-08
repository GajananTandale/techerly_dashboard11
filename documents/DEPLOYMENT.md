# Tcherly Deployment Guide

This guide covers deploying **Tcherly** (DEBE) to a production Linux server (e.g., Ubuntu 20.04 / 22.04 LTS) using **PM2**, **Nginx**, and **Certbot (SSL)**.

---

## Table of Contents

- [Production Architecture](#production-architecture)
- [Server Requirements](#server-requirements)
- [Method 1: Manual Production Installation](#method-1-manual-production-installation)
  - [1. Server Prerequisites](#1-server-prerequisites)
  - [2. Clone & Install Dependencies](#2-clone--install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Build the Frontend](#4-build-the-frontend)
  - [5. Process Management with PM2](#5-process-management-with-pm2)
  - [6. Configure Nginx Reverse Proxy & SSL](#6-configure-nginx-reverse-proxy--ssl)
- [Method 2: Automated Deployment via PM2 Deploy](#method-2-automated-deployment-via-pm2-deploy)
- [Database Setup & Backups](#database-setup--backups)
- [Operations & Maintenance](#operations--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Production Architecture

In production, the architecture runs as a unified single-process service behind a reverse proxy:

```
Internet (HTTPS :443)
       │
       ▼
  Nginx (SSL Termination & Reverse Proxy)
       │ (HTTP :3000)
       ▼
 Express Server (`server.js`) managed by PM2
  ├── Static Files (`/` ──► `client/build`)
  ├── SPA Routing (`*` ──► `client/build/index.html`)
  └── REST API (`/api/*` ──► Controllers & Passport Auth)
       │
       ▼
 MongoDB (Local or MongoDB Atlas Cluster)
```

---

## Server Requirements

- **Operating System**: Ubuntu 20.04 LTS / 22.04 LTS, Debian 11+, or similar Linux distribution.
- **Hardware**: Minimum 1 vCPU, 2 GB RAM (at least 1 GB swap recommended if building on a small instance).
- **Node.js**: Node.js `v14.x` or `v16.x` LTS (or Node `v18.x`+ with `NODE_OPTIONS=--openssl-legacy-provider`).
- **Process Manager**: PM2.
- **Database**: MongoDB v4.4+ (local instance or managed Atlas cluster).
- **Reverse Proxy**: Nginx with Let's Encrypt SSL certificate.

---

## Method 1: Manual Production Installation

### 1. Server Prerequisites

Connect to your server and install Node.js, Yarn, PM2, and Nginx:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential

# Install Node.js (Node 16 LTS recommended for Webpack 4 / CRA compatibility)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn and PM2 globally
sudo npm install -g yarn pm2

# Verify versions
node -v    # v16.x
yarn -v    # 1.22.x
pm2 -v
```

> **Note for Node.js 18+ / 20+**: If your server uses Node 18 or newer, set the legacy OpenSSL flag in your shell profile before building the client:
> ```bash
> echo 'export NODE_OPTIONS=--openssl-legacy-provider' >> ~/.bashrc
> source ~/.bashrc
> ```

---

### 2. Clone & Install Dependencies

Clone the repository to the application user's home directory (e.g., `/home/ubuntu/tcherly` or `/var/www/tcherly`):

```bash
cd ~
git clone https://github.com/IITB-EdTech/tcherly.git
cd tcherly

# Install root dependencies
yarn

# Install client dependencies
yarn install:c
```

---

### 3. Configure Environment Variables

Create the production `.env` file in the project root:

```bash
cp .env.example .env
nano .env
```

Set the production values:

```ini
HOSTNAME=0.0.0.0
PORT=3000
NODE_ENV=production

# Database (Replace with your local URI or MongoDB Atlas connection string)
DB_URI="mongodb://localhost:27017/debe"
# Or if using MongoDB Atlas:
# DB_PROD="mongodb+srv://<user>:<password>@cluster.mongodb.net/debe?retryWrites=true&w=majority"

# Security Secrets (MUST be unique, long random strings)
SESSION_EXPIRATION=604800000
SESSION_SECRET="generate_a_cryptographically_secure_random_session_secret_here"

JWT_EXPIRY=3600000
JWT_REFRESH_EXPIRY=2592000000
JWT_SECRET="generate_a_cryptographically_secure_random_jwt_secret_here"

# YouTube Data API Key (Required for automatic lecture duration lookup)
GOOGLE_API_KEY="your_google_cloud_api_key_with_youtube_v3_enabled"

# Mailgun Credentials (Required for password-reset emails)
MG_APIKEY="your_mailgun_api_key"
MG_DOMAIN="your_mailgun_verified_domain"
```

Configure the client environment:
```bash
cp client/.env.example client/.env
nano client/.env
```
Configure the client API endpoint (in production, the client automatically resolves to `/api/`):
```ini
REACT_APP_API_URL="/api"
```

---

### 4. Build the Frontend

Compile the React frontend into static production assets:

```bash
yarn build
```

This generates the static files in `client/build/`, which Express automatically serves when `NODE_ENV=production`.

---

### 5. Process Management with PM2

Use PM2 to manage the application process, handle restarts, and monitor logs.

#### Start Application with PM2:

```bash
pm2 start ecosystem.config.js --env production
```

Alternatively, run directly with PM2:
```bash
pm2 start server.js --name "tcherly" --env NODE_ENV=production
```

#### Configure PM2 Startup on Server Reboot:

```bash
# Generate and configure systemd startup script
pm2 startup

# Follow the on-screen command provided by PM2, e.g.:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current PM2 processes to resurrect on boot
pm2 save
```

#### Verify Process Status:
```bash
pm2 status
pm2 logs debe --lines 50
```

---

### 6. Configure Nginx Reverse Proxy & SSL

#### 1. Create Nginx Site Configuration:

```bash
sudo nano /etc/nginx/sites-available/tcherly
```

Paste the following configuration (replace `yourdomain.com` with your actual domain name):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Client body limit for file uploads/exports
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running reports or Excel exports
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

#### 2. Enable the Site and Test Configuration:

```bash
sudo ln -s /etc/nginx/sites-available/tcherly /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Install SSL Certificate with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically configures HTTPS redirection and certificate renewals.

---

## Method 2: Automated Deployment via PM2 Deploy

The repository includes a built-in PM2 deployment target configured in `ecosystem.config.js`.

### 1. Configure Local Machine `.env`

Add deployment credentials to your local `.env`:

```ini
DEPLOYMENT_HOST="your.server.ip.or.hostname"
DEPLOYMENT_USER="ubuntu"
DEPLOYMENT_KEY="~/.ssh/id_rsa"
```

Ensure your server user has SSH access and Git read permissions for the repository.

### 2. Initial Remote Setup (First Time Only)

Run PM2 deployment setup on your local machine:

```bash
npx pm2 deploy ecosystem.config.js production setup
```

This clones the repository to `~/debe` on the remote server.

### 3. Deploy Updates

When changes are pushed to GitHub `origin/main`, trigger an automated deployment:

```bash
yarn deploy
```

PM2 SSHs into the remote server, pulls the latest commits, and runs the configured post-deploy hook:
```bash
yarn && yarn install:c && yarn build && pm2 startOrRestart ecosystem.config.js --env production --update-env
```

---

## Database Setup & Backups

### Local MongoDB Setup (Ubuntu)

If running MongoDB directly on the same server:

```bash
sudo apt install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

### Automated Database Backups

Schedule regular automated database dumps with a daily cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM:
0 2 * * * mongodump --uri="mongodb://localhost:27017/debe" --archive="/var/backups/tcherly_$(date +\%Y\%m\%d).gz" --gzip
```

---

## Operations & Maintenance

### Seed Administrator / Researcher Account

Researchers cannot register through the public UI. Create the initial administrative researcher account on the server:

```bash
cd ~/tcherly
yarn generate --name "Lead Researcher" --email "researcher@yourdomain.com" --pass "StrongPassword123"
```

### Useful PM2 Commands

| Command | Action |
|---|---|
| `pm2 status` | View running processes, CPU, and memory usage |
| `pm2 logs debe` | Stream consolidated server output and error logs |
| `pm2 reload debe` | Zero-downtime reload of the application |
| `pm2 restart debe` | Hard restart of the Express process |
| `pm2 stop debe` | Stop the application |
| `pm2 monit` | Terminal dashboard monitoring system metrics |

### Log Rotation

To prevent logs from consuming unbounded disk space:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Troubleshooting

1. **Client Shows Blank Page after Deploy**:
   - Check if `client/build/index.html` exists.
   - Verify `yarn build` completed successfully without out-of-memory errors.
   - Ensure `NODE_ENV=production` is passed to the Express process.

2. **502 Bad Gateway from Nginx**:
   - Verify the Express server is running on port 3000: `curl http://127.0.0.1:3000`.
   - Check PM2 status: `pm2 status`.
   - Check PM2 error logs: `pm2 logs debe --err`.

3. **Build Fails with `JavaScript heap out of memory`**:
   - React compilation requires sufficient memory. Add swap if running on a 1GB/2GB instance:
     ```bash
     sudo fallocate -l 2G /swapfile
     sudo chmod 600 /swapfile
     sudo mkswap /swapfile
     sudo swapon /swapfile
     ```
   - Alternatively, pass `--max_old_space_size=1500` to the build script.

4. **Mailgun / Password Reset Not Delivering**:
   - Check `MG_APIKEY` and `MG_DOMAIN` in `.env`.
   - Verify that your domain DNS records (SPF, DKIM, MX) are active in Mailgun.
