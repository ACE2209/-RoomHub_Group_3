import { body } from 'express-validator';
import { deleteFile } from '../utils/fileUtils.js';
import User from '../models/userModel.js';
import bcrypt from "bcrypt";

export const createUserValidator = [
  body('username')
    .isString()
    .withMessage('Username must be a string')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 6 })
    .withMessage('Username must be at least 6 characters long'),


  body("password")
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required'),

  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .notEmpty()
    .withMessage('Email is required'),

  body('fullName')
    .isString()
    .withMessage('Full name must be a string')
    .notEmpty()
    .withMessage('Full name is required'),

  body('gender').isString().withMessage('Gender must be a string'),

  body('phoneNumber')
    .isMobilePhone('vi-VN')
    .withMessage('Phone number must be a valid Vietnamese phone number')
    .isString()
    .withMessage('Phone number must be a string'),

  body('role').optional().isString().withMessage('Role must be a string'),

  body('socialId')
    .optional()
    .isString()
    .withMessage('Social ID must be a string'),

  body('address.*.province')
    .optional()
    .isString()
    .withMessage('Province must be a string')
    .notEmpty()
    .withMessage('Province is required'),

  body('address.*.district')
    .optional()
    .isString()
    .withMessage('District must be a string')
    .notEmpty()
    .withMessage('District is required'),

  body('address.*.ward')
    .optional()
    .isString()
    .withMessage('Ward must be a string')
    .notEmpty()
    .withMessage('Ward is required'),

  body('address.*.detailAddress')
    .optional()
    .isString()
    .withMessage('Detail address must be a string')
    .notEmpty()
    .withMessage('Detail address is required'),

  body('address.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  avatarImageValidator(false),
];

export const updateUserValidator = [
  body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 6 })
    .withMessage('Username must be at least 6 characters long'),

  body('password')
    .optional()
    .custom(async (value, { req }) => {
      const user = await User.findById(req.user.userId)
      if (!user) {
        throw new Error("Error")
      }
      const checkPassword = await bcrypt.compare(value, user.password)
      if (!checkPassword) throw new Error("Old password is invalid")
    }),

  body("newPassword")
    .optional()
    .isString()
    .withMessage("new Password must be a string")
    .notEmpty()
    .withMessage("new Password is required"),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .notEmpty()
    .withMessage('Email is required'),

  body('fullName')
    .optional()
    .isString()
    .withMessage('Full name must be a string')
    .notEmpty()
    .withMessage('Full name is required'),

  body('gender').optional().isString().withMessage('Gender must be a string'),

  body('phoneNumber')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Phone number must be a valid Vietnamese phone number')
    .isString()
    .withMessage('Phone number must be a string'),

  body('role').optional().isString().withMessage('Role must be a string'),

  body('socialId')
    .optional()
    .isString()
    .withMessage('Social ID must be a string'),

  body('address.*.province')
    .optional()
    .isString()
    .withMessage('Province must be a string')
    .notEmpty()
    .withMessage('Province is required'),

  body('address.*.district')
    .optional()
    .isString()
    .withMessage('District must be a string')
    .notEmpty()
    .withMessage('District is required'),

  body('address.*.ward')
    .optional()
    .isString()
    .withMessage('Ward must be a string')
    .notEmpty()
    .withMessage('Ward is required'),

  body('address.*.detailAddress')
    .optional()
    .isString()
    .withMessage('Detail address must be a string')
    .notEmpty()
    .withMessage('Detail address is required'),

  body('address.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  avatarImageValidator(false),
];
