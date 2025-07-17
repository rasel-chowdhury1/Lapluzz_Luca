import { Schema, model } from 'mongoose';
import { IWishList, IWishListModel } from './wishlist.interface';

const FolderSchema = new Schema(
  {
    folderName: { type: String, required: true },
    businesses: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
    events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    jobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }]
  },
  { _id: false }
);

const WishListSchema = new Schema<IWishList>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    folders: { type: [FolderSchema], default: [] }
  },
  { timestamps: true }
);

const WishList = model<IWishList, IWishListModel>('WishList', WishListSchema);
export default WishList;
