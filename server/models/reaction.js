const path = require("path");
const Datastore = require("../lib/datastore");
const sortUtil = require("../util/sort");

const db = new Datastore({
  filename: path.join(__dirname, "../data/reactions.db"),
});

class Reaction {
  constructor(rawReaction) {
    const {_id: id, createdAt} = rawReaction;
    this.createdAt = createdAt == null ? Date.now() : createdAt;
    this.id = id
    this.content = rawReaction
  }

  static getAll() {
    return db
      .find({})
      .then((rawReactions) =>
        sortUtil
          .sortByCreation(rawReactions)
          .map((rawReaction) => new Reaction(rawReaction))
      );
  }

  save() {
      try {
        return db.update({ _id: this.id }, this.serialize(), { upsert: true });
      } catch(e) {
        return Promise.reject(e);
      }
  }

  serialize() {
    return {
      createdAt: this.createdAt,
      content: this.content,
      messageId: this.messageId
    };
  }
}

module.exports = { Reaction }