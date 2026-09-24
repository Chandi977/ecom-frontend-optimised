import Banner from "../../components/landing/TapeBanner";
import PackproTapesCatalogPage, {
  getPackproTapesCatalogServerSideProps,
} from "../../components/listing/PackproTapesCatalogPage";

export const getServerSideProps = getPackproTapesCatalogServerSideProps;

const PackagingTapesBanner = () => (
  <Banner
    heading="Buy Packaging Tapes Online for Shipping"
    description="Now buy packaging tapes online for ecommerce shipping, business and logistics. Explore our strong adhesives and transparent and brown BOPP tapes designed for strong, tamper-evident sealing, void paper tapes and speciality tapes in multiple sizes."
  />
);

const PackproTapesPage = (props) => (
  <PackproTapesCatalogPage
    {...props}
    BannerComponent={PackagingTapesBanner}
  />
);

export default PackproTapesPage;
