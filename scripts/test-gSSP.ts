import axios from 'axios';

const DEV = "http://localhost:5000/premind/api/";

const getService = async (url: string) => {
  try {
    return await axios.get(DEV + url);
  } catch (err: any) {
    console.error('getService error for', url, err.message);
    return null;
  }
};

const postService = async (url: string, data: any) => {
  try {
    return await axios.post(DEV + url, data);
  } catch (err: any) {
    console.error('postService error for', url, err.message);
    return null;
  }
};

const run = async () => {
  const [categoryRes] = await Promise.all([
    getService("category/all"),
  ]);

  const categories = categoryRes?.data?.data ?? [];
  console.log('Categories count:', categories.length);
  const corrugatedCategory =
    categories.find((item: any) =>
      item?.slug?.toLowerCase()?.includes("corrugated"),
    ) ||
    categories.find((item: any) =>
      item?.name?.toLowerCase()?.includes("corrugated"),
    );
  const corrugatedCategoryId = corrugatedCategory?._id ?? null;
  console.log('corrugatedCategoryId:', corrugatedCategoryId);

  const filterPayload = {
    ...(corrugatedCategoryId ? { category: [corrugatedCategoryId] } : {}),
    skip: 0,
    limit: 20,
    includeMeta: true,
  };
  console.log('filterPayload:', filterPayload);
  const prod = await postService("product/filter", filterPayload);
  console.log('prod data success:', prod?.data?.success);
  console.log('prod products count:', prod?.data?.data?.length);
  console.log('prod meta:', prod?.data?.meta);
};

run();
