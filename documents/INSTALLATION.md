# Tcherly Installation Guide

This guide walks you through setting up **Tcherly** (DEBE) locally for development or production.

---

## Prerequisites

Before starting, verify you have the required runtimes and tools installed:

1. **Node.js**:
   - **Recommended**: Node.js `v14.x` or `v16.x` LTS.
   - *Note on Node 17+*: React Scripts 4.0.1 uses Webpack 4, which requires the legacy OpenSSL provider on newer Node versions. If using Node 17+, set:
     ```bash
     export NODE_OPTIONS=--openssl-legacy-provider
     ```
   - Verify: `node -v`
2. **Yarn** (Classic v1.x):
   ```bash
   npm install --global yarn
   yarn -v
   ```
3. **MongoDB** (v4.4+):
   - **macOS (Homebrew)**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
   - **Linux (Ubuntu/Debian)**: Follow the [MongoDB Community Edition on Linux](https://www.mongodb.com/docs/manual/administration/install-on-linux/) guide.
   - **Windows**: Download and install the [MongoDB Community Server](https://www.mongodb.com/try/download/community).
   - Alternatively, use a hosted MongoDB instance (e.g., [MongoDB Atlas](https://www.mongodb.com/atlas/database)).

---

## Getting Started

### 1. Clone the Repository

Clone the repository to your local workspace:

```bash
# Via SSH:
git clone git@github.com:IITB-EdTech/tcherly.git
cd tcherly

# Or via HTTPS:
git clone https://github.com/IITB-EdTech/tcherly.git
cd tcherly
```

### 2. Install Dependencies

Install root backend dependencies, followed by client frontend dependencies:

```bash
# 1. Install root dependencies
yarn

# 2. Install client dependencies (runs `cd client && yarn`)
yarn install:c
```

### 3. Configure Environment Variables

Both the backend server and frontend client require `.env` configuration files.

#### Backend (`.env` in project root)
```bash
cp .env.example .env
```
Key variables to verify:
- `PORT`: Server port (default: `3000`).
- `DB_URI`: MongoDB connection string (`"mongodb://localhost:27017/debe"` in `.env.example`, falling back to `"mongodb://localhost:27017/test-debe"` if unset).
- `JWT_SECRET`: Secret key for signing JSON Web Tokens.
- `SESSION_SECRET`: Secret key for express session encryption.
- `GOOGLE_API_KEY`: *(Optional in dev)* Google YouTube API Key to fetch lecture durations automatically during lesson creation.
- `MG_APIKEY` & `MG_DOMAIN`: *(Optional in dev)* Mailgun credentials for sending password-reset emails.

#### Frontend (`client/.env`)
```bash
cp client/.env.example client/.env
```
Key variables:
- `PORT`: Frontend development server port (default: `8080`).
- `REACT_APP_API_URL`: Backend API endpoint (default: `"http://localhost:3000/api"`).

> For a complete breakdown of all configuration parameters, see [ENVIRONMENT.md](ENVIRONMENT.md).

---

## Running the Application

### Development Mode

Run both the Express backend and React frontend concurrently:

```bash
yarn dev
```

- **Frontend Client**: Accessible at [http://localhost:8080](http://localhost:8080)
- **Backend API**: Accessible at [http://localhost:3000](http://localhost:3000)

Alternatively, run them in separate terminal windows:
- Backend only: `yarn dev:s` (with nodemon live-reloading)
- Frontend only: `yarn dev:c`

### Production Mode

To test a production build locally:

```bash
yarn build
yarn start
```
Or use the combined shortcut:
```bash
yarn serve
```
In production, Express serves both API endpoints and the compiled React static bundle from `client/build` on port `3000`.

---

## Post-Installation Steps

### 1. Create a Researcher Account (CLI)

Researchers cannot register through the web UI and must be provisioned via the command line:

```bash
yarn generate --name "Admin Researcher" --email researcher@example.com --pass "securePassword123"
```

To remove a researcher account:
```bash
yarn generate --email researcher@example.com --remove
```

### 2. Teacher & Student Accounts

- **Teachers**: Register via the web UI at [http://localhost:8080/register](http://localhost:8080/register).
- **Students**: Prompted to register or log in when accessing a shared lesson link (`/l/:lesson_id`).

---

## Troubleshooting

- **MongoDB Connection Error (`MongoNetworkError: failed to connect to server`)**:
  Ensure MongoDB service is actively running (`brew services list` or `sudo systemctl status mongod`) and matches `DB_URI` in `.env`.
- **Node 17+ OpenSSL Error (`ERR_OSSL_EVP_UNSUPPORTED`)**:
  Webpack 4 inside Create React App requires the OpenSSL legacy provider. Run:
  `export NODE_OPTIONS=--openssl-legacy-provider` before running `yarn dev` or `yarn build`.
- **Port Conflicts**:
  If port `3000` or `8080` is in use, modify `PORT` in `.env` (backend) or `client/.env` (frontend) respectively.

---

## Production Deployment

For complete instructions on deploying to a production Linux server using PM2, Nginx reverse proxy, Let's Encrypt SSL, and automated deployment hooks, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

