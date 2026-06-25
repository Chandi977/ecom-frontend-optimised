import BOPPTapeBanner from "../../components/landing/BoppBanner";
import TapeListingPage, {
  getTapeListingServerSideProps,
} from "../../components/listing/TapeListingPage";

const BOPP_TAPE_SUBCATEGORY_ID = "6927e7e2d53f3a772c701b6b";

export const getServerSideProps = (context) =>
  getTapeListingServerSideProps(context, {
    defaultSubcategoryId: BOPP_TAPE_SUBCATEGORY_ID,
  });

const BoppTapePage = (props) => (
  <TapeListingPage
    {...props}
    BannerComponent={BOPPTapeBanner}
    pageTitle="Buy Best BOPP Tapes online | store.prempackaging"
    metaTitle="Buy Best BOPP Tapes online"
    metaDescription="Prem Industries India Limited offers high-quality BOPP tapes for secure packaging needs. Trust our reliable solutions. Order BOPP tapes now!"
    breadcrumbLabel="BOPP Tapes"
    thicknessLabel="Thickness (micron)"
    defaultSubcategoryId={BOPP_TAPE_SUBCATEGORY_ID}
  />
);

export default BoppTapePage;
