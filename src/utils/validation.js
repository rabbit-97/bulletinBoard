import { body } from 'express-validator';

export const signupValidation = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('비밀번호는 최소 6자 이상이며 문자와 숫자를 포함해야 합니다.'),
];

export const updateValidation = [
  body('email').optional().isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('비밀번호는 최소 6자 이상이며 문자와 숫자를 포함해야 합니다.'),
];
