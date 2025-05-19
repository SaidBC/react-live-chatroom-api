import tryCatch from "../tryCatch";
import { Request, Response, NextFunction } from "express";

describe("tryCatch", () => {
  // Setup test variables
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockRequest = { params: {}, body: {} } as Request;
    mockResponse = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() } as unknown as Response;
    mockNext = jest.fn();
  });

  it("should catch errors in async functions and pass them to next", async () => {
    // Arrange
    const testError = new Error("Test error");
    
    // Create a middleware that will throw an error
    const middleware = tryCatch(async (_req: Request, _res: Response, _next: NextFunction) => {
      throw testError;
    });

    // Act - call the middleware
    await middleware(mockRequest, mockResponse, mockNext);

    // Assert - next should be called with the error
    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it("should allow middleware to call next with arguments", async () => {
    // Arrange
    const testArg = "test argument";
    
    // Create a middleware that calls next with an argument
    const middleware = tryCatch(async (_req: Request, _res: Response, next: NextFunction) => {
      next(testArg);
      return mockResponse;
    });

    // Act - call the middleware
    await middleware(mockRequest, mockResponse, mockNext);

    // Assert - next should be called with the argument
    expect(mockNext).toHaveBeenCalledWith(testArg);
  });

  it("should work with synchronous functions that return promises", async () => {
    // Arrange
    const testArg = "test argument";
    
    // Create a non-async middleware that returns a promise
    const middleware = tryCatch((_req: Request, _res: Response, next: NextFunction) => {
      next(testArg);
      return Promise.resolve(mockResponse);
    });

    // Act - call the middleware
    await middleware(mockRequest, mockResponse, mockNext);

    // Assert - next should be called with the argument
    expect(mockNext).toHaveBeenCalledWith(testArg);
  });

  it("should catch rejected promises and pass errors to next", async () => {
    // Arrange
    const testError = new Error("Promise rejection");
    
    // Create a middleware that returns a rejected promise
    const middleware = tryCatch(async (_req: Request, _res: Response, _next: NextFunction) => {
      return Promise.reject(testError);
    });

    // Act - call the middleware
    await middleware(mockRequest, mockResponse, mockNext);

    // Assert - next should be called with the error
    expect(mockNext).toHaveBeenCalledWith(testError);
  });
});
