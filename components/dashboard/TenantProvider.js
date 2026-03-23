"use client";

import { createContext, useContext, ReactNode } from "react";

const TenantContext = createContext({
  user: null,
  site: null,
});

export const useTenant = () => useContext(TenantContext);

export default function TenantProvider({ children, user, site }) {
  return (
    <TenantContext.Provider value={{ user, site }}>
      {children}
    </TenantContext.Provider>
  );
}
