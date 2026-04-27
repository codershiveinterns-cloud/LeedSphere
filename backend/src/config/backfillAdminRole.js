/**
 * One-shot migration: promote pre-existing workspace owners to User.role='admin'.
 *
 * Before this commit, signup created users with the schema default role
 * 'member'. After this commit, requireRole('admin') gates POST /workspaces,
 * POST /teams/merge, and POST /roles. Without this backfill, any user who
 * created a workspace before today would suddenly be unable to make a new
 * one — even though they're literally the owner of an existing one.
 *
 * Idempotent: only flips users whose current role isn't already 'admin' AND
 * who appear in some Workspace.createdBy. Safe to run on every boot; cheap
 * even on large datasets thanks to the $in / $ne filter.
 */
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

export const backfillAdminRole = async () => {
  try {
    const ownerIds = await Workspace.distinct('createdBy');
    if (!ownerIds.length) return;
    const result = await User.updateMany(
      { _id: { $in: ownerIds }, role: { $ne: 'admin' } },
      { $set: { role: 'admin' } },
    );
    if (result.modifiedCount > 0) {
      console.log(`[backfill] promoted ${result.modifiedCount} workspace owner(s) to User.role='admin'`);
    }
  } catch (err) {
    console.warn('[backfill] admin-role migration failed (non-fatal):', err.message);
  }
};
