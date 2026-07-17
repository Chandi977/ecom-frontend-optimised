"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiLock,
  FiMail,
  FiPhone,
  FiCalendar,
  FiKey,
} from "react-icons/fi";
import AccountLayout, {
  AccountUser,
  getUserInitials,
} from "../../components/account/AccountLayout";
import { postService } from "../../services/service";
import { setAuthState } from "../../services/token";

const formatMemberSince = (value?: string) => {
  if (!value) return "NA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NA";
  return format(date, "MMMM yyyy");
};

type PersonalInfoFormProps = {
  user: AccountUser;
  refreshUser: () => Promise<void>;
};

const PersonalInfoSection = ({ user, refreshUser }: PersonalInfoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    mobile_number: "",
  });

  useEffect(() => {
    setForm({
      first_name: String(user?.first_name || ""),
      last_name: String(user?.last_name || ""),
      mobile_number: String(user?.mobile_number || ""),
    });
  }, [user]);

  const handleCancel = () => {
    setForm({
      first_name: String(user?.first_name || ""),
      last_name: String(user?.last_name || ""),
      mobile_number: String(user?.mobile_number || ""),
    });
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstName = form.first_name.trim();
    const mobile = form.mobile_number.trim();

    if (!firstName) {
      toast.error("First name is required");
      return;
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      toast.error("Mobile number must be 10 digits");
      return;
    }

    setSaving(true);
    try {
      const res = await postService("edituser", {
        id: user._id,
        first_name: firstName,
        last_name: form.last_name.trim(),
        mobile_number: mobile,
      });
      if (res?.data?.success) {
        toast.success("Profile updated successfully");
        // Keep localStorage + navbar in sync with the new name.
        if (res?.data?.data) {
          setAuthState(null, null, res.data.data);
        }
        await refreshUser();
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-card">
      <header className="card-header">
        <h2 className="card-title">Personal Information</h2>
        {!isEditing && (
          <button
            type="button"
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit2 /> Edit
          </button>
        )}
      </header>

      {isEditing ? (
        <form className="info-form" onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="profile-first-name">
                First Name*
              </label>
              <input
                id="profile-first-name"
                className="form-input"
                value={form.first_name}
                required
                placeholder="First name"
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="profile-last-name">
                Last Name
              </label>
              <input
                id="profile-last-name"
                className="form-input"
                value={form.last_name}
                placeholder="Last name"
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="profile-mobile">
                Mobile Number
              </label>
              <input
                id="profile-mobile"
                className="form-input"
                value={form.mobile_number}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, mobile_number: onlyNums });
                }}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="profile-email">
                Email Address
              </label>
              <input
                id="profile-email"
                className="form-input"
                value={user?.email_address || ""}
                disabled
                title="Email address cannot be changed as it is your login ID"
              />
              <span className="form-hint">
                Email is your login ID and cannot be changed.
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="info-grid">
          <div className="info-item">
            <dt className="info-label">First Name</dt>
            <dd className="info-value">{user?.first_name || "—"}</dd>
          </div>
          <div className="info-item">
            <dt className="info-label">Last Name</dt>
            <dd className="info-value">{user?.last_name || "—"}</dd>
          </div>
          <div className="info-item">
            <dt className="info-label">
              <FiPhone className="info-icon" /> Mobile Number
            </dt>
            <dd className="info-value">{user?.mobile_number || "Not added"}</dd>
          </div>
          <div className="info-item">
            <dt className="info-label">
              <FiMail className="info-icon" /> Email Address
            </dt>
            <dd className="info-value email-value">
              <span>{user?.email_address}</span>
              {user?.isVerified ? (
                <span className="verified-badge">
                  <FiCheckCircle /> Verified
                </span>
              ) : (
                <span className="unverified-badge">
                  <FiAlertCircle /> Not verified
                </span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
};

const ProfilePage = () => {
  return (
    <>
      <Head>
        <title>My Profile | store.prempackaging</title>
        <meta name="title" content="My Profile" />
        <meta
          name="description"
          content="Manage your personal information, saved addresses and account settings."
        />
      </Head>

      <AccountLayout
        title="My Account"
        subtitle="Manage your personal information and account settings"
        activeNav="profile"
      >
        {({ user, refreshUser }) => (
          <div className="profile-sections">
            {/* Summary hero */}
            <section className="profile-card profile-hero">
              <div className="hero-avatar">
                {user?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_image} alt="Profile" />
                ) : (
                  <span>{getUserInitials(user)}</span>
                )}
              </div>
              <div className="hero-meta">
                <h2 className="hero-name">
                  {[user?.first_name, user?.last_name]
                    .filter(Boolean)
                    .join(" ") || "Welcome"}
                </h2>
                <span className="hero-email">{user?.email_address}</span>
                <div className="hero-chips">
                  <span className="hero-chip">
                    <FiCalendar /> Member since {formatMemberSince(user?.createdAt)}
                  </span>
                  <span className="hero-chip">
                    <FiKey />{" "}
                    {user?.authProvider === "google"
                      ? "Signed in with Google"
                      : "Email & password account"}
                  </span>
                </div>
              </div>
            </section>

            {!user?.isVerified && (
              <div className="verify-banner">
                <FiAlertCircle className="verify-banner-icon" />
                <div className="verify-banner-text">
                  <strong>Your email is not verified.</strong> Verify it to
                  secure your account and receive order updates.
                </div>
                <Link href="/re-verify-email" className="verify-banner-btn">
                  Verify Email
                </Link>
              </div>
            )}

            <PersonalInfoSection user={user} refreshUser={refreshUser} />

            {/* Security */}
            <section className="profile-card">
              <header className="card-header">
                <h2 className="card-title">Login & Security</h2>
              </header>
              <div className="security-row">
                <div className="security-info">
                  <span className="security-icon-wrap">
                    <FiLock />
                  </span>
                  <div className="security-text">
                    <span className="security-title">Password</span>
                    <span className="security-desc">
                      {user?.authProvider === "google"
                        ? "You sign in with Google. You can also set a password using the reset flow below."
                        : "Reset your password using a one-time password sent to your email."}
                    </span>
                  </div>
                </div>
                <Link href="/forget-password" className="security-action-btn">
                  Change Password
                </Link>
              </div>
            </section>
          </div>
        )}
      </AccountLayout>

      <style jsx global>{`
        .profile-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .profile-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .profile-card .card-title {
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0f172a;
          margin: 0;
        }
        .profile-card .edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #182c5a;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .profile-card .edit-btn:hover {
          border-color: #182c5a;
          background: #f8fafc;
        }

        /* Hero */
        .profile-hero {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .profile-hero .hero-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #182c5a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
        }
        .profile-hero .hero-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-hero .hero-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .profile-hero .hero-name {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          text-transform: capitalize;
        }
        .profile-hero .hero-email {
          font-size: 15.5px;
          color: #64748b;
        }
        .profile-hero .hero-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .profile-hero .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          border-radius: 999px;
          padding: 6px 14px;
        }

        /* Verify banner */
        .verify-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 14px 18px;
        }
        .verify-banner-icon {
          font-size: 22px;
          color: #d97706;
          flex-shrink: 0;
        }
        .verify-banner-text {
          font-size: 15px;
          color: #78350f;
          flex: 1;
        }
        .verify-banner-btn {
          height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 0 18px;
          background: #d97706;
          color: #ffffff;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .verify-banner-btn:hover {
          background: #b45309;
          color: #ffffff;
        }

        /* Read-only info grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin: 0;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #64748b;
        }
        .info-icon {
          font-size: 14px;
        }
        .info-value {
          font-size: 16.5px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          text-transform: capitalize;
        }
        .email-value {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          text-transform: none;
        }
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 700;
          color: #059669;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 3px 10px;
        }
        .unverified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 700;
          color: #d97706;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 999px;
          padding: 3px 10px;
        }

        /* Edit form */
        .info-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 14.5px;
          font-weight: 600;
          color: #475569;
          margin: 0;
        }
        .form-input {
          width: 100%;
          height: 50px;
          background-color: #ffffff;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 16px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #182c5a;
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.12);
        }
        .form-input:disabled {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }
        .form-hint {
          font-size: 13px;
          color: #94a3b8;
        }
        .form-actions {
          display: flex;
          gap: 12px;
        }
        .save-btn {
          height: 46px;
          padding: 0 26px;
          background: #182c5a;
          color: #ffffff;
          border: 0;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .save-btn:hover {
          background: #e92227;
        }
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cancel-btn {
          height: 46px;
          padding: 0 26px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .cancel-btn:hover {
          border-color: #94a3b8;
        }

        /* Security */
        .security-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .security-info {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .security-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(24, 44, 90, 0.08);
          color: #182c5a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .security-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .security-title {
          font-size: 16.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .security-desc {
          font-size: 14px;
          color: #64748b;
        }
        .security-action-btn {
          height: 42px;
          display: inline-flex;
          align-items: center;
          padding: 0 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #182c5a;
          text-decoration: none;
          white-space: nowrap;
          transition: border-color 0.15s ease;
        }
        .security-action-btn:hover {
          border-color: #182c5a;
          color: #182c5a;
        }

        @media (max-width: 700px) {
          .info-grid,
          .form-grid {
            grid-template-columns: 1fr;
          }
          .profile-hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .security-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .verify-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default ProfilePage;
