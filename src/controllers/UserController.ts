import { Request, Response } from 'express';
import argon2 from 'argon2';
import { addNewUser, getUserByUsername, logInUser } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function registerUser(req: Request, res: Response): Promise<void> {
  // Get the username and password from the request body
  const { username, password } = req.body;

  try {
    // Check if a user with the given username already exists
    const userExist = await getUserByUsername(username);
    if (userExist) {
      // If a user with the given username already exists,
      res.sendStatus(409);
      return;
    }
    // Hash the password using Argon2
    const passwordHash = await argon2.hash(password);

    // Add the new user to the database using the hashed password
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser); // Log the newly created user to the console

    // Create the response object in the desired format
    const response = {
      userId: newUser.userId,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      isPro: newUser.isPro,
    };

    // Send the response object back as JSON
    res.status(201).json(response); // 201 Created status code
  } catch (err) {
    // If there is an error
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as NewUserRequest;

  // console.log('Received password:', password);

  const user = await logInUser(username, password);

  if (!user) {
    res.sendStatus(403); // Either the username or the password was invalid.
    return;
  }

  await req.session.clearSession();
  req.session.authenticatedUser = {
    userId: user.userId,
    username: user.username,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
  };
  req.session.isLoggedIn = true;

  // console.log('Authenticated user:', req.session.authenticatedUser);
  // console.log('Is logged in:', req.session.isLoggedIn);

  res.sendStatus(200);
}

export { registerUser, logIn };
