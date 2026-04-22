import Team from '../models/Team.js';

export const createTeam = async (req, res) => {
  try {
    const { workspaceId, name } = req.body;
    const newTeam = new Team({ workspaceId, name, members: [] });
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ workspaceId: req.params.workspaceId });
    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const mergeTeams = async (req, res) => {
  try {
    const { targetTeamId, sourceTeamId } = req.body;
    const target = await Team.findById(targetTeamId);
    const source = await Team.findById(sourceTeamId);
    
    if (!target || !source) return res.status(404).json({ error: 'Team not found' });

    // Combine members and deduplicate by name
    const combinedMembers = [...target.members, ...source.members];
    const uniqueMembers = Array.from(new Map(combinedMembers.map(item => [item.name, item])).values());
    
    target.members = uniqueMembers;
    await target.save();
    
    // Delete source
    await Team.findByIdAndDelete(sourceTeamId);
    res.status(200).json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
