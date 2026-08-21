import { Request } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export const getAuthenticatedUser = async (req: Request): Promise<IUser | null> => {
  const authHeader = req.headers.authorization;

  console.log("getAuthenticatedUser: authHeader", authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("getAuthenticatedUser: missing or invalid authHeader");
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
       console.log("getAuthenticatedUser: user not found for id", decoded.id);
    }
    return user as IUser | null;
  } catch (err) {
    console.log("getAuthenticatedUser error:", err);
    return null;
  }
};
