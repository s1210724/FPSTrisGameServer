# FPSTrisGameServer

Backend server for the FPSTris project. It serves the web pages, handles authentication, and manages real-time multiplayer game and lobby updates through Socket.IO.

## What it does

- Serves the public pages from `src/public` and `src/views`
- Exposes authentication and page routes with Express
- Manages lobby, session, and game-state updates over Socket.IO
- Validates JWT-based user sessions
- Includes Jest tests for the lobby service

## Tech Stack

- Node.js
- Express
- Socket.IO
- JWT / jose
- Jest

## Requirements

- Node.js 20 or newer is recommended
- npm

## Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create a `.env` file in the project root with the required values.

3. Start the server:

	```bash
	npm start
	```

The server listens on `process.env.PORT`.

## Environment Variables

The project uses these environment variables:

- `PORT` - HTTP server port
- `API_SERVER_URL` - base URL for the API server and JWKS endpoint
- `JWT_ISSUER` - expected token issuer
- `JWT_AUDIENCE` - expected token audience
- `NODE_ENV` - used to adjust auth cookie behavior in production

## Scripts

- `npm start` - starts the server with `node src/server.js`
- `npm test` - runs the Jest test suite

## Routes

Page routes are handled by Express in `src/routes/pageRoutes.js`.

Public and protected pages include:

- `/`
- `/login`
- `/register`
- `/logged-in`
- `/admin`
- `/game`
- `/lobby`
- `/apicall`

API routes include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user`
- `POST /api/auth/logout`

## Testing

The repository currently includes Jest coverage for the lobby service in `tests/lobbyService.test.js`.

Run the tests locally with:

```bash
npm test
```

## Project Structure

- `src/server.js` - entry point that starts Express and Socket.IO
- `src/app.js` - Express app setup
- `src/controllers/` - route handlers
- `src/middleware/` - auth middleware for pages
- `src/models/` - lobby and session data helpers
- `src/services/` - business logic for lobbies, sessions, and pages
- `src/sockets/` - real-time game socket handlers
- `src/public/` - static assets and client-side scripts
- `src/views/` - HTML pages
- `tests/` - Jest tests

## Notes

- Socket connections accept either a token in the handshake or a `token` cookie.
- Lobby and session state is managed in memory, so restarting the server clears active game state.
