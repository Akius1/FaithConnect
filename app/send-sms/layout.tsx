

import ResponsiveSidebar from "@/src/components/Sidebar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar on the left */}
      <ResponsiveSidebar />
      {/* Main content area */}
      <main className="flex-1 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
