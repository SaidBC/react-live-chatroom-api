// Mock server.listen to prevent the server from actually starting during tests
jest.mock('http', () => {
  const originalModule = jest.requireActual('http');
  return {
    ...originalModule,
    Server: function() {
      return {
        listen: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        close: jest.fn().mockReturnThis(),
      };
    },
  };
});
