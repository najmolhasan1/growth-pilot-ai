'use client';

import Sidebar from "@/components/layout/Sidebar";
import AuthGate from "@/components/auth/AuthGate";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
  };

  // If visiting GrowthPilot 2.0 standalone platform, bypass dashboard sidebar & layout completely
  if (pathname?.startsWith('/dashboard/growthpilot-2')) {
    return <>{children}</>;
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleToggleCollapse} />
        <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
          <div className="min-h-screen pb-10">
            {children}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
