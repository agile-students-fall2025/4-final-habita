import Joi from 'joi';

const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(300).allow('', null),
  members: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().email(), // email
        Joi.string().min(3).max(50) // userId or username
      )
    )
    .default([])
});

export function validateCreateGroup(payload) {
  const { error, value } = createGroupSchema.validate(payload, {
    abortEarly: true,
    stripUnknown: true
  });
  return { error, value };
}

export default { validateCreateGroup };




