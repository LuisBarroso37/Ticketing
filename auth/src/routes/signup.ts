import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';

import { User } from '../models/user';
import { validateRequest, BadRequestError } from '@barrozito/common';

const router = express.Router();

router.post(
  '/api/users/signup',
  [
    body('email')
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Password must be between 4 and 20 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    const user = User.build({ email, password });
    await user.save();

    // Generate JWT token
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY! // The ! tells TypeScript that we know that this variable is not undefined
    );

    // Store JWT token on the cookie session object
    req.session = {
      jwt: userJwt,
    };

    return res.status(201).send(user);
  }
);

export { router as signUpRouter };
