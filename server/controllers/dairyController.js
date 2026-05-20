const Dairy = require('../models/Dairy');
const DairyEntry = require('../models/DairyEntry');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.listDairies = asyncHandler(async (req, res) => {
  const dairies = await Dairy.find().sort({ name: 1 });
  res.json(dairies);
});

exports.createDairy = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const trimmed = String(name || '').trim();
  if (!trimmed) return res.status(400).json({ message: 'name is required' });

  const exists = await Dairy.findOne({ name: trimmed });
  if (exists) return res.status(409).json({ message: 'Dairy with that name already exists' });

  const dairy = await Dairy.create({ name: trimmed, active: true });
  res.status(201).json(dairy);
});

exports.updateDairy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, active } = req.body;
  const dairy = await Dairy.findById(id);
  if (!dairy) return res.status(404).json({ message: 'Dairy not found' });

  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (!trimmed) return res.status(400).json({ message: 'name cannot be empty' });
    if (trimmed !== dairy.name) {
      const dupe = await Dairy.findOne({ name: trimmed });
      if (dupe) return res.status(409).json({ message: 'Another dairy already uses that name' });
      const oldName = dairy.name;
      dairy.name = trimmed;
      await Promise.all([
        DairyEntry.updateMany({ dairy: oldName }, { dairy: trimmed }),
        User.updateMany({ dairies: oldName }, { $set: { 'dairies.$[el]': trimmed } }, {
          arrayFilters: [{ el: oldName }]
        })
      ]);
    }
  }
  if (typeof active === 'boolean') dairy.active = active;

  await dairy.save();
  res.json(dairy);
});

exports.deleteDairy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dairy = await Dairy.findById(id);
  if (!dairy) return res.status(404).json({ message: 'Dairy not found' });

  const [entryCount, ownerCount] = await Promise.all([
    DairyEntry.countDocuments({ dairy: dairy.name }),
    User.countDocuments({ dairies: dairy.name })
  ]);
  if (entryCount > 0 || ownerCount > 0) {
    return res.status(400).json({
      message: `Cannot delete: ${entryCount} entries and ${ownerCount} owners reference this dairy. Deactivate instead.`
    });
  }

  await dairy.deleteOne();
  res.json({ message: 'Deleted' });
});
