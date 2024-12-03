import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    const user = await User.findOne({ 
      _id: (decoded as any)._id, 
      'tokens.token': token 
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

export const generateAuthToken = async (user: any) => {
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
  
  user.tokens = user.tokens || [];
  user.tokens.push({ token });
  await user.save();
  
  return token;
};

export const revokeAuthToken = async (user: any, token: string) => {
  user.tokens = user.tokens.filter((t: any) => t.token !== token);
  await user.save();
};
