import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up the database...");

  try {
    // Create a default room
    const defaultRoom = await prisma.room.upsert({
      where: { id: "default-room" },
      update: {},
      create: {
        id: "default-room",
        name: "General Chat",
      },
    });

    console.log("Default room created:", defaultRoom);

    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { username: "testuser" },
      update: {},
      create: {
        username: "testuser",
        rooms: {
          connect: { id: defaultRoom.id },
        },
      },
    });

    console.log("Test user created:", testUser);

    // Create a welcome message
    const welcomeMessage = await prisma.message.create({
      data: {
        content: "Welcome to ChatJS! This is a test message.",
        userId: testUser.id,
        roomId: defaultRoom.id,
      },
    });

    console.log("Welcome message created:", welcomeMessage);

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error setting up the database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
