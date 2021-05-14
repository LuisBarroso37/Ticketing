import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';

import { User } from '../models/user';
import { validateRequest, BadRequestError } from '@barrozito/common';
import { HashPassword } from './../services/hashPassword';

const router = express.Router();

router.post(
  '/api/users/signin',
  [
    body('email')
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) throw new BadRequestError('Invalid credentials');

    const passwordsMatch = await HashPassword.compare(
      existingUser.password,
      password
    );

    if (!passwordsMatch) throw new BadRequestError('Invalid credentials');

    // Generate JWT token
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY! // The ! tells TypeScript that we know that this variable is not undefined
    );

    // Store JWT token on the cookie session object
    req.session = {
      jwt: userJwt,
    };

    return res.status(200).send(existingUser);
  }
);

export { router as signInRouter };
