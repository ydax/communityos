"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "./TenantProvider";

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "Listings", href: "/dashboard/listings" },
  { name: "Orders", href: "/dashboard/orders" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar({ className = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { site, user } = useTenant();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold text-trade-primary">Dashboard</span>
        </div>
        <div className="px-4 mt-6">
          <div className="p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-semibold truncate">
              {site?.name || "No Site Setup"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 mt-8 space-y-1 bg-white">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex-shrink-0 w-full group block text-sm font-medium text-gray-500 hover:text-gray-700 text-left px-2 py-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
