"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMapPin,
  FiShield,
  FiPackage,
  FiHeart,
  FiLogOut,
  FiChevronRight,
  FiLoader,
} from "react-icons/fi";
import { getService } from "../../services/service";
import { logout } from "../../services/auth";
import { clearWishlistCache } from "../../utils/favourites";

export type AccountUser = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email_address?: string;
  mobile_number?: string;
  profile_image?: string;
  contact_address?: any[];
  isVerified?: boolean;
  authProvider?: string;
  createdAt?: string;
};

type AccountLayoutProps = {
  title: string;
  subtitle?: string;
  activeNav: "profile" | "addresses" | "privacy" | "orders" | "wishlist";
  children: (props: {
    user: AccountUser;
    refreshUser: () => Promise<void>;
  }) => React.ReactNode;
};

const NAV_ITEMS = [
  { key: "profile", label: "My Profile", href: "/profile", Icon: FiUser },
  { key: "addresses", label: "Addresses", href: "/profile/addresses", Icon: FiMapPin },
  { key: "privacy", label: "Privacy Settings", href: "/profile/privacy", Icon: FiShield },
  { key: "orders", label: "My Orders", href: "/my-orders", Icon: FiPackage },
  { key: "wishlist", label: "Wishlist", href: "/wishlist", Icon: FiHeart },
];

const readStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("PIUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getUserInitials = (user: AccountUser | null) => {
  const first = String(user?.first_name || "").trim();
  const last = String(user?.last_name || "").trim();
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return initials || (user?.email_address || "U").charAt(0).toUpperCase();
};

export const getUserFullName = (user: AccountUser | null) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
  user?.email_address ||
  "My Account";

const AccountLayout = ({ title, subtitle, activeNav, children }: AccountLayoutProps) => {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const refreshUser = useCallback(async () => {
    const storedUser = readStoredUser();
    if (!storedUser?._id) return;
    const res = await getService(`getuser/${storedUser._id}`);
    if (res?.data?.success && res?.data?.data) {
      setUser(res.data.data);
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("PIToken") : null;
    const storedUser = readStoredUser();

    if (!token || !storedUser?._id) {
      router.replace("/login");
      return;
    }

    // Show cached user immediately, then refresh from the API.
    setUser(storedUser);
    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const currentUserId = user?._id || readStoredUser()?._id || null;
    try {
      await logout();
    } finally {
      clearWishlistCache(currentUserId);
      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  return (
    <div className="account-root">
      <div className="account-wrap">
        {/* Breadcrumb */}
        <nav className="account-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="crumb-link">
            Home
          </Link>
          <FiChevronRight className="crumb-separator" />
          <Link href="/profile" className="crumb-link">
            My Account
          </Link>
          {activeNav !== "profile" && (
            <>
              <FiChevronRight className="crumb-separator" />
              <span className="crumb-current">{title}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <header className="account-header">
          <h1 className="account-title">{title}</h1>
          {subtitle && <p className="account-subtitle">{subtitle}</p>}
        </header>

        <div className="account-body">
          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="sidebar-user-card">
              <div className="sidebar-avatar">
                {user?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_image} alt="Profile" />
                ) : (
                  <span>{getUserInitials(user)}</span>
                )}
              </div>
              <div className="sidebar-user-meta">
                <span className="sidebar-user-hello">Hello,</span>
                <span className="sidebar-user-name">{getUserFullName(user)}</span>
              </div>
            </div>

            <nav className="sidebar-nav" aria-label="Account navigation">
              {NAV_ITEMS.map(({ key, label, href, Icon }) => (
                <Link
                  key={key}
                  href={href}
                  className={`sidebar-nav-item ${activeNav === key ? "active" : ""}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span>{label}</span>
                </Link>
              ))}
              <button
                type="button"
                className="sidebar-nav-item logout-item"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <FiLogOut className="sidebar-nav-icon" />
                <span>{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="account-content">
            {loading || !user ? (
              <div className="account-loading">
                <FiLoader className="loading-spinner" />
                <span>Loading your account...</span>
              </div>
            ) : (
              children({ user, refreshUser })
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        .account-root {
          --font-family: "Inter", "Montserrat", -apple-system, BlinkMacSystemFont,
            "Segoe UI", Roboto, sans-serif;
          --color-ink: #0f172a;
          --color-navy: #182c5a;
          --color-red: #e92227;
          --color-slate-muted: #64748b;
          --color-line: #e2e8f0;
          --color-bg-canvas: #f8fafc;
          --color-bg-card: #ffffff;

          font-family: var(--font-family);
          color: var(--color-ink);
          background-color: var(--color-bg-canvas);
          min-height: 100vh;
          padding: 40px 0 80px;
          -webkit-font-smoothing: antialiased;
        }
        .account-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .account-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14.5px;
          margin-bottom: 24px;
        }
        .account-breadcrumb :global(.crumb-link) {
          color: var(--color-slate-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .account-breadcrumb :global(.crumb-link:hover) {
          color: var(--color-ink);
        }
        .account-breadcrumb :global(.crumb-separator) {
          color: var(--color-slate-muted);
          font-size: 11px;
        }
        .crumb-current {
          color: var(--color-ink);
          font-weight: 600;
        }

        .account-header {
          margin-bottom: 28px;
        }
        .account-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-ink);
          margin: 0;
        }
        .account-subtitle {
          font-size: 16px;
          color: var(--color-slate-muted);
          margin: 6px 0 0;
        }

        .account-body {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Sidebar */
        .account-sidebar {
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border-bottom: 1px solid var(--color-line);
          background: #f8fafc;
        }
        .sidebar-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--color-navy);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sidebar-user-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .sidebar-user-hello {
          font-size: 13.5px;
          color: var(--color-slate-muted);
        }
        .sidebar-user-name {
          font-size: 16.5px;
          font-weight: 700;
          color: var(--color-ink);
          text-transform: capitalize;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }
        .sidebar-nav :global(.sidebar-nav-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 8px;
          font-size: 15.5px;
          font-weight: 600;
          color: var(--color-slate-muted);
          text-decoration: none;
          background: transparent;
          border: 0;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sidebar-nav :global(.sidebar-nav-item:hover) {
          background: #f1f5f9;
          color: var(--color-ink);
        }
        .sidebar-nav :global(.sidebar-nav-item.active) {
          background: rgba(24, 44, 90, 0.08);
          color: var(--color-navy);
        }
        .sidebar-nav :global(.sidebar-nav-icon) {
          font-size: 19px;
          flex-shrink: 0;
        }
        .sidebar-nav :global(.logout-item) {
          color: var(--color-red);
          margin-top: 6px;
          border-top: 1px solid var(--color-line);
          border-radius: 0 0 8px 8px;
        }
        .sidebar-nav :global(.logout-item:hover) {
          background: #fef2f2;
          color: var(--color-red);
        }
        .sidebar-nav :global(.logout-item:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Content area */
        .account-content {
          min-width: 0;
        }
        .account-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 0;
          color: var(--color-slate-muted);
          background: var(--color-bg-card);
          border: 1px solid var(--color-line);
          border-radius: 12px;
        }
        .account-loading :global(.loading-spinner) {
          font-size: 32px;
          animation: account-spin 1.2s linear infinite;
        }
        @keyframes account-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .account-body {
            grid-template-columns: 1fr;
          }
          .account-wrap {
            padding: 0 16px;
          }
          .account-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountLayout;
