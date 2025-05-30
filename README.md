# ChatSphere API Server

This is the backend API server for the ChatSphere real-time chat application. It provides RESTful API endpoints and WebSocket support for real-time messaging.

## Technologies

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: For type safety
- **Prisma**: ORM for database access
- **PostgreSQL**: Database
- **WebSocket**: For real-time communication
- **JSON Web Tokens (JWT)**: For authentication
- **Jest**: Testing framework

## Project Structure

```
react-live-chatroom-api/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── messages.controller.ts
│   │   └── tokens.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   └── apiAuth.ts    # API token authentication
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts        # JWT handling
│   │   ├── password.ts   # Password hashing
│   │   └── tryCatch.ts   # Error handling
│   ├── index.ts          # Application entry point
│   ├── routes.ts         # API routes setup
│   ├── setup.ts          # Express app setup
│   └── websocket.ts      # WebSocket implementation
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Database Schema

The application uses PostgreSQL with Prisma ORM. The main models are:

- **User**: Application users
- **Room**: Chat rooms
- **Message**: Chat messages
- **ApiToken**: API tokens for authentication

## API Endpoints

### Authentication

- `GET /api/auth/profile`: Get user profile
- `PUT /api/auth/profile`: Update user profile

### Rooms

- `GET /api/rooms`: Get all rooms
- `POST /api/rooms`: Create a new room
- `GET /api/rooms/:id`: Get a specific room
- `POST /api/rooms/:roomId/users`: Add a user to a room

### Messages

- `GET /api/rooms/:roomId/messages`: Get messages for a room
- `POST /api/rooms/:roomId/messages`: Send a message to a room
- `GET /api/messages`: Get all messages (admin/client only)
- `GET /api/users/:userId/messages`: Get messages for a user

### Users

- `POST /api/users`: Create a new user (requires client token)

### Tokens

- `POST /api/tokens/user`: Generate a user token
- `POST /api/tokens/client`: Generate a client token
- `DELETE /api/tokens/:tokenId`: Revoke a token

## Authentication

The API uses a token-based authentication system with two types of tokens:

1. **Client Tokens**: Required to create users and access admin features
2. **User Tokens**: Generated when a user is created, used for regular user operations

### Authentication Flow

1. Client applications must first obtain a client token
2. Using the client token, clients can create users
3. When a user is created, a user token is generated and returned
4. The user token is used for all subsequent user operations

### Token Types

- **USER**: Tokens for authenticated users, generated during user creation
- **CLIENT**: Tokens for API clients, required to create users

## WebSocket Implementation

The server implements WebSocket for real-time messaging with the following events:

- `join`: Join a chat room
- `message`: Send a message to a room
- `new_message`: Broadcast a new message to room members

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/chatjs"
   JWT_SECRET="your-secret-key"
   JWT_API_SECRET="your-api-secret-key"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run lint`: Run ESLint

## Testing

Tests are written using Jest. Run tests with:

```bash
npm test
```

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

## License

MIT
