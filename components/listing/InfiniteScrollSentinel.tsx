import React from "react";
import Skeleton from "@mui/material/Skeleton";

const InfiniteScrollSentinel = ({ loadMoreRef, isFetchingMore }) => (
  <>
    <div ref={loadMoreRef} style={{ height: "1px" }} />
    {isFetchingMore && (
      <div className="row">
        <div
          className="col d-flex flex-column align-items-center justify-content-center"
          style={{ paddingBottom: "24px" }}
        >
          <Skeleton variant="text" width={180} />
          <Skeleton variant="text" width={120} />
        </div>
      </div>
    )}
  </>
);

export default InfiniteScrollSentinel;
