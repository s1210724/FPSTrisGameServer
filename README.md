# FPSTrisGameServer

Backend server for the FPSTris project. It serves static pages, handles authentication, and manages real-time multiplayer game and lobby updates through Socket.IO.

## What it does

- Serves the public pages from `src/public` and `src/views`
- Exposes authentication and page routes with Express
- Proxies login and registration requests to an API server
- Validates JWT-based user sessions using a JWKS endpoint
- Manages lobby, session, and game-state updates over Socket.IO
- Includes Jest tests for the lobby service

## Tech Stack

- Node.js
- Express
- Socket.IO
- JWT / jose
- Jest
- dotenv

## Requirements

- Node.js 20 or newer is recommended
- npm

## Installation

1. Clone or download the repository.
2. Open a terminal in the project root.
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the project root with the required environment variables.

5. Start the server:

```bash
npm start
```

6. Open the server URL in your browser:

```text
http://localhost:<PORT>
```

## Environment Variables

Create a `.env` file in the project root and set the values listed below.

### Required variables

- `PORT`
  - The port number the Express server listens on.
  - Example: `PORT=3000`
- `API_SERVER_URL`
  - Base URL of the API server used for authentication requests and JWKS fetching.
  - Example: `API_SERVER_URL=https://auth.example.com`
- `JWT_ISSUER`
  - Expected `iss` claim in incoming JWTs.
  - Example: `JWT_ISSUER=https://auth.example.com`
- `JWT_AUDIENCE`
  - Expected `aud` claim in incoming JWTs.
  - Example: `JWT_AUDIENCE=fpstris-client`

### Optional variables

- `NODE_ENV`
  - Set to `production` to enable the `Secure` flag on auth cookies.
  - If unset or any value other than `production`, cookies are still sent without `Secure`.

### Example `.env`

```env
PORT=3000
API_SERVER_URL=https://api.example.com
JWT_ISSUER=https://auth.example.com
JWT_AUDIENCE=fpstris-client
NODE_ENV=development
```

## How environment variables are used

- `PORT`
  - Used by `src/server.js` to start the HTTP server.
- `API_SERVER_URL`
  - Used by `src/controllers/authController.js` to proxy login and register requests to the API server.
  - Used by `src/auth/jwtValidator.js` to fetch JWKS from `API_SERVER_URL/api/.well-known/jwks.json`.
- `JWT_ISSUER` and `JWT_AUDIENCE`
  - Used by `src/auth/jwtValidator.js` when validating JWT claims.
- `NODE_ENV`
  - Used by `src/controllers/authController.js` to decide whether to add the `Secure` flag to auth cookies.

## Scripts

- `npm start` - starts the server with `node src/server.js`
- `npm test` - runs the Jest test suite

## Testing

The repository includes Jest tests for the lobby service in `tests/lobbyService.test.js`.

Run tests locally with:

```bash
npm test
```

## Project Structure

- `src/server.js` - entry point that starts Express and Socket.IO
- `src/app.js` - Express app setup
- `src/controllers/` - route handlers and auth proxy logic
- `src/middleware/` - auth middleware for pages
- `src/models/` - lobby and session data helpers
- `src/services/` - business logic for lobbies, sessions, and pages
- `src/sockets/` - real-time game socket handlers
- `src/public/` - static assets and client-side scripts
- `src/views/` - HTML pages
- `tests/` - Jest tests

## Notes

- The application relies on a backend API server for auth operations; it forwards registration and login requests to `API_SERVER_URL`.
- Lobby and session state is stored in memory, so restarting the server clears active game state.
- Socket.IO is configured with open CORS origin `*` for development.
