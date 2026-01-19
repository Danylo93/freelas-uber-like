import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, UserRole, User } from '@freelas/database';
import { CONFIG } from '@freelas/shared-config';
import { logger } from '@freelas/shared-logger';
import { LoginSchema, RegisterSchema } from '@freelas/shared-contracts';
import { BadRequestError, UnauthorizedError } from '@freelas/shared-errors';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestError('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        phone: data.phone
      }
    });

    if (user.role === UserRole.PROVIDER) {
      await prisma.providerProfile.create({
        data: {
          userId: user.id
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, CONFIG.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, CONFIG.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  // TODO: Implement refresh token logic if needed. For now just token.
  res.status(501).send('Not Implemented');
});

// Validate token endpoint for Gateway/Other services
router.get('/me', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new UnauthorizedError('No token provided'));

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new UnauthorizedError('User not found');

    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    next(new UnauthorizedError('Invalid token'));
  }
});

export default router;
