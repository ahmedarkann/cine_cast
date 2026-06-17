import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/lib/AuthContext";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminApplications from "@/components/admin/AdminApplications";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAudit from "@/components/admin/AdminAudit";
import { Users, Film, ShieldAlert, FileText } from "lucide-react";

export default function Admin() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";
  const { user, isLoadingAuth, authChecked } = useAuth();

  useEffect(() => {
    if (authChecked && user && user.role !== "admin") navigate("/dashboard");
    if (authChecked && !user) navigate("/login");
  }, [user, authChecked, navigate]);

  const tabs = [
    { id: "projects", label: t("admin", "tab_projects"), icon: Film },
    { id: "applications", label: t("admin", "tab_applications"), icon: FileText },
    { id: "users", label: t("admin", "tab_users"), icon: Users },
    { id: "audit", label: t("admin", "tab_audit"), icon: ShieldAlert },
  ];

  if (isLoadingAuth) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white">
      <div className="overflow-y-auto">
        <div className="pt-6 pb-10 px-4 sm:px-6 max-w-7xl">
          <header className="mb-6">
            <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-1">{t("admin", "subtitle")}</p>
            <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">
              {tabs.find(tb => tb.id === activeTab)?.label}
            </h1>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "projects" && <AdminProjects />}
            {activeTab === "applications" && <AdminApplications />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "audit" && <AdminAudit />}
          </div>
        </div>
      </div>
    </div>
  );
}