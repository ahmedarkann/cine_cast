import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, CheckCheck, X } from "lucide-react";
import { get, put, post } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const POLL_INTERVAL = 60_000; // 1 min

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await get(`/api/notifications?user_id=${user.id}`);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, [user?.id]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Refetch when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 12);

  const markRead = async (n) => {
    if (n.read) return;
    await put(`/api/notifications/${n.id}`, { read: true });
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
  };

  const markAllRead = async () => {
    if (unread === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await post("/api/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
          open
            ? "bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white"
            : "text-zinc-500 dark:text-white/50 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white px-1"
            style={{ background: "linear-gradient(135deg,#ef4136,#fbb040)" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex flex-col"
          style={{ maxHeight: "min(480px, 80vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5 shrink-0">
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              Notifications {unread > 0 && <span className="text-xs text-red-500 font-black">({unread})</span>}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 dark:text-white/25">
                <BellOff className="w-8 h-8" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-zinc-50 dark:border-white/[0.03] last:border-0",
                    n.read
                      ? "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                      : "bg-red-50/60 dark:bg-red-500/[0.04] hover:bg-red-50 dark:hover:bg-red-500/[0.07]"
                  )}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {n.read
                      ? <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-white/10" />
                      : <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug line-clamp-2",
                      n.read ? "text-zinc-500 dark:text-white/40" : "text-zinc-900 dark:text-white font-medium"
                    )}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-white/25 mt-1">
                      {relativeTime(n.created_at || n.created_date)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-white/5 px-4 py-2.5 shrink-0">
              <Link
                to="/dashboard?tab=notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                See all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
