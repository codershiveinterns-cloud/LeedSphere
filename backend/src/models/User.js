import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Firebase Auth uid — set on first authenticated request after migration.
  // Sparse index so legacy users without this field don't violate uniqueness.
  firebaseUid: { type: String, unique: true, sparse: true, index: true },
  // Optional now: Firebase-provisioned users don't have a local password.
  // Legacy JWT users keep theirs and can still sign in via the old flow if
  // re-enabled. minlength only applies when a password is actually present.
  password: { type: String, minlength: 6 },
  avatar: { type: String, default: '' },
  // Deprecated: authorization is workspace/team membership based.
  // Keep this field only for backward compatibility.
  role: { type: String, enum: ['admin', 'member'], default: undefined, select: false },
}, { timestamps: true });

// Hash password before save (Mongoose 9: no next() callback)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
