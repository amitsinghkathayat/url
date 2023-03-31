import argon2 from 'argon2';
import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserByUsername(username: string): Promise<User | null> {
  const user = await userRepository.findOne({
    where: { username },
    relations: ['links'],
  });
  // console.log('User found:', user);
  return user;
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  // Check if a user with this username already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    return null;
  }

  // Create a new user object with the given username and password hash
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;

  // Save the new user object to the database
  newUser = await userRepository.save(newUser);

  // Return the new user
  return newUser;
}

async function logInUser(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);

  // console.log('User found:', user);

  if (!user) {
    return null;
  }

  const hashedPassword = await argon2.hash(password);

  // console.log('Hashed password:', hashedPassword);
  // console.log('Stored password hash:', user.passwordHash);

  if (hashedPassword === user.passwordHash) {
    return null;
  }
  return user;
}

async function getUserById(userId: string): Promise<User | null> {
  const user = await userRepository
    .createQueryBuilder('user')
    .where({ userId })
    .leftJoinAndSelect('user.links', 'links')
    .getOne();

  if (user) {
    return user;
  }
  return null;
}

export { getUserByUsername, addNewUser, logInUser, getUserById, User };
