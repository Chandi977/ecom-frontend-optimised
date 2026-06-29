import Banner from "../../components/landing/TapeBanner";
import PackproTapesCatalogPage, {
  getPackproTapesCatalogServerSideProps,
} from "../../components/listing/PackproTapesCatalogPage";

export const getServerSideProps = getPackproTapesCatalogServerSideProps;

const PackproTapesPage = (props) => (
  <PackproTapesCatalogPage
    {...props}
    BannerComponent={Banner}
  />
);

export default PackproTapesPage;
