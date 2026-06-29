import CarryHandleTapeBanner from "../../components/landing/CarryHandleTapeBanner";
import TapeListingPage, {
  getTapeListingServerSideProps,
} from "../../components/listing/TapeListingPage";

const CARRY_HANDLE_TAPE_SUBCATEGORY_ID = "6927e857d53f3a772c701b9e";

export const getServerSideProps = (context) =>
  getTapeListingServerSideProps(context, {
    defaultSubcategoryId: CARRY_HANDLE_TAPE_SUBCATEGORY_ID,
  });

const CarryHandleTapePage = (props) => (
  <TapeListingPage
    {...props}
    BannerComponent={CarryHandleTapeBanner}
    pageTitle="Buy Carry Handle Tapes online | store.prempackaging"
    metaTitle="Buy Carry Handle Tapes online"
    metaDescription="Durable PackPro Carry Handle Tape designed for convenience and strength. Easily lifts up to 15kg, making packaging and transportation effortless. Order now!"
    breadcrumbLabel="PackPro Carry Handle Tapes"
    thicknessLabel="Thickness (micron)"
    defaultSubcategoryId={CARRY_HANDLE_TAPE_SUBCATEGORY_ID}
  />
);

export default CarryHandleTapePage;
