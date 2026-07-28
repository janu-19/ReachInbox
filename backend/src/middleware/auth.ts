import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Automatically find or create a default developer user to satisfy campaign relations in MySQL
    const defaultUser = await prisma.user.upsert({
      where: { email: 'developer@example.com' },
      update: {},
      create: {
        email: 'developer@example.com',
        name: 'Developer Account',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      },
    });

    req.user = { id: defaultUser.id, email: defaultUser.email };
    return next();
  } catch (error) {
    return next(error);
  }
};
