import { getAuth } from "firebase/auth";
import { redirect } from "next/navigation";

/**
 * Check if user is authenticated
 * Use this in admin pages to protect routes
 *
 * @returns {Object|null} - Current user or null
 */
export function useAuth() {
  const auth = getAuth();
  return auth.currentUser;
}

/**
 * Higher-order component to protect admin routes
 * Wraps a page component and redirects to login if not authenticated
 *
 * Usage:
 * export default withAuth(AdminPage);
 */
export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      redirect("/login");
      return null;
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Check if user owns a specific site
 *
 * @param {string} userId - User ID from auth
 * @param {string} siteOwnerId - Owner ID from site data
 * @returns {boolean} - Whether user owns the site
 */
export function checkSiteOwnership(userId, siteOwnerId) {
  return userId === siteOwnerId;
}

/**
 * Middleware helper for API routes
 * Verifies authentication token from request headers
 *
 * Usage in API routes:
 * const user = await verifyAuthToken(request);
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function verifyAuthToken(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];

    // In production, verify token with Firebase Admin SDK
    // For now, we'll implement basic validation
    // TODO: Implement proper token verification with Firebase Admin

    return { uid: "demo-user" }; // Placeholder
  } catch (error) {
    console.error("[verifyAuthToken] Error:", error);
    return null;
  }
}
