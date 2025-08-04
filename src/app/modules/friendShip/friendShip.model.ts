import { Schema, model } from 'mongoose';
import { IFriendship } from './friendShip.interface';

// Define the Friendship schema
const FriendshipSchema = new Schema<IFriendship>(
  {
    userId: {
      type: Schema.Types.ObjectId, // Refers to the User model
      required: true,
      ref: 'User', // This points to the User model
      unique: true, // Ensures userId is unique
    },
    friendship: [
      {
        type: Schema.Types.ObjectId, // Refers to the User model
        ref: 'User', // This points to the User model for the friends
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Friendship = model<IFriendship>('Friendship', FriendshipSchema);

export default Friendship;
