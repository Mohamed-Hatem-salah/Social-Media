import * as validators from './auth.validation';
import { z } from 'zod';

export type IsignupBodyInputsDto = z.infer<typeof validators.signup.body>;
export type IConfirmEmailInputsDto = z.infer<typeof validators.confirmEmail.body>;
export type ILoginBodyInputsDto = z.infer<typeof validators.login.body>;
export type IForgotCodeBodyInputsDto = z.infer<typeof validators.sendForgotPasswordCode.body>;
export type IverifyForgotPasswordBodyInputsDto = z.infer<typeof validators.verifyForgotPassword.body>;
export type IResetForgotPasswordBodyInputsDto = z.infer<typeof validators.ResetForgotPassword.body>;
export type IGMAIL = z.infer<typeof validators.signupWithGmail.body>;
