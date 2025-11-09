import Joi from 'joi';

const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=\-{};:<>?,.]).{12,}$');

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.'
  }),
  role: Joi.string().valid('user', 'admin').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional() // Optional - can come from cookie
});
