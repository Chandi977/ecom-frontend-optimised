"use client";
import React, { useState } from "react";
import Head from "next/head";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import AccountLayout, {
  AccountUser,
} from "../../components/account/AccountLayout";
import AddressModal from "../../modals/AddressModal";
import { postService } from "../../services/service";

type AddressBookProps = {
  user: AccountUser;
  refreshUser: () => Promise<void>;
};

const AddressBook = ({ user, refreshUser }: AddressBookProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const addresses: any[] = Array.isArray(user?.contact_address)
    ? user.contact_address
    : [];

  const handleModalVisible = () => {
    setModalVisible(false);
    setEditingAddress(null);
    refreshUser();
  };

  const saveAddresses = async (nextAddresses: any[], successMessage: string) => {
    setBusy(true);
    try {
      const res = await postService("edituser", {
        id: user._id,
        contact_address: nextAddresses,
      });
      if (res?.data?.success) {
        toast.success(successMessage);
        await refreshUser();
        return true;
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (deletingIndex === null) return;
    const next = addresses.filter((_, index) => index !== deletingIndex);
    const ok = await saveAddresses(next, "Address deleted successfully");
    if (ok) setDeletingIndex(null);
  };

  const handleSetDefault = async (targetIndex: number) => {
    if (busy) return;
    const next = addresses.map((entry, index) => ({
      ...entry,
      isDefault: index === targetIndex,
    }));
    await saveAddresses(next, "Default address updated");
  };

  return (
    <>
      <section className="addresses-card">
        <header className="card-header">
          <h2 className="card-title">
            Saved Addresses{" "}
            <span className="address-count">({addresses.length})</span>
          </h2>
          <button
            type="button"
            className="add-address-btn"
            onClick={() => {
              setEditingAddress(null);
              setModalVisible(true);
            }}
          >
            <FiPlus /> Add New Address
          </button>
        </header>

        {addresses.length === 0 ? (
          <div className="addresses-empty">
            <FiMapPin className="empty-icon" />
            <h3>No saved addresses</h3>
            <p>
              Add a delivery address to speed up checkout on your next order.
            </p>
            <button
              type="button"
              className="add-address-btn"
              onClick={() => {
                setEditingAddress(null);
                setModalVisible(true);
              }}
            >
              <FiPlus /> Add Address
            </button>
          </div>
        ) : (
          <div className="address-grid">
            {addresses.map((entry, index) => (
              <article
                className={`address-card ${entry?.isDefault ? "is-default" : ""}`}
                key={`${entry?.address || "addr"}-${index}`}
              >
                {entry?.isDefault && (
                  <span className="default-badge">
                    <FiStar /> Default
                  </span>
                )}
                <h3 className="address-name">{entry?.name || "Address"}</h3>
                <p className="address-lines">
                  {entry?.address}
                  {entry?.landmark ? `, ${entry.landmark}` : ""}
                  <br />
                  {[entry?.town, entry?.state].filter(Boolean).join(", ")}
                  {entry?.pincode ? ` - ${entry.pincode}` : ""}
                </p>
                <div className="address-meta">
                  {(entry?.mobile || entry?.phone) && (
                    <span className="address-meta-item">
                      <FiPhone /> {entry?.mobile || entry?.phone}
                    </span>
                  )}
                  {entry?.email && (
                    <span className="address-meta-item">
                      <FiMail /> {entry.email}
                    </span>
                  )}
                  {entry?.gstin && (
                    <span className="address-meta-item">
                      GSTIN: {entry.gstin}
                    </span>
                  )}
                </div>
                <div className="address-actions">
                  <button
                    type="button"
                    className="address-action-btn"
                    onClick={() => {
                      setEditingAddress(entry);
                      setModalVisible(true);
                    }}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    className="address-action-btn danger"
                    onClick={() => setDeletingIndex(index)}
                    disabled={busy}
                  >
                    <FiTrash2 /> Delete
                  </button>
                  {!entry?.isDefault && (
                    <button
                      type="button"
                      className="address-action-btn"
                      onClick={() => handleSetDefault(index)}
                      disabled={busy}
                    >
                      <FiStar /> Set as Default
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AddressModal
        visible={modalVisible}
        handleVisible={handleModalVisible}
        prev={addresses}
        address={editingAddress}
      />

      {/* Delete confirmation */}
      <Modal
        show={deletingIndex !== null}
        onHide={() => setDeletingIndex(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "17px", fontWeight: 700 }}>
            Delete Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this address
          {deletingIndex !== null && addresses[deletingIndex]?.name
            ? ` for "${addresses[deletingIndex].name}"`
            : ""}
          ? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletingIndex(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const AddressesPage = () => {
  return (
    <>
      <Head>
        <title>My Addresses | store.prempackaging</title>
        <meta name="title" content="My Addresses" />
        <meta
          name="description"
          content="Manage your saved delivery addresses for faster checkout."
        />
      </Head>

      <AccountLayout
        title="My Addresses"
        subtitle="Manage delivery addresses for faster checkout"
        activeNav="addresses"
      >
        {({ user, refreshUser }) => (
          <AddressBook user={user} refreshUser={refreshUser} />
        )}
      </AccountLayout>

      <style jsx global>{`
        .addresses-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .addresses-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .addresses-card .card-title {
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0f172a;
          margin: 0;
        }
        .addresses-card .address-count {
          color: #64748b;
          font-weight: 600;
        }
        .add-address-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 20px;
          background: #182c5a;
          color: #ffffff;
          border: 0;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .add-address-btn:hover {
          background: #e92227;
        }

        .addresses-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 50px 20px;
          gap: 8px;
        }
        .addresses-empty .empty-icon {
          font-size: 38px;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .addresses-empty h3 {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .addresses-empty p {
          font-size: 15px;
          color: #64748b;
          margin: 0 0 14px;
        }

        .address-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .address-card {
          position: relative;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .address-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
        }
        .address-card.is-default {
          border-color: #182c5a;
          background: #f8fafc;
        }
        .default-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 700;
          color: #182c5a;
          background: rgba(24, 44, 90, 0.1);
          border-radius: 999px;
          padding: 4px 10px;
        }
        .address-name {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          text-transform: capitalize;
          padding-right: 100px;
        }
        .address-lines {
          font-size: 15px;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }
        .address-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .address-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          word-break: break-all;
        }
        .address-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }
        .address-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: #182c5a;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .address-action-btn:hover {
          border-color: #182c5a;
          background: #f8fafc;
        }
        .address-action-btn.danger {
          color: #dc2626;
        }
        .address-action-btn.danger:hover {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .address-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 800px) {
          .address-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default AddressesPage;
