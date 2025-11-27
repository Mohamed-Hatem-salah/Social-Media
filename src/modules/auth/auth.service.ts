import type { Request, Response } from "express";
import { IConfirmEmailInputsDto, IForgotCodeBodyInputsDto, IGMAIL, ILoginBodyInputsDto, IResetForgotPasswordBodyInputsDto, IsignupBodyInputsDto, IverifyForgotPasswordBodyInputsDto } from "./auth.dto";
import { providerEnum, userModel } from "../../DB/model/user.model";
import { BadRequistException, ConflictException, NotfoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredential } from "../../utils/security/token.security";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { successResponse } from "../../utils/response/success.responce";
import { ILoginResponce } from "./auth.entities";
import { userRepository } from "../../DB/repository";

class AuthenticationService {
    private userModel = new userRepository(userModel);
    constructor() { }

    private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequistException('Failed to verify thi google account');
        }
        return payload;
    }

    loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: IGMAIL = req.body;
        const { email } = await this.verifyGmailAccount(idToken);

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.GOOGLE
            },
        })
        if (!user) {
            throw new NotfoundException('Not registered account')
        }


        const credentials = await createLoginCredential(user);

        return successResponse<ILoginResponce>({ res, data: { credentials } })
    }

    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: IGMAIL = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);

        const user = await this.userModel.findOne({
            filter: { email },
        })
        if (user) {
            if (user.provider === providerEnum.GOOGLE) {
                return await this.loginWithGmail(req, res);
            }
            throw new ConflictException(`Email already exists ::: ${user.provider}`);
        }

        const [newUser] = await this.userModel.create({
            data: [{
                firstName: given_name as string,
                lastName: family_name as string,
                email: email as string,
                profileImage: picture as string,
                confirmedAt: new Date(),
                provider: providerEnum.GOOGLE,
            }]
        }) || [];

        if (!newUser) {
            throw new BadRequistException('Failed to signup with gamil please try again later');
        }
        const credentials = await createLoginCredential(newUser);

        return successResponse<ILoginResponce>({ res, statusCode: 201, data: { credentials } })
    }

    /**
     * Signup new user
     */
    signup = async (req: Request, res: Response): Promise<Response> => {
        const { username, password, email }: IsignupBodyInputsDto = req.body;
        console.log({ username, email, password });

        const checkUserExist = await this.userModel.findOne({
            filter: { email },
            select: 'email',
            options: { lean: true },
        });

        if (checkUserExist) {
            throw new ConflictException('Email already exists');
        }

        const otp = generateNumberOtp();
        await this.userModel.createUser({
            data: [{
                username,
                email,
                password,
                confrimEmailOtp: `${otp}`
            }],
            options: { validateBeforeSave: true }
        });

        return successResponse({ res, statusCode: 201 })
    };

    /**
     * Confirm email using OTP
     */
    confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IConfirmEmailInputsDto = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                confrimEmailOtp: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });

        if (!user) {
            throw new NotfoundException('Invalid request or email already confirmed');
        }

        const isOtpValid = await compareHash(otp, user.confrimEmailOtp as string);
        if (!isOtpValid) {
            throw new ConflictException('Invalid confirmation code');
        }

        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confrimEmailOtp: 1 },
            },
        });

        return successResponse({ res })
    };

    login = async (req: Request, res: Response): Promise<Response> => {
        const { email, password }: ILoginBodyInputsDto = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: providerEnum.SYSTEM },
        })

        if (!user) {
            throw new NotfoundException('Invalid email or password');
        }
        if (!user.confirmedAt) {
            throw new BadRequistException('Please verify your email before logging in');
        }
        if (!(await compareHash(password, user.password))) {
            throw new NotfoundException('Invalid email or password');
        }

        const credentials = await createLoginCredential(user);

        return successResponse<ILoginResponce>({ res, data: { credentials } })

    };


    sendForgotCode = async (req: Request, res: Response): Promise<Response> => {
        const { email }: IForgotCodeBodyInputsDto = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: providerEnum.SYSTEM, confirmedAt: { $exists: true } },
        })

        if (!user) {
            throw new NotfoundException('Invalid account due to one of the following reasons: [ Email not registered , Email not verified , invalid provider ]');
        }

        const otp = generateNumberOtp();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await generateHash(String(otp)),
            },
        });
        if (!result.matchedCount) {
            throw new BadRequistException('Failed to reset code please try again later');
        }
        emailEvent.emit("resetPassword", { to: email, otp });
        return res.json({ message: 'Done' });
    };


    verifyForgotPassword = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IverifyForgotPasswordBodyInputsDto = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        })

        if (!user) {
            throw new NotfoundException('Invalid account due to one of the following reasons: [ Email not registered , Email not verified , invalid provider , Missing reset  OTP ]');
        }
        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new ConflictException('Invalid OTP');
        }

        return successResponse({ res })
    };


    resetForgotPassword = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp, password }: IResetForgotPasswordBodyInputsDto = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        })

        if (!user) {
            throw new NotfoundException('Invalid account due to one of the following reasons: [ Email not registered , Email not verified , invalid provider , Missing reset  OTP ]');
        }
        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new ConflictException('Invalid OTP');
        }

        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await generateHash(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            },
        });
        if (!result.matchedCount) {
            throw new BadRequistException('Failed to reset account password');
        }

        return res.json({ message: 'Done' });
    };

}

export default new AuthenticationService();
