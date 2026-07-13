import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}


export async function findOrCreateUserByGoogleProfile(profile: GoogleProfile) {
  // Try to find the user by googleId
  const existingUser = await db.query.users.findFirst({
    where: eq(users.googleId, profile.sub),
  });

  if (existingUser) {
    // Update mutable profile info if changed
    const needsUpdate =
      existingUser.email !== profile.email ||
      existingUser.name !== (profile.name || null) ||
      existingUser.avatarUrl !== (profile.picture || null) ||
      existingUser.emailVerified !== profile.email_verified;

    if (needsUpdate) {
      const [updatedUser] = await db
        .update(users)
        .set({
          email: profile.email,
          name: profile.name || null,
          avatarUrl: profile.picture || null,
          emailVerified: profile.email_verified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    }
    return existingUser;
  }

  // Not found, create a new user record
  const [newUser] = await db
    .insert(users)
    .values({
      googleId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified,
      name: profile.name || null,
      avatarUrl: profile.picture || null,
    })
    .returning();

  return newUser;
}
