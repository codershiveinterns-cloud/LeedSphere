import { firebaseAuth } from '../config/firebaseAdmin.js';
import User from '../models/User.js';
import { ensureDefaultWorkspaceForUser } from './workspaceMember.js';

export const findOrCreateUserFromFirebaseClaims = async (decoded) => {
  let user = await User.findOne({ firebaseUid: decoded.uid }).select('-password');

  if (!user && decoded.email) {
    user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
    if (user && !user.firebaseUid) {
      user.firebaseUid = decoded.uid;
      await user.save();
    }
  }

  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      email: (decoded.email || `${decoded.uid}@firebase.local`).toLowerCase(),
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      avatar: decoded.picture || '',
    });
  }

  // Integrity guarantee: no authenticated user is left without workspace membership.
  await ensureDefaultWorkspaceForUser(user, { workspaceName: `${user.name || 'My'} Workspace` });

  return user;
};

export const verifyFirebaseTokenAndGetUser = async (token) => {
  const decoded = await firebaseAuth().verifyIdToken(token);
  const user = await findOrCreateUserFromFirebaseClaims(decoded);
  return { decoded, user };
};
