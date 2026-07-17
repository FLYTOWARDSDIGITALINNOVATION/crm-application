import { Request } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export const getAuthenticatedUser = async (req: Request): Promise<IUser | null> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    return user as IUser | null;
  } catch {
    return null;
  }
};
