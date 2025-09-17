import { Schema, model } from 'mongoose';

// Define the item schema
const ItemSchema = new Schema(
  {
    itemName: { type: String, required: true },
    isChecked: { type: Boolean, default: false }, // If true, item is checked
    createdAt: { type: Date, default: Date.now },
  }
);

// Define the checklist schema
const ChecklistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, default: "" },
    checklistName: { type: String, required: true },
    items: { type: [ItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
  },
  { timestamps: true }
);

// Predefined items that will be added to every checklist
const defaultItems = [
  { itemName: 'Location & Venues', isChecked: false },
  { itemName: 'Invitations & Guests', isChecked: false },
  { itemName: 'Catering & Food', isChecked: false },
  { itemName: 'Cake & Desserts', isChecked: false },
  { itemName: 'Entertainment & Performances', isChecked: false },
  { itemName: 'Music & Audio', isChecked: false },
  { itemName: 'Decorations & Setups', isChecked: false },
  { itemName: 'Photos & Videos', isChecked: false },
  { itemName: 'Gifts & End of Party', isChecked: false },
];

ChecklistSchema.pre('save', function (next) {
  // If items array is empty, push the predefined items
  if (this.items.length === 0) {
    this.items = defaultItems as any;
  }
  next();
});

const Checklist = model('Checklist', ChecklistSchema);
export default Checklist;