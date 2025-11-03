import { nanoid } from 'nanoid';
import { validateCreateGroup } from '../validators/groupSchemas.js';

export function createGroupHandler(req, res, next) {
  try {
    const { error, value } = validateCreateGroup(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { name, members = [], description = '' } = value;

    // Mock persistence: generate id and return payload
    const group = {
      id: nanoid(12),
      name,
      description,
      members,
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({ group });
  } catch (err) {
    return next(err);
  }
}

export default { createGroupHandler };




