"use client";

/**
 * CartShell — Client-side wrapper that provides CartProvider + CartDrawer
 *
 * WHY: Next.js App Router root layout is a Server Component by convention.
 * We cannot use `"use client"` on layout.js. Instead, we wrap children in
 * this client component that provides the cart context and the always-present
 * CartDrawer UI.
 *
 * tenantId is determined client-side from the current hostname.
 */

import { CartProvider } from "@/components/checkout/CartProvider";
import CartDrawer from "@/components/checkout/CartDrawer";
import { useState, useEffect } from "react";

export default function CartShell({ children }) {
  const [tenantId, setTenantId] = useState("marketplace");

  useEffect(() => {
    // Determine tenant context from hostname
    const hostname = window.location.hostname;

    if (
      hostname === "centraltexas.com" ||
      hostname === "www.centraltexas.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app")
    ) {
      setTenantId("marketplace");
    } else if (hostname.endsWith(".centraltexas.com")) {
      // Subdomain — extract slug
      const parts = hostname.split(".");
      setTenantId(parts.slice(0, -2).join("."));
    } else {
      // Custom domain
      setTenantId(hostname);
    }
  }, []);

  return (
    <CartProvider tenantId={tenantId}>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
