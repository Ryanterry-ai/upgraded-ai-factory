import { Sidebar } from "../../components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Sidebar />
      <main className="ml-56 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
