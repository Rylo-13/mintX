import React from "react";
import styles from "./index.module.css";

const NFTCardSkeleton: React.FC = () => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.card}>
        <div className={`${styles.cardSide} ${styles.cardFront}`}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonDescription} />
          <div className={styles.skeletonAttributes}>
            <div className={styles.skeletonAttribute} />
            <div className={styles.skeletonAttribute} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCardSkeleton;
