import React from "react";
import styles from "./Emoji.module.css";
import clsx from 'clsx'

const Emoji = (props) => {

const { clickedEmoji, messageId, thumbUpReact, redHeartReact, faceWithTearsOfJoyReact}  = props


    return (
        <div className={styles.emojiDivWrapper}>
            <span 
            className={
                clsx(styles.emojiSpan, {
                [styles.disableDiv]: !thumbUpReact || !redHeartReact || !faceWithTearsOfJoyReact,
                [styles.enableDiv]: thumbUpReact || redHeartReact || faceWithTearsOfJoyReact,
            })}
            role="img"
            value={messageId}
            aria-label={props.label ? props.label : ""}
            aria-hidden={props.label ? "false" : "true"}
            onClick={() => clickedEmoji(messageId, props.label ? props.label : "")}
            >
            {props.symbol}
            </span>
        </div>
    );
  };
  
  export default Emoji;
  