import { Schema, model, HydratedDocument, CallbackWithoutResultAndOptionalError, Document, Model } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password';

export type UserRole = 'user' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface IUser {
  email: string;
  password?: string; // Optional for OAuth users
  role: UserRole;
  refreshTokenHash?: string;
  provider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  displayName?: string;
  avatar?: string;
}

export interface UserDocumentMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, UserDocumentMethods>;

type UserModelType = Model<IUser, Record<string, never>, UserDocumentMethods>;

const userSchema = new Schema<IUser, UserModelType, UserDocumentMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function(this: IUser) {
        // Password required only for local auth
        return this.provider === 'local';
      },
      minlength: 12,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    refreshTokenHash: {
      type: String,
      select: false
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // Allow null values but unique when exists
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    displayName: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: Document, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        return ret;
      }
    }
  }
);

userSchema.pre('save', async function hashPasswordIfNeeded(this: UserDocument, next: CallbackWithoutResultAndOptionalError) {
  // Only hash password if it exists and is modified
  if (!this.password || !this.isModified('password')) {
    return next();
  }

  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = function comparePasswordMethod(this: UserDocument, candidate: string) {
  // OAuth users don't have password
  if (!this.password) {
    return Promise.resolve(false);
  }
  return comparePassword(candidate, this.password);
};

export const UserModel = model<IUser, UserModelType>('User', userSchema);
