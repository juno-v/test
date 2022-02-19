import React from "react";
import UserAccountSelector from "../components//UserAccountSelector/UserAccountSelector";
import styles from "./Authorization.module.css";
import UserAccountCreator from "../components/UserAccountCreator/UserAccountCreator";

const Authorization = () => {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.wrapper}>
        <UserAccountSelector />
        <UserAccountCreator />
      </div>
    </div>
  );
};

export default Authorization;
