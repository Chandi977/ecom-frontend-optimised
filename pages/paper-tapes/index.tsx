import PaperTapeBanner from "../../components/landing/PaperTapeBanner";
import TapeListingPage, {
  getTapeListingServerSideProps,
} from "../../components/listing/TapeListingPage";

const PAPER_TAPE_SUBCATEGORY_ID = "6927e83dd53f3a772c701b93";

export const getServerSideProps = (context) =>
  getTapeListingServerSideProps(context, {
    defaultSubcategoryId: PAPER_TAPE_SUBCATEGORY_ID,
  });

const PaperTapePage = (props) => (
  <TapeListingPage
    {...props}
    BannerComponent={PaperTapeBanner}
    pageTitle="Buy Paper Tapes online | store.prempackaging"
    metaTitle="Buy Paper Tapes online"
    metaDescription="Prem Industries India Limited is the leading paper packaging tape manufacturer in India. Now buy paper tapes online in India at affordable prices. Shop paper packaging tape online India"
    breadcrumbLabel="Paper Tapes"
    thicknessLabel="Thickness (gsm)"
    defaultSubcategoryId={PAPER_TAPE_SUBCATEGORY_ID}
  />
);

export default PaperTapePage;
