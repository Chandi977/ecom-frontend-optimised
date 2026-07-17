"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  FiMail,
  FiMessageSquare,
  FiTarget,
  FiBarChart2,
  FiLoader,
  FiExternalLink,
} from "react-icons/fi";
import AccountLayout from "../../components/account/AccountLayout";
import { getService, putService } from "../../services/service";

type PrivacyPreferences = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  personalizedRecommendations: boolean;
  usageAnalytics: boolean;
};

const DEFAULT_PREFERENCES: PrivacyPreferences = {
  emailNotifications: true,
  smsNotifications: true,
  personalizedRecommendations: true,
  usageAnalytics: true,
};

const PREFERENCE_ITEMS: Array<{
  key: keyof PrivacyPreferences;
  label: string;
  description: string;
  Icon: React.ComponentType<any>;
}> = [
  {
    key: "emailNotifications",
    label: "Email Notifications",
    description:
      "Order updates, offers and announcements delivered to your inbox.",
    Icon: FiMail,
  },
  {
    key: "smsNotifications",
    label: "SMS Notifications",
    description: "Delivery alerts and important updates via text message.",
    Icon: FiMessageSquare,
  },
  {
    key: "personalizedRecommendations",
    label: "Personalized Recommendations",
    description:
      "Product suggestions tailored to your browsing and purchase history.",
    Icon: FiTarget,
  },
  {
    key: "usageAnalytics",
    label: "Usage Analytics",
    description:
      "Allow anonymous usage data to help us improve your shopping experience.",
    Icon: FiBarChart2,
  },
];

const PrivacySettings = () => {
  const [preferences, setPreferences] =
    useState<PrivacyPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      const res = await getService("user/privacy-preferences");
      if (res?.data?.success && res?.data?.data) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...res.data.data });
      }
      setLoading(false);
    };
    fetchPreferences();
  }, []);

  const handleToggle = async (key: keyof PrivacyPreferences) => {
    if (savingKey) return;
    const nextValue = !preferences[key];
    const previous = preferences;

    // Optimistic update; revert if the API call fails.
    setPreferences({ ...preferences, [key]: nextValue });
    setSavingKey(key);
    try {
      const res = await putService("user/privacy-preferences", {
        [key]: nextValue,
      });
      if (res?.data?.success) {
        if (res?.data?.data) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...res.data.data });
        }
        toast.success("Preference updated");
      } else {
        setPreferences(previous);
      }
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="privacy-loading">
        <FiLoader className="privacy-spinner" />
        <span>Loading your preferences...</span>
      </div>
    );
  }

  return (
    <div className="privacy-sections">
      <section className="privacy-card">
        <header className="card-header">
          <h2 className="card-title">Communication & Privacy</h2>
          <p className="card-desc">
            Control how we contact you and how your data is used. Changes are
            saved automatically.
          </p>
        </header>

        <ul className="preference-list">
          {PREFERENCE_ITEMS.map(({ key, label, description, Icon }) => (
            <li className="preference-row" key={key}>
              <span className="preference-icon-wrap">
                <Icon />
              </span>
              <div className="preference-text">
                <span className="preference-label">{label}</span>
                <span className="preference-desc">{description}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[key]}
                aria-label={label}
                className={`toggle ${preferences[key] ? "on" : ""} ${
                  savingKey === key ? "saving" : ""
                }`}
                onClick={() => handleToggle(key)}
                disabled={Boolean(savingKey)}
              >
                <span className="toggle-thumb" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="privacy-card">
        <header className="card-header">
          <h2 className="card-title">Policies</h2>
        </header>
        <div className="policy-links">
          <Link href="/privacy-policy" className="policy-link">
            Privacy Policy <FiExternalLink />
          </Link>
          <Link href="/terms-of-sale" className="policy-link">
            Terms of Sale <FiExternalLink />
          </Link>
          <Link href="/return-and-exchange-policy" className="policy-link">
            Return & Exchange Policy <FiExternalLink />
          </Link>
          <Link href="/shipping-policy" className="policy-link">
            Shipping Policy <FiExternalLink />
          </Link>
        </div>
      </section>
    </div>
  );
};

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Settings | store.prempackaging</title>
        <meta name="title" content="Privacy Settings" />
        <meta
          name="description"
          content="Manage your notification and privacy preferences."
        />
      </Head>

      <AccountLayout
        title="Privacy Settings"
        subtitle="Control your notifications and data preferences"
        activeNav="privacy"
      >
        {() => <PrivacySettings />}
      </AccountLayout>

      <style jsx global>{`
        .privacy-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .privacy-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .privacy-card .card-header {
          margin-bottom: 18px;
        }
        .privacy-card .card-title {
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0f172a;
          margin: 0;
        }
        .privacy-card .card-desc {
          font-size: 14.5px;
          color: #64748b;
          margin: 6px 0 0;
        }

        .privacy-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 0;
          color: #64748b;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .privacy-spinner {
          font-size: 32px;
          animation: privacy-spin 1.2s linear infinite;
        }
        @keyframes privacy-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .preference-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .preference-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .preference-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }
        .preference-row:first-child {
          padding-top: 0;
        }
        .preference-icon-wrap {
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
        .preference-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .preference-label {
          font-size: 16.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .preference-desc {
          font-size: 14px;
          color: #64748b;
        }

        .toggle {
          position: relative;
          width: 52px;
          height: 28px;
          border-radius: 999px;
          border: 0;
          background: #cbd5e1;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
          transition: background 0.2s ease;
        }
        .toggle.on {
          background: #182c5a;
        }
        .toggle.saving {
          opacity: 0.7;
        }
        .toggle:disabled {
          cursor: not-allowed;
        }
        .toggle .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
          transition: transform 0.2s ease;
        }
        .toggle.on .toggle-thumb {
          transform: translateX(24px);
        }

        .policy-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .policy-link {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 14px 18px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #182c5a;
          text-decoration: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .policy-link:hover {
          border-color: #182c5a;
          background: #f8fafc;
          color: #182c5a;
        }

        @media (max-width: 700px) {
          .policy-links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default PrivacyPage;
