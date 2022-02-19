import classnames from "classnames";
import formatRelative from "date-fns/formatRelative";
import React, { useEffect } from "react";
import { useChannelStore } from "../../stores/channels";
import { useMessageStore } from "../../stores/messages";
import { useReactionStore } from "../../stores/reactions";
import { useUserStore } from "../../stores/users";
import MessageEditor from "../MessageEditor/MessageEditor";
import styles from "./MessageViewer.module.css";
import Emoji from "../Emoji/Emoji"; 
import { createEmojiReaction } from "../../actions"
import socket from "../../lib/socket";
import { clientEvents, serverEvents } from "../../constants";

const Message = ({ content, createdAt, id, userId, channelId }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const user = useUserStore((state) =>
    state.users.find((user) => user.id === userId)
  );
  const activeUserId = useUserStore((state) => state.activeUserId);
  const dateInstance = React.useMemo(() => new Date(createdAt), [createdAt]);
  
  return (
    <div className={styles.message}>
      <div className={styles.metadata}>
        {user == null ? null : (
          <span className={styles.username}>{user.username}</span>
        )}
        <span className={styles.timestamp}>
          {formatRelative(dateInstance, new Date())}
        </span>
      </div>
      {isEditing ? (
        <MessageEditor
          channelId={channelId}
          id={id}
          content={content}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        content
      )}
      {userId === activeUserId && !isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className={styles.editButton}
        >
          Edit
        </button>
      ) : null}
    </div>
  );
};

