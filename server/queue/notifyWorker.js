import Queue from "bull";
import User from "../models/userModel.js";
import { sendPushOrEmail } from "../utils/sendPushOrEmail.js";

const notifyAllUsersQueue = new Queue("notifyAllUsers");

notifyAllUsersQueue.process(async (job, done) => {
  const { title, message, type, relatedId, relatedModel } = job.data;

  const batchSize = 1000;
  let skip = 0;
  let users = [];

  do {
    users = await User.find().skip(skip).limit(batchSize);

    for (const user of users) {
      await sendPushOrEmail(user, {
        title,
        message,
        type,
        relatedId,
        relatedModel,
        channels: ["email", "push"],
      });
    }

    skip += batchSize;
  } while (users.length === batchSize);

  done();
});

export default notifyAllUsersQueue;
