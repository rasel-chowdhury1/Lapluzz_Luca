import bcrypt from 'bcrypt';
import { Error, model, Schema } from 'mongoose';
import config from '../../config';
import { Login_With, USER_ROLE } from './user.constants';
import { TUser, UserModel } from './user.interface';

const userSchema = new Schema<TUser>(
  {
    sureName: {
      type: String, //surename
      default: '',
    },
    lastName: {
      type: String,
      default: ""
    },
    name: {
      type: String, //surename
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    customId: {
      type: String,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: [USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
      default: USER_ROLE.USER,
    },
    phone: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'others', ''],
      default: "others"
    },
    about: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: ''
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    loginWth: {
      type: String,
      enum: Login_With,
      default: Login_With.credentials,
    },
    enableNotification: {
      type: Boolean,
      defult: false
    },
    dateOfBirth: {
      type: Date, // Added date of birth
      required: false, // Optional field
      default: ""
    },
    isSubBusiness: {
      type: Boolean,
      default: false,
    },
    parentBusiness: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
    
    wishlist: {
      type: [String],
      default: []
    },
    referralsUserList: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
      default: [],
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    termsAndConditions: {
      type: Boolean,
      default: false
    },
    device: {
      ip: {
        type: String,
      },
      browser: {
        type: String,
      },
      os: {
        type: String,
      },
      device: {
        type: String,
      },
      lastLogin: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds),
  );

  // Generate customId like "raseldev123"
  if (!user.customId && user.email) {
    const emailPrefix = user.email.split('@')[0].toLowerCase();
    const randomDigits = Math.floor(100 + Math.random() * 900); // random 3-digit number
    user.customId = `${emailPrefix}${randomDigits}`;
  }

  next();
});

// set '' after saving password
userSchema.post(
  'save',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function (error: Error, doc: any, next: (error?: Error) => void): void {
    doc.password = '';
    next();
  },
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password field
  return user;
};

// filter out deleted documents
userSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

userSchema.statics.isUserExist = async function (email: string) {
  console.log({ email });
  return await this.findOne({ email: email }).select('+password');
};

userSchema.statics.isUserActive = async function (email: string) {
  return await this.findOne({
    email: email,
    isBlocked: false,
    isDeleted: false
  }).select('+password');
};

userSchema.statics.IsUserExistById = async function (id: string) {
  return await this.findById(id).select('+password');
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const User = model<TUser, UserModel>('User', userSchema);