const MessageViewer = () => {
  const allMessages = useMessageStore((state) => state.messages);
  const activeUserId = useUserStore((state) => state.activeUserId);
  const user = useUserStore((state) =>
  state.users.find((user) => user.id === activeUserId)
  );
  const activeChannelId = useChannelStore((state) => state.activeChannelId);
  const messagesForActiveChannel = React.useMemo(
    () =>
      allMessages.filter((message) => message.channelId === activeChannelId),
    [activeChannelId, allMessages]
  );
  const isEmpty = messagesForActiveChannel.length === 0;
  const [doneSettingState, setDoneSettingState] = React.useState(false)
  const [userData, setUserData] = React.useState({
    messageId: '',
    username: user.username , 
    userId: activeUserId, 
    channelId: activeChannelId,  
    thumbUp: 0,
    redHeart: 0,
    faceWithTearsOfJoy: 0,
  }
)
  // QUESTION : why isn't the store ready with all the data here immediately like the other stores?
  const [allReactions, setAllReactions] = React.useState(useReactionStore((state) => state.reactions))
  const [destructuredReactions, setDestructuredReactions] = React.useState([])
  let allUsers = [] 
  let destructureAndCombineData = null
  let reformatData = null
  let thumbUpTotal = []
  let redHeartTotal = []
  let faceWithTearsOfJoyTotal = []
  let thumbUpReact = false
  let redHeartReact = false
  let faceWithTearsOfJoyReact = false

  const fetchAllReactions = async () => {
    await socket.on(serverEvents.UPDATE_ALL_REACTIONS, (reactions) => { 
      setAllReactions({reactions})
    }
  )
    await socket.emit(clientEvents.FETCH_ALL_REACTIONS)
  }

  // fetch allReaction from reactions.db on load up of component
  useEffect(() => {
    fetchAllReactions()
  }, [])

  // reformatting objects for each unique userId
  useEffect(() => {
    if (allReactions.length !== 0) {
      allReactions.reactions.forEach((reaction) => allUsers.push(reaction.content.content.userData))
      // guard 
      // reformatting data
      if (allUsers.length !== 0) {
       destructureAndCombineData = allUsers.reduce(
        (userData, { userId, username, messageId, channelId, thumbUp, redHeart, faceWithTearsOfJoy }) => {
          if (!userData[userId]) {
            userData[userId] = {
              userId: userId,
              username: username,
              messageId:messageId,
              channelId: channelId,
              reactions: [],
            }
          }
          userData[userId].reactions.push({ thumbUp: thumbUp, redHeart: redHeart, faceWithTearsOfJoy: faceWithTearsOfJoy })
          return userData
        },
        {}
      )
    }
      // guard
      // reformatting data
      if (destructureAndCombineData !== null) {
        reformatData = recursiveTransform(destructureAndCombineData)
        function recursiveTransform(inputObj) {
          const newArr = Object.values(inputObj)
          newArr.forEach(obj => {
            if (obj.descendants) obj.descendants = recursiveTransform(obj.descendants)
            if (obj.children) obj.children = recursiveTransform(obj.children)
          });
          return newArr
        }
        console.log(``, reformatData)
        setDestructuredReactions(reformatData)
      }
    }
  }, [allReactions])

  // guards to only send request once when ready
  // QUESTION 1
  useEffect(() => {
    const sendRequests = async () => {
      if (doneSettingState) {
        await createEmojiReaction(userData)
        await fetchAllReactions()
        setDoneSettingState(false)
      }
    }
    sendRequests()
  }, [doneSettingState])

  const clickedEmoji =  (messageId, emojiLabel) => {
    switch(emojiLabel) {
      case 'thumb-up':
        if (userData.thumbUp === 0) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            thumbUp: 1,
          }))
        } 
        if (userData.thumbUp === 1) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            thumbUp: 0,
          }))
      } 
      setDoneSettingState(true)
      break
      case 'red-heart':
        if (userData.redHeart === 0) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            redHeart: 1,
          }))
        } 
        if (userData.redHeart === 1) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            redHeart: 0,
          }))
      } 
      setDoneSettingState(true)
      break
      case 'face-with-tears-of-joy':
        if (userData.faceWithTearsOfJoy === 0) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            faceWithTearsOfJoy: 1,
          }))
        } 
        if (userData.faceWithTearsOfJoy === 1) {
          setUserData(prevState => ({
            ...prevState,
            messageId: messageId,
            faceWithTearsOfJoy: 0,
          }))
      } 
      setDoneSettingState(true)
      break
      default:
        return '';
    }
  }

  const toggleEmojiReactions = (messageId) => {
    if (allReactions.length !== 0 && allReactions.reactions.length !== 0) {
      allReactions.reactions.forEach(reaction => {
        // sometimes allReaction was coming up as undefined, add guard if error continues
        // if (reaction && reaction.userData && reaction.createdAt) {
          // toggling reactions are based on unique individual userData such as userId, messageId, channelId
          const reactionDataToCompare = (reaction.content.content.userData.userId === userData.userId && 
                                        reaction.content.content.userData.messageId === messageId && 
                                        reaction.content.content.userData.channelId === userData.channelId)
          reactionDataToCompare && reaction.content.content.userData.thumbUp === 1 ? thumbUpReact = true : thumbUpReact = false
          reactionDataToCompare && reaction.content.content.userData.redHeart === 1 ? redHeartReact = true : redHeartReact = false
          reactionDataToCompare && reaction.content.content.userData.faceWithTearsOfJoy === 1 ? faceWithTearsOfJoyReact = true : faceWithTearsOfJoyReact = false
        // } 
      }) 
    }
  }

  const sumOfReactions = (array) => {
    const total = array.reduce((acc, num) => acc + num, 0)
    return total
  }

  const displayThumbUpTotal = () => {
    let allReactionsArray = []
    // convert object of nested objects -> array of objects 
    Object.keys(destructuredReactions).forEach(object => allReactionsArray.push({
      userData: destructuredReactions[object] 
    }))
    // TODO error only when opening a safari browser as another user?
    // reacting to one reaction might affect the count of others
    // maybe there's only issues w/ safari?
    if (allReactions.length !== 0) {
      const filterReactions = allReactionsArray.map((reaction) => { return ( reaction.userData.reactions.at(-1) ) })
      filterReactions.forEach(thumbUpReaction => 
        thumbUpTotal.push(thumbUpReaction.thumbUp) &&
        redHeartTotal.push(thumbUpReaction.redHeart) &&
        faceWithTearsOfJoyTotal.push(thumbUpReaction.faceWithTearsOfJoy)
      )
      thumbUpTotal = sumOfReactions(thumbUpTotal)
      redHeartTotal = sumOfReactions(redHeartTotal)
      faceWithTearsOfJoyTotal = sumOfReactions(faceWithTearsOfJoyTotal)
    }
  }

  return (
    <div
      className={classnames(styles.wrapper, { [styles.wrapperEmpty]: isEmpty })}
    > 
      {isEmpty ? (
        <div className={styles.empty}>
          No messages{" "}
          <span aria-label="Sad face" role="img">
            😢
          </span>
        </div>
      ) : (
        messagesForActiveChannel.map((message, messageIndex) => {
          return (
            <div key={messageIndex}>
            <Message
            channelId={activeChannelId}
            key={message.id}
            id={message.id}
            content={message.content}
            createdAt={message.createdAt}
            userId={message.userId}
          />
          <div>
            {toggleEmojiReactions(message.id)}
            {displayThumbUpTotal()}
            <Emoji 
            thumbUpReact={thumbUpReact}
            messageId={message.id} 
            clickedEmoji={clickedEmoji} 
            label="thumb-up" 
            symbol="👍"
            /> 
            <div> {thumbUpTotal} </div>
            <Emoji 
            redHeartReact={redHeartReact}
            messageId={message.id} 
            clickedEmoji={clickedEmoji} 
            label="red-heart" 
            symbol="❤️"
            /> 
            <div> {redHeartTotal} </div>
            <Emoji 
            faceWithTearsOfJoyReact={faceWithTearsOfJoyReact}
            messageId={message.id} 
            clickedEmoji={clickedEmoji} 
            label="face-with-tears-of-joy" 
            symbol="😂"
            /> 
            <div> {faceWithTearsOfJoyTotal} </div>
          </div>
          </div>
          )
        })
      )}
    </div>
  );
};

export default MessageViewer;
