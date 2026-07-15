import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { indianStates } from "../assets/data";
import Select from "react-select";
import { postService } from "../services/service";
import { toast } from "react-toastify";


const emptyAddressDetails = {
  name: "",
  mobile: "",
  gstin: "",
  address: "",
  pincode: "",
  landmark: "",
  town: "",
  email: "",
  state: "",
};

const normalizeAddressDetails = (value: any = {}) => ({
  name: String(value?.name ?? ""),
  mobile: String(value?.mobile ?? value?.phone ?? ""),
  gstin: String(value?.gstin ?? ""),
  address: String(value?.address ?? ""),
  pincode: String(value?.pincode ?? ""),
  landmark: String(value?.landmark ?? ""),
  town: String(value?.town ?? ""),
  email: String(value?.email ?? ""),
  state: String(value?.state ?? ""),
});

function AddressModal({ visible, handleVisible, prev, address }) {
  const [selectedState, setSelectedState] = useState<Record<string, any>>({});
  const [addresses, setAddresses] = useState<any[]>([]);
  const [details, setDetails] = useState(emptyAddressDetails);
  const [states, setStates] = useState<any[]>([]);

  useEffect(() => {
    const temp = indianStates?.map((x) => {
      return { value: x, label: x };
    });
    setStates(temp);
    setAddresses(Array.isArray(prev) ? prev : []);
  }, [indianStates, prev]);

  useEffect(() => {
    if (address) {
      const normalizedAddress = normalizeAddressDetails(address);
      setDetails(normalizedAddress);
      setSelectedState(
        normalizedAddress.state
          ? { value: normalizedAddress.state, label: normalizedAddress.state }
          : {},
      );
    } else {
      setDetails(emptyAddressDetails);
      setSelectedState({});
    }
  }, [address]);

  const HandleAddress = async (e) => {
    e.preventDefault();
    const addressPayload = {
      ...details,
      phone: details.mobile,
      state: selectedState?.value || details.state,
    };

    const user = JSON.parse(localStorage.getItem("PIUser") || "{}");
    const temp = [...addresses];

    if (address) {
      const index = temp.findIndex((x) => x.address === address.address);
      if (index !== -1) {
        // Keep the default flag; the payload form has no isDefault field.
        temp[index] = { ...addressPayload, isDefault: Boolean(address?.isDefault) };
      }
    } else {
      temp.push({ ...addressPayload, isDefault: temp.length === 0 });
    }

    const data = {
      id: user?._id,
      contact_address: temp,
    };

    const res = await postService("edituser", data);
    if (res?.data?.success) {
      toast.success(address ? "Address updated successfully" : "Address added successfully");
      handleVisible(false);
      setDetails(emptyAddressDetails);
      setSelectedState({});
    }
  };
  const reactSelectCustomStyles = {
    control: (provided, state) => ({
      ...provided,
      height: "46px",
      borderRadius: "8px",
      borderColor: state.isFocused ? "#182c5a" : "#cbd5e1",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(24, 44, 90, 0.12)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#182c5a" : "#94a3b8",
      },
      fontFamily: "Montserrat, sans-serif",
      fontSize: "14.5px",
      backgroundColor: "#ffffff",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1e293b",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#182c5a"
        : state.isFocused
        ? "rgba(24, 44, 90, 0.06)"
        : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#1e293b",
      fontFamily: "Montserrat, sans-serif",
      fontSize: "14.5px",
      "&:active": {
        backgroundColor: "#182c5a",
        color: "#ffffff",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      zIndex: 9999,
    }),
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "640px" }}
      onHide={() => {
        handleVisible(false);
        setDetails(emptyAddressDetails);
        setSelectedState({});
      }}
      header={address ? "Edit Address" : "Add New Address"}
    >
      <form className="addr-form" onSubmit={HandleAddress}>
        <div className="addr-grid">
          {/* Full Name */}
          <div className="addr-field full-width">
            <label className="addr-label">Full Name*</label>
            <input
              className="addr-input"
              required
              value={details.name}
              placeholder="John Doe"
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
          </div>

          {/* Mobile Number */}
          <div className="addr-field">
            <label className="addr-label">Mobile Number*</label>
            <input
              className="addr-input"
              value={details.mobile}
              placeholder="9874563210"
              maxLength={10}
              minLength={10}
              pattern="[0-9]*"
              title="Please enter only numbers"
              required
              type="text"
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                if (onlyNums.length <= 10) {
                  setDetails({ ...details, mobile: onlyNums });
                }
              }}
            />
          </div>

          {/* Email Address */}
          <div className="addr-field">
            <label className="addr-label">Email address*</label>
            <input
              className="addr-input"
              value={details.email}
              placeholder="johndoe@mail.com"
              type="email"
              required
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
            />
          </div>

          {/* GSTIN */}
          <div className="addr-field full-width">
            <label className="addr-label">GSTIN*</label>
            <input
              className="addr-input"
              value={details.gstin}
              placeholder="22AAAAA0000A1Z5"
              required
              minLength={15}
              maxLength={15}
              onChange={(e) => setDetails({ ...details, gstin: e.target.value })}
            />
          </div>

          {/* Flat, House no., Building, Apartment */}
          <div className="addr-field full-width">
            <label className="addr-label">Flat, House no., Building, Apartment*</label>
            <input
              className="addr-input"
              placeholder="A-121, Green Village Society, Green Park."
              required
              value={details.address}
              onChange={(e) => setDetails({ ...details, address: e.target.value })}
            />
          </div>

          {/* Pin Code */}
          <div className="addr-field">
            <label className="addr-label">Pin Code*</label>
            <input
              className="addr-input"
              value={details.pincode}
              required
              maxLength={6}
              placeholder="110035"
              onChange={(e) => setDetails({ ...details, pincode: e.target.value })}
            />
          </div>

          {/* Landmark */}
          <div className="addr-field">
            <label className="addr-label">Landmark</label>
            <input
              className="addr-input"
              value={details.landmark}
              placeholder="Near ABC Bank"
              onChange={(e) => setDetails({ ...details, landmark: e.target.value })}
            />
          </div>

          {/* Town/City */}
          <div className="addr-field">
            <label className="addr-label">Town/City*</label>
            <input
              className="addr-input"
              required
              value={details.town}
              placeholder="New Delhi"
              onChange={(e) => setDetails({ ...details, town: e.target.value })}
            />
          </div>

          {/* State */}
          <div className="addr-field">
            <label className="addr-label">State*</label>
            <Select
              options={states}
              placeholder="Select state"
              value={selectedState}
              onChange={(option) => setSelectedState(option || {})}
              instanceId="address-state-select"
              inputId="address-state-select"
              styles={reactSelectCustomStyles}
            />
          </div>
        </div>

        <div className="addr-actions">
          <button className="addr-submit-btn" type="submit">
            Save Address
          </button>
        </div>
      </form>

      <style jsx>{`
        .addr-form {
          display: flex;
          flex-direction: column;
          font-family: "Montserrat", sans-serif;
          padding: 10px 5px;
        }
        .addr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .addr-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .addr-field.full-width {
          grid-column: span 2;
        }
        .addr-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          margin: 0;
          font-family: "Montserrat", sans-serif;
        }
        .addr-input {
          width: 100%;
          height: 46px;
          background-color: #ffffff !important;
          color: #1e293b !important;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          font-family: "Montserrat", sans-serif;
          font-size: 14.5px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }
        .addr-input:focus {
          outline: none;
          border-color: #182c5a;
          box-shadow: 0 0 0 3px rgba(24, 44, 90, 0.12);
        }
        .addr-input::placeholder {
          color: #94a3b8;
        }
        .addr-actions {
          display: flex;
          justify-content: center;
          margin-top: 26px;
        }
        .addr-submit-btn {
          width: 180px;
          height: 48px;
          border: none;
          background-color: #182c5a;
          color: #ffffff;
          font-family: "Montserrat", sans-serif;
          font-size: 15px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(24, 44, 90, 0.2);
          transition:
            background-color 0.15s ease,
            transform 0.1s ease,
            box-shadow 0.15s ease;
        }
        .addr-submit-btn:hover {
          background-color: #e92227;
          box-shadow: 0 6px 16px rgba(233, 34, 39, 0.3);
        }
        .addr-submit-btn:active {
          transform: scale(0.98);
        }

        @media (max-width: 600px) {
          .addr-grid {
            grid-template-columns: 1fr;
          }
          .addr-field.full-width {
            grid-column: span 1;
          }
        }
      `}</style>
    </Dialog>
  );
}

export default AddressModal;
