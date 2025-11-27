import type { Response, Request } from "express";
import { IFreezAccountDto, IHardDeleteAccountDto, IlogoutDto, IRestoreAccountDto } from "./user.dto";
import { Types, UpdateQuery } from "mongoose";
import { userRepository } from "../../DB/repository/user.repository";
import { HuserDocument, IUser, RoleEnum, userModel } from "../../DB/model/user.model";
import { createLoginCredential, createRevokeToken, logoutEnum } from "../../utils/security/token.security";
import { JwtPayload } from "jsonwebtoken";
import { createPreSignedUploadLink, deleteFiles, deleteFolderByPrifx, uploadFiles } from "../../utils/multer/s3.config";
import { storageEnum } from "../../utils/multer/cloud.multer";
import { BadRequistException, ConflictException, forbiddenException, NotfoundException, unautharizedException } from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3.events";
import { successResponse } from "../../utils/response/success.responce";
import { IUserResponce, IProfileImageResponce } from "./user.entities";
import { ILoginResponce } from "../auth/auth.entities";
import { FreindRequestRepository, postRepository } from "../../DB/repository";
import { FreindRequestModel, postModel } from "../../DB/model";



class UserService {
    private userModel = new userRepository(userModel);
    private postModel = new postRepository(postModel);
    private freindRequestModel = new FreindRequestRepository(FreindRequestModel);
    constructor() { }

    profileImage = async (req: Request, res: Response): Promise<Response> => {

        const { ContentType, Originalname }: { ContentType: string, Originalname: string } = req.body
        const { url, key } = await createPreSignedUploadLink({ ContentType, Originalname, path: `users/${req.decoded?._id}` })
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                profileImage: key,
                temprofileImage: req.user?.profileImage,
            },
        })
        if (!user) {
            throw new BadRequistException("Failed to update user profile image");
        }
        s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            key,
            expiresIn: 30000
        })
        return successResponse<IProfileImageResponce>({ res, data: { url } })
    }


    profileCoverImage = async (req: Request, res: Response): Promise<Response> => {

        const urls = await uploadFiles({
            storageApproach: storageEnum.disk,
            files: req.files as Express.Multer.File[],
            path: `users/${req.decoded?._id}/cover`,
            useLarge: true,
        })
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                coverImages: urls
            }

        })

        if (!user) {
            throw new BadRequistException("Failed to update profile cover images");
        }

        if (req.user?.coverImages) {
            await deleteFiles({ urls: req.user.coverImages })
        }
        return successResponse<IUserResponce>({ res, data: { user } })
    }


    profile = async (req: Request, res: Response): Promise<Response> => {
        const profile = await this.userModel.findById({
            id: req.user?._id as Types.ObjectId,
            options: {
                populate: [{ path: "friends", select: "firstName lastName eamil gender profilePicture" }]
            }
        })
        if (!profile) {
            throw new NotfoundException("Failed to finde user details")
        }
        return successResponse({ res, data: { profile } })
    }

    dashboard = async (req: Request, res: Response): Promise<Response> => {
        const results = await Promise.allSettled([
            this.userModel.find({ filter: {} }),
            this.postModel.find({ filter: {} }),
        ])
        if (!req.user) {
            throw new unautharizedException("missing user details")
        }
        return successResponse({ res, data: { results } })
    }

    changeRole = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as unknown as { userId: Types.ObjectId };
        const { role }: { role: RoleEnum } = req.body
        const denyRoles: RoleEnum[] = [role, RoleEnum.superAdmin]
        if (req.user?.role === RoleEnum.admin) {
            denyRoles.push(RoleEnum.admin)
        }
        const user = this.userModel.findOneAndUpdate({
            filter: {
                _id: userId as Types.ObjectId,
                role: { $nin: denyRoles }
            },
            update: {
                role,
            }
        })
        if (!user) {
            throw new NotfoundException("Failed to find matchin result")
        }
        return successResponse({ res })
    }


    sendFriendRequest = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as unknown as { userId: Types.ObjectId };
        const checkFriendRequestExist = await this.freindRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
            }
        })
        if (checkFriendRequestExist) {
            throw new ConflictException("Friend request already exist")
        }
        const user = await this.userModel.findOne({ filter: { _id: userId } })
        if (!user) {
            throw new NotfoundException("User not found")
        }
        const [friendRequest] = await this.freindRequestModel.create({
            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                sendTo: userId,
            }]
        }) || []
        if (!friendRequest) {
            throw new BadRequistException("Failed to send friend request")
        }
        return successResponse({ res, statusCode: 201 })
    }


    acceptFriendRequest = async (req: Request, res: Response): Promise<Response> => {
        const { requestId } = req.params as unknown as { requestId: Types.ObjectId };
        const friendRequest = await this.freindRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false },
            },
            update: {
                acceptedAt: new Date(),
            }
        })
        if (!friendRequest) {
            throw new NotfoundException("Failed to find matching result")
        }
        await Promise.all([
            await this.userModel.updateOne({
                filter: { _id: friendRequest.createdBy },
                update: {
                    $addToSet: { friends: friendRequest.sendTo }
                }
            }),

            await this.userModel.updateOne({
                filter: { _id: friendRequest.sendTo },
                update: {
                    $addToSet: { friends: friendRequest.createdBy }
                }
            })
        ])

        return successResponse({ res })
    }


    freezeAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = (req.params as IFreezAccountDto) || {};
        if (!userId && req.user?.role !== RoleEnum.admin) {
            throw new forbiddenException("Not authorized user")
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt: { $exists: false },
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1,
                }
            },
        })

        if (!user.matchedCount) {
            throw new NotfoundException("user not found or failed to delete this account")
        }
        return successResponse({ res })
    }


    restoreAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as IRestoreAccountDto;
        if (!userId && req.user?.role !== RoleEnum.admin) {
            throw new forbiddenException("Not authorized user")
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                freezedBy: { $ne: userId },
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    freezedAt: 1,
                    freezedBy: 1,
                }
            },
        })

        if (!user.matchedCount) {
            throw new NotfoundException("user not found or failed to restore this account")
        }
        return successResponse({ res })
    }


    hardDeleteAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as IHardDeleteAccountDto;
        if (!userId && req.user?.role !== RoleEnum.admin) {
            throw new forbiddenException("Not authorized user")
        }
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            },
        })

        if (!user.deletedCount) {
            throw new NotfoundException("user not found or hard delete this account")
        }
        await deleteFolderByPrifx({ path: `users/${userId}` })
        return successResponse({ res })
    }


    logout = async (req: Request, res: Response): Promise<Response> => {
        const { flag }: IlogoutDto = req.body;
        let statusCode = 200;
        const update: UpdateQuery<IUser> = {}
        switch (flag) {
            case logoutEnum.only:
                update.changeCredentialsTime = new Date();
                break;
                await createRevokeToken(req.decoded as JwtPayload)
            default:

                statusCode = 201
                break;
        }

        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        })
        return res.status(statusCode).json({
            message: 'Done'
        })
    }


    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredential(req.user as HuserDocument)
        await createRevokeToken(req.decoded as JwtPayload)
        return successResponse<ILoginResponce>({ res, statusCode: 201, data: { credentials } })
    }
}




export default new UserService();