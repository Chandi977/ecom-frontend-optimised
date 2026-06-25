import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { indianStates } from "../assets/data";
import Select from "react-select";
import { postService } from "../services/service";
import { toast } from "react-toastify";


function AddressModal({ visible, handleVisible, prev, address }) {
  const [selectedState, setSelectedState] = useState<Record<string, any>>({});
  const [addresses, setAddresses] = useState([]);
  const [details, setDetails] = useState({
    name: "",
    mobile: "",
    gstin: "",
    address: "",
    pincode: "",
    landmark: "",
    town: "",
    email: "",
    state: "",
  });
  const [states, setStates] = useState([]);

  useEffect(() => {
    const temp = indianStates?.map((x) => {
      return { value: x, label: x };
    });
    setStates(temp);
    setAddresses(prev);
  }, [indianStates, prev]);

  useEffect(() => {
    if (address) {
      setDetails(address);
      setSelectedState({ value: address.state, label: address.state });
    }
  }, [address]);

  const HandleAddress = async (e) => {
    e.preventDefault();
    if (address) {
      const user = JSON.parse(localStorage.getItem("PIUser"));
      const temp = addresses;
      const index = temp.findIndex((x) => x.address === address.address);
      temp[index] = details;
      const data = {
        id: user?._id,
        contact_address: temp,
      };
      const res = await postService("edituser", data);
      if (res?.data?.success) {
        toast.success("Address updated successfully");
        handleVisible(false);
        setDetails({
          name: "",
          mobile: "",
          gstin: "",
          address: "",
          pincode: "",
          landmark: "",
          town: "",
          email: "",
          state: "",
        });
      }
    } else {
      const user = JSON.parse(localStorage.getItem("PIUser"));
      const temp = addresses;
      const t = details;
      t.state = selectedState?.value;
      temp.push(t);
      const data = {
        id: user?._id,
        contact_address: temp,
      };
      const res = await postService("edituser", data);
      if (res?.data?.success) {
        toast.success("Address added successfully");
        handleVisible(false);
        setDetails({
          name: "",
          mobile: "",
          gstin: "",
          address: "",
          pincode: "",
          landmark: "",
          town: "",
          email: "",
          state: "",
        });
      }
    }
  };
  return (
    <Dialog
      visible={visible}
      style={{ width: "600px" }}
      onHide={() => {
        handleVisible(false);
        setDetails({
          name: "",
          mobile: "",
          gstin: "",
          address: "",
          pincode: "",
          landmark: "",
          town: "",
          email: "",
          state: "",
        });
      }}
      header={address ? "Edit Address" : "Add New Address"}
    >
      <form
        style={{ display: "flex", flexDirection: "column" }}
        onSubmit={HandleAddress}
      >
        <label
          className="p-0 mt-0"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Full Name*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          required
          value={details.name}
          placeholder="John Doe"
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Mobile Number*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          value={details.mobile}
          placeholder="9874563210"
          maxLength={10}
          minLength={10}
          pattern="[0-9]*"
          title="Please enter only numbers"
          required
          type="text"
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
            if (onlyNums.length <= 10) {
              setDetails({ ...details, mobile: onlyNums });
            }
          }}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Email address*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          value={details.email}
          placeholder="Johndoe@mail.com"
          type="email"
          required
          onChange={(e) => setDetails({ ...details, email: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          GSTIN*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          value={details.gstin}
          placeholder="22AAAAA0000A1Z5"
          required
          minLength={15}
          maxLength={15}
          onChange={(e) => setDetails({ ...details, gstin: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Flat, House no., Building, Apartment*
        </label>
        <input
          placeholder="A-121 , Green Village Society , Green Park."
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          required
          value={details.address}
          onChange={(e) => setDetails({ ...details, address: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Pin Code*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          value={details.pincode}
          required
          maxLength={6}
          placeholder="110035"
          onChange={(e) => setDetails({ ...details, pincode: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Landmark
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          value={details.landmark}
          placeholder="Near ABC Bank "
          onChange={(e) => setDetails({ ...details, landmark: e.target.value })}
        />
        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          Town/City*
        </label>
        <input
          style={{
            width: "100%",
            height: "48px",
            backgroundColor: "white",
            border: "1px solid #EBEBEB",
            padding: "10px",
          }}
          required
          value={details.town}
          placeholder="New Delhi"
          onChange={(e) => setDetails({ ...details, town: e.target.value })}
        />

        <label
          className="p-0 mt-3"
          style={{ fontWeight: "500", color: "#333333", fontSize: "16px" }}
        >
          State*
        </label>
        <Select
          options={states}
          placeholder="Select state"
          value={selectedState}
          onChange={setSelectedState}
          instanceId="address-state-select"
          inputId="address-state-select"
        ></Select>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "30px",
            marginBottom: "0px",
          }}
        >
          <button
            className="tw-bg-[#182c5a] hover:tw-bg-[#e92227]"
            style={{
              width: "150px",
              height: "48px",
              border: "none",
              padding: "10px",
              color: "white",
              borderRadius: "10px",
            }}
            type="submit"
          >
            {address ? "Edit Address" : "Add Address"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default AddressModal;
