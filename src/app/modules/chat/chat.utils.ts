import Friendship from "../friendShip/friendShip.model";

// Helper function to ensure friendship creation or update
export const ensureFriendship = async (userId: any, requesterId: any) => {
    // Check if friendship already exists for userId
    let existingFriendship = await Friendship.findOne({ userId });
  
    if (existingFriendship) {
      // If friendship exists, update it to add requesterId
      if (!existingFriendship.friendship.includes(requesterId)) {
        existingFriendship.friendship.push(requesterId);
        await existingFriendship.save();
      }
    } else {
      // If no friendship exists, create a new friendship document
      await Friendship.create({ userId, friendship: [requesterId] });
    }
  
    // Check if friendship already exists for requesterId
    existingFriendship = await Friendship.findOne({ userId: requesterId });
  
    if (existingFriendship) {
      // If friendship exists, update it to add userId
      if (!existingFriendship.friendship.includes(userId)) {
        existingFriendship.friendship.push(userId);
        await existingFriendship.save();
      }
    } else {
      // If no friendship exists, create a new friendship document
      await Friendship.create({ userId: requesterId, friendship: [userId] });
    }
  };