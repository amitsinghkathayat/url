import { Request, Response } from 'express';

import {
  createLinkId,
  createNewLink,
  getLinkById,
  updateLinkVisits,
  getLinksByUserIdForOwnAccount,
  getLinksByUserId,
  deleteLinkById,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';

import { parseDatabaseError } from '../utils/db-utils';

// const linkRepository = AppDataSource.getRepository(Link);

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  if (!req.session.isLoggedIn) {
    res.sendStatus(401); // 401 unauthorized
    return;
  }

  // Get the userId from `req.session`
  const { authenticatedUser } = req.session;

  // Retrieve the user's account data using their ID
  const user = await getUserById(authenticatedUser.userId);

  // Check if you got back `null`
  if (!user) {
    res.sendStatus(404); // not found
    return;
  }
  // not showing password Hash in postman
  user.passwordHash = undefined;

  // Check if the user is neither a "pro" nor an "admin" account
  if (!(user.isPro && user.isAdmin)) {
    // check how many links they've already generated
    // if they have generated 5 links
    if (user.links.length >= 5) {
      res.sendStatus(403); // 403 forbidden
      return;
    }
  }

  // Generate a `linkId`
  const linkId = createLinkId(req.body.originalUrl, user.userId);

  // Add the new link to the database (wrap this in try/catch)
  try {
    const newLink = await createNewLink(req.body.originalUrl, linkId, user);
    // console.log(newLink);
    res.status(201).json(newLink); // Respond with the newLink object as the response
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  const { targetLinkId } = req.params as LinkIdParam;

  // Retrieve the link data using the targetLinkId from the path parameter
  const link = await getLinkById(targetLinkId);

  // Check if you got back `null`
  if (!link) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  // Call the appropriate function to increment the number of hits and the last accessed date
  await updateLinkVisits(link);

  // Redirect the client to the original URL
  res.redirect(302, link.originalUrl);
}

async function getLinks(req: Request, res: Response): Promise<void> {
  // Extract the targetUserId from the request params
  const { targetUserId } = req.params;
  // Declare a variable to store the retrieved links
  let links;

  try {
    // Check if the authenticated user's userId matches the targetUserId
    if (req.session.authenticatedUser.userId === targetUserId) {
      // Retrieve links for the authenticated user's own account
      links = await getLinksByUserIdForOwnAccount(targetUserId);
    } else {
      // Retrieve links for the specified user
      links = await getLinksByUserId(targetUserId);
    }
    // Check if any links were retrieved
    if (links.length === 0) {
      // Send a 404 status code with an error message if no links were found
      res.status(404).send(`A user with Id ${targetUserId} has not created any links`);
      return;
    }
    // Send a 200 status code with the retrieved links
    res.status(200).json(links);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function deleteLink(req: Request, res: Response): Promise<void> {
  const { targetUserId, targetLinkId } = req.params;

  try {
    // Check if user is logged in and authorized to delete the link
    if (!req.session.authenticatedUser) {
      res.sendStatus(401);
      return;
    }

    const authenticatedUserId = req.session.authenticatedUser.userId;
    // If user is not an admin and does not own the link, send 403 response
    if (authenticatedUserId !== targetUserId && !req.session.authenticatedUser.isAdmin) {
      res.sendStatus(403).send(`
      The client is logged in but the ${targetUserId} is not for their account and they are not an admin.`);
      return;
    }

    const link = await getLinkById(targetLinkId);
    // Check if link exists
    if (!link) {
      res.sendStatus(404);
      return;
    }

    // Delete the specified link
    await deleteLinkById(targetLinkId);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.sendStatus(500).json(databaseErrorMessage);
  }
}

export { shortenUrl, getOriginalUrl, getLinks, deleteLink };
