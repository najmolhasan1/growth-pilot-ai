'use client';

import Sidebar from "@/components/layout/Sidebar";
import AuthGate from "@/components/auth/AuthGate";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <AuthGate>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleToggleCollapse} />
        <main className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
          <div className="min-h-screen pb-10">
            {children}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
