# ChatSphere Database Schema

This directory contains the Prisma schema definition for the ChatSphere application's database. This document provides an overview of the database models and their relationships.

## Schema Overview

The `schema.prisma` file defines the following models:

- **User**: Application users
- **Room**: Chat rooms
- **Message**: Chat messages
- **ApiToken**: API tokens for authentication

## Models

### User

```prisma
model User {
  id       String    @id @default(uuid())
  username String    @unique
  messages Message[]
  rooms    Room[]    @relation("RoomUsers")
  role     Role      @default(MEMBER)
  apiTokens ApiToken[]
}
```

The User model represents application users with the following fields:
- `id`: Unique identifier (UUID)
- `username`: Unique username
- `role`: User role (ADMIN, MODERATOR, or MEMBER)
- Relationships:
  - Has many messages
  - Belongs to many rooms
  - Has many API tokens

### Room

```prisma
model Room {
  id        String    @id @default(uuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
  users     User[]    @relation("RoomUsers")
}
```

The Room model represents chat rooms with the following fields:
- `id`: Unique identifier (UUID)
- `name`: Room name
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- Relationships:
  - Has many messages
  - Has many users

### Message

```prisma
model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  roomId    String
  user      User     @relation(fields: [userId], references: [id])
  room      Room     @relation(fields: [roomId], references: [id])
}
```

The Message model represents chat messages with the following fields:
- `id`: Unique identifier (UUID)
- `content`: Message content
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `userId`: ID of the user who sent the message
- `roomId`: ID of the room the message was sent to
- Relationships:
  - Belongs to one user
  - Belongs to one room

### ApiToken

```prisma
model ApiToken {
  id          String    @id @default(uuid())
  token       String    @unique
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        TokenType @default(USER)
  permissions Json?
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  revoked     Boolean   @default(false)
}
```

The ApiToken model represents API authentication tokens with the following fields:
- `id`: Unique identifier (UUID)
- `token`: The actual token string (unique)
- `userId`: ID of the user who owns the token
- `type`: Token type (USER or CLIENT)
- `permissions`: JSON object containing token permissions
- `createdAt`: Creation timestamp
- `expiresAt`: Expiration timestamp (optional)
- `lastUsedAt`: Last usage timestamp (optional)
- `revoked`: Whether the token has been revoked
- Relationships:
  - Belongs to one user

## Enums

### Role

```prisma
enum Role {
  ADMIN
  MODERATOR
  MEMBER
}
```

The Role enum defines user roles:
- `ADMIN`: Administrator with full access
- `MODERATOR`: Moderator with elevated permissions
- `MEMBER`: Regular user

### TokenType

```prisma
enum TokenType {
  USER
  CLIENT
}
```

The TokenType enum defines token types:
- `USER`: Token for authenticated users
- `CLIENT`: Token for API clients

## Database Setup

To set up the database:

1. Ensure PostgreSQL is installed and running
2. Configure the database connection in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/chatjs"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## Prisma Client

The Prisma Client is generated from this schema and provides type-safe database access in the application. It's used throughout the controllers to interact with the database.

## Schema Updates

When modifying the schema:

1. Update the `schema.prisma` file
2. Generate a migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. Apply the migration to the database

## Database Seeding

To seed the database with initial data, create a seed script in the `prisma/seed.ts` file and run:

```bash
npx prisma db seed
```
