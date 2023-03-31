import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from './UserModel';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository
    .createQueryBuilder('link')
    .leftJoinAndSelect('link.user', 'user')
    .where({ linkId })
    .getOne();

  if (link) {
    return link;
  }
  return null;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(`${originalUrl}${userId}`);
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(0, 9);
  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  const newLink = new Link();
  newLink.linkId = linkId;
  newLink.originalUrl = originalUrl;
  // newLink.numHits = 0;
  newLink.user = creator;
  newLink.lastAccessedOn = new Date();

  await linkRepository.save(newLink);

  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  // Increment the link's number of hits property
  const linkUpdate = link;
  linkUpdate.numHits += 1;

  // Create a new date object and assign it to the link's `lastAccessedOn` property
  const now = new Date();
  linkUpdate.lastAccessedOn = now;

  // Update the link's numHits and lastAccessedOn in the database
  await linkRepository
    .createQueryBuilder()
    .update(Link)
    .set({ numHits: link.numHits, lastAccessedOn: now })
    .where({ linkId: link.linkId })
    .execute();

  // return the updated link
  return link;
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoin('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'user.userId', 'user.username', 'user.isAdmin'])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoin('link.user', 'user')
    .select([
      'link.linkId',
      'link.originalUrl',
      'link.numHits',
      'link.lastAccessedOn',
      'user.userId',
      'user.username',
      'user.isPro',
      'user.isAdmin',
    ])
    .getMany();

  return links;
}

async function deleteLinkById(linkId: string): Promise<void> {
  await linkRepository
    .createQueryBuilder('link')
    .delete()
    .from(Link)
    .where('linkId = :linkId', { linkId })
    .execute();
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkById,
};
