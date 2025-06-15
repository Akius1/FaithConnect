

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
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen bg-gray-100 transition-all duration-300">
        <div className="w-full max-w-full">{children}</div>
      </main>
    </div>
  );
}
