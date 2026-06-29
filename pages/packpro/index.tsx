import Banner from "../../components/landing/TapeBanner";
import PackproTapeCatalogPage, {
  getPackproTapeCatalogServerSideProps,
} from "../../components/listing/PackproTapeCatalogPage";

export const getServerSideProps = getPackproTapeCatalogServerSideProps;

const PackproPage = (props) => (
  <PackproTapeCatalogPage
    {...props}
    BannerComponent={Banner}
  />
);

export default PackproPage;
