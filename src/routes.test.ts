import request from "supertest";
import express from "express";
import { setupRoutes } from "./routes";

// Create a mock Prisma client
const mockPrisma = {
  room: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the PrismaClient module
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Create a test app with our mocked prisma client
const app = express();
app.use(express.json());
setupRoutes(app, mockPrisma as any);

describe("API Routes", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterAll(async () => {
    await mockPrisma.$disconnect();
  });

  describe("GET /api/rooms", () => {
    it("should return all rooms", async () => {
      const mockRooms = [
        { id: "1", name: "Room 1" },
        { id: "2", name: "Room 2" },
      ];

      mockPrisma.room.findMany.mockResolvedValue(mockRooms);

      const response = await request(app).get("/api/rooms");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRooms);
      expect(mockPrisma.room.findMany).toHaveBeenCalled();
    });

    it("should handle errors", async () => {
      mockPrisma.room.findMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/rooms");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/rooms", () => {
    it("should create a new room", async () => {
      const mockRoom = { id: "1", name: "New Room" };
      const requestBody = { name: "New Room", userId: "user1" };

      mockPrisma.room.create.mockResolvedValue(mockRoom);

      const response = await request(app)
        .post("/api/rooms")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockRoom);
      expect(mockPrisma.room.create).toHaveBeenCalledWith({
        data: {
          name: requestBody.name,
          users: {
            connect: { id: requestBody.userId },
          },
        },
      });
    });

    it("should validate request body", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({ name: "New Room" }); // Missing userId

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/users", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: "1", username: "User 1" },
        { id: "2", username: "User 2" },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const mockUser = { id: "1", username: "New User" };
      const requestBody = { username: "New User" };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/users")
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { username: requestBody.username },
      });
    });

    it("should validate request body", async () => {
      const response = await request(app).post("/api/users").send({}); // Missing username

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});
