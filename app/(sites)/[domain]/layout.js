/**
 * Multi-Tenant Site Layout
 * Wraps all custom domain routes
 */
export default function SiteLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
