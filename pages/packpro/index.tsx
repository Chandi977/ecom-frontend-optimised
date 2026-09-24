import Banner from "../../components/landing/TapeBanner";
import PackproTapeCatalogPage, {
  getPackproTapeCatalogServerSideProps,
} from "../../components/listing/PackproTapeCatalogPage";

export const getServerSideProps = getPackproTapeCatalogServerSideProps;

const PackproBanner = () => (
  <Banner
    heading="Buy PackPro Packaging Products Online"
    description="Shop high quality PackPro packaging products online for retail packaging, ecommerce, food wrapping and shipping needs. Explore our paper carry bags, food wrapping papers, BOPP tapes for all packaging solutions."
  />
);

const PackproPage = (props) => (
  <PackproTapeCatalogPage
    {...props}
    BannerComponent={PackproBanner}
  />
);

export default PackproPage;
