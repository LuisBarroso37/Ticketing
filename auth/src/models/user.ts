import mongoose from 'mongoose';
import { HashPassword } from '../services/hashPassword';

// An interface that describes the properties that are required to create a new user
interface UserAttributes {
  email: string;
  password: string;
}

// An interface that describes the properties that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttributes): UserDoc;
}

// An interface that describes the properties that a User Document has
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

// Hash password before saving it to the database
userSchema.pre('save', async function (done) {
  // Prevent password rehashing if it has not been modified
  if (this.isModified('password')) {
    const hashed = await HashPassword.toHash(this.get('password'));
    this.set('password', hashed);
  }

  done();
});

// Add function to Mongoose model to integrate TypeScript
userSchema.statics.build = (attrs: UserAttributes) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
