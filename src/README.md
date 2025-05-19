# ChatSphere API Server Source Code

This directory contains the source code for the ChatSphere API server. This document provides an overview of the code structure, key components, and architecture.

## Directory Structure

```
src/
├── controllers/        # Request handlers
│   ├── auth.controller.ts     # Authentication controller
│   ├── messages.controller.ts # Message handling
│   └── tokens.controller.ts   # API token management
├── middleware/         # Express middleware
│   ├── auth.ts         # User authentication middleware
│   └── apiAuth.ts      # API token authentication
├── routes/             # API routes
│   ├── auth.routes.ts  # Authentication routes
│   └── index.ts        # Route aggregation
├── utils/              # Utility functions
│   ├── jwt.ts          # JWT token handling
│   ├── password.ts     # Password hashing
│   ├── tryCatch.ts     # Error handling wrapper
│   └── userTokenCookie.ts # Cookie management
├── index.ts            # Application entry point
├── routes.ts           # API routes setup
├── setup.ts            # Express app setup
└── websocket.ts        # WebSocket implementation
```

## Key Components

### Controllers

- **auth.controller.ts**: Handles user authentication
  - User registration
  - User login
  - Profile management

- **messages.controller.ts**: Manages chat messages
  - Sending messages
  - Retrieving messages by room
  - Retrieving messages by user

- **tokens.controller.ts**: Manages API tokens
  - Generating USER tokens
  - Generating CLIENT tokens
  - Revoking tokens

### Middleware

- **auth.ts**: Authenticates users via JWT
  - Verifies user tokens
  - Adds user information to request object

- **apiAuth.ts**: Authenticates API requests
  - Verifies API tokens
  - Handles different token types (USER/CLIENT)
  - Authorizes room access

### Utilities

- **jwt.ts**: JWT token utilities
  - Token generation
  - Token verification
  - Payload type definitions

- **tryCatch.ts**: Error handling wrapper
  - Simplifies controller error handling
  - Provides consistent error responses

- **userTokenCookie.ts**: Cookie management
  - Sets user tokens in cookies
  - Retrieves tokens from cookies
  - Clears token cookies

### WebSocket

- **websocket.ts**: Real-time messaging
  - Manages WebSocket connections
  - Handles joining rooms
  - Processes and broadcasts messages

## Authentication Flow

1. **User Registration/Login**:
   - User provides credentials
   - Server validates credentials
   - JWT token is generated
   - Token is stored in cookies

2. **API Authentication**:
   - Token is extracted from Authorization header or cookies
   - Token is verified
   - User/client information is added to request

3. **Token Types**:
   - **USER**: For authenticated users (limited access)
   - **CLIENT**: For API clients (broader access)

## WebSocket Protocol

The WebSocket server handles the following message types:

- **join**: Client joins a chat room
- **message**: Client sends a message to a room
- **new_message**: Server broadcasts a new message to room members

## Error Handling

Error handling is implemented using:

- **tryCatch wrapper**: Catches controller errors
- **Try/catch blocks**: For specific error handling
- **HTTP status codes**: For appropriate error responses

## Database Interaction

Database operations are performed using Prisma ORM:

- **User operations**: User creation, retrieval, updates
- **Room operations**: Room creation, member management
- **Message operations**: Message creation and retrieval
- **Token operations**: Token creation, retrieval, revocation

## Testing

Tests are located in:

- `src/utils/__tests__/`: Tests for utility functions
- `src/routes.test.ts`: Tests for API routes

The tests use Jest as the testing framework.
