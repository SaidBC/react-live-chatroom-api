import { Request } from "express";

const getToken = function (req: Request) {
  const authHeader = req.headers.authorization;
  const body = req.body;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1] as string;
  }
  if (body.token) {
    token = body.token as string;
  }
  return token;
};

export default getToken;
