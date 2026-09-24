import React, { useEffect, useState } from "react";
import { getService } from "../../services/service";
import { cdn } from "../../lib/cdn";

function Brand({ item, index }) {
  const [images, setImages] = useState(null);
  const makecall = async () => {
    if (!item?.image) {
      return null;
    }
    const result = await getService(`getImage?image=${item?.image}`);
    //console.log('Result:', result);
    return result?.data?.data?.url;
  };

  const getIMage = async () => {
    const image = await makecall();
    setImages(image);
  };

  useEffect(() => {
    getIMage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <img
      src={images || item?.image || cdn("/pp_logo_1.png")}
      alt="Brand logo"
      className="my-2"
      style={{ width: "120px", height: "50px", objectFit: "cover" }}
      key={index}
    />
  );
}

export default Brand;
