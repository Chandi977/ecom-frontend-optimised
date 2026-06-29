import SpecialityTapeBanner from "../../components/landing/SpecialityTapeBanner";
import TapeListingPage, {
  getTapeListingServerSideProps,
} from "../../components/listing/TapeListingPage";

const VOID_TAPE_SUBCATEGORY_ID = "6927e857d53f3a772c701b9b";

export const getServerSideProps = (context) =>
  getTapeListingServerSideProps(context, {
    defaultSubcategoryId: VOID_TAPE_SUBCATEGORY_ID,
  });

const VoidTapePage = (props) => (
  <TapeListingPage
    {...props}
    BannerComponent={SpecialityTapeBanner}
    pageTitle="Secure Tamper Evident Void Tape | store.prempackaging"
    metaTitle="Secure Tamper Evident Void Tape"
    metaDescription="Shop high-quality void tape at store.prempackaging.com. Ensure tamper-evident security for your packages with durable, reliable, and cost-effective packaging solutions."
    breadcrumbLabel="Void Tapes"
    thicknessLabel="Thickness (micron)"
    defaultSubcategoryId={VOID_TAPE_SUBCATEGORY_ID}
  />
);

export default VoidTapePage;
