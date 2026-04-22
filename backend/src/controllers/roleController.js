import Role from '../models/Role.js';

export const createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ workspaceId: req.params.workspaceId });
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
