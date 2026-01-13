import { currentUser } from "@clerk/nextjs/server";

const parseListEnv = (value?: string | null) =>
  value
    ?.split(",")
    .map(entry => entry.trim())
    .filter(Boolean) || [];

const getAdminEmails = () => parseListEnv(process.env.ADMIN_EMAILS);
const getAdminUserIds = () => parseListEnv(process.env.ADMIN_USER_IDS);

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminUserIds = getAdminUserIds();
    const adminEmails = getAdminEmails();

    console.log('[isAdmin] Checking access for:', { userId });
    console.log('[isAdmin] Configured Admins:', { adminUserIds, adminEmails });

    if (adminUserIds.includes(userId)) {
      console.log('[isAdmin] Match found in ADMIN_USER_IDS');
      return true;
    }

    const user = await currentUser();
    if (!user) {
      console.log('[isAdmin] Clerk currentUser() returned null');
      return false;
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    console.log('[isAdmin] Clerk User Email:', userEmail);

    const isMatch = !!userEmail && adminEmails.includes(userEmail);
    console.log('[isAdmin] Match found in ADMIN_EMAILS?', isMatch);

    return isMatch;
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}
