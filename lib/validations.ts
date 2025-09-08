import { z } from 'zod';

// Customer Signup Validation Schema
export const customerSignupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),

  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),

  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number'
    }),

  address: z.string()
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
});

// Login Validation Schema (for both customer and admin)
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password cannot exceed 100 characters')
});

// Admin Creation Schema (for internal use only)
export const adminCreationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),

  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),

  phone: z.string()
    .optional(),

  address: z.string()
    .optional()
});

// Password Change Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),

  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),

  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile Update Schema
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .optional(),

  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number'
    }),

  address: z.string()
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminCreationInput = z.infer<typeof adminCreationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
