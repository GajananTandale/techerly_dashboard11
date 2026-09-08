# Environment Variables Reference

This document outlines all environment variables utilized across the backend server and frontend client applications.

---

## 1. Backend Server (`.env`)

The backend reads configuration from `.env` in the root project directory via `config/index.js` and `dotenv`.

| Variable | Type | Default | Description | Required? |
|---|---|---|---|---|
| `HOSTNAME` | String | `localhost` | Hostname/interface for the Express server to bind to. | Optional |
| `PORT` | Number | `3000` | Port for the Express server. | Optional |
| `NODE_ENV` | String | `development` | Runtime environment (`development` or `production`). In development, CORS is enabled and morgan logs to console. | Optional |
| `DB_URI` | String | `mongodb://localhost:27017/test-debe` (`debe` in `.env.example`) | MongoDB connection URI for local or remote database. Falls back to `test-debe` when unset. | Optional (Required in Prod) |
| `DB_PROD` | String | — | Production MongoDB connection string (e.g. MongoDB Atlas). Used if specified. | Optional |
| `SESSION_EXPIRATION` | Number | `604800000` (7 days) | Express session duration in milliseconds. | Optional |
| `SESSION_SECRET` | String | `setup_dotenv_file_for_security` | Secret used to sign session cookies. Must be changed in production. | **Required in Prod** |
| `JWT_EXPIRY` | Number | `3600000` (1 hour) | Access token expiration lifetime in milliseconds. | Optional |
| `JWT_REFRESH_EXPIRY` | Number | `2592000000` (30 days) | Refresh token expiration lifetime in milliseconds. | Optional |
| `JWT_SECRET` | String | `setup_dotenv_file_for_security` | Cryptographic secret used by Passport JWT strategies. Must be changed in production. | **Required in Prod** |
| `GOOGLE_API_KEY` | String | — | Google API key with YouTube Data API v3 enabled. Used when creating a lesson to automatically fetch video length. | Optional for dev |
| `MG_APIKEY` | String | — | Mailgun API Key. Required to deliver password-reset emails. | Optional for dev |
| `MG_DOMAIN` | String | — | Mailgun sending domain for outgoing transactional emails. | Optional for dev |
| `DEPLOYMENT_HOST` | String | — | SSH host/IP address for PM2 production deployment (`ecosystem.config.js`). | Optional |
| `DEPLOYMENT_USER` | String | — | SSH user for PM2 production deployment. | Optional |
| `DEPLOYMENT_KEY` | String | — | Path to SSH private key for PM2 deployment. | Optional |

---

## 2. Frontend Client (`client/.env`)

The React application (Create React App) reads configuration prefixed with `REACT_APP_` at build/start time.

| Variable | Type | Default | Description | Required? |
|---|---|---|---|---|
| `PORT` | Number | `8080` | Port for the Webpack dev server. Set in `client/.env`. | Optional |
| `REACT_APP_API_URL` | String | `http://localhost:3000/api` | Base URL pointing to the Express backend API. In production builds, the client automatically resolves to `/api/`. | Required in dev |
| `REACT_APP_MOBILE_API_URL` | String | — | Optional local static IP for testing student video interactions on mobile devices on the local network. | Optional |

---

## Setup Instructions

Create the environment files from the provided templates:

```bash
# Root backend configuration
cp .env.example .env

# Frontend configuration
cp client/.env.example client/.env
```
