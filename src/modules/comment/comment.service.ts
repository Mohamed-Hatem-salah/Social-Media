import { Request, Response } from "express"
import { successResponse } from "../../utils/response/success.responce"
import { CommentRepository, postRepository, userRepository } from "../../DB/repository";
import { AllowCommentsEnum, CommentModel, HPostDocument, postModel, userModel } from "../../DB/model";
import { Types } from "mongoose";
import { postAvilability } from "../post";
import { BadRequistException, NotfoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { storageEnum } from "../../utils/multer/cloud.multer";

class CommentService {

    private userModel = new userRepository(userModel)
    private postModel = new postRepository(postModel)
    private commentModel = new CommentRepository(CommentModel)
    constructor() { }

    createComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params as unknown as { postId: Types.ObjectId };
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.allow,
                $or: postAvilability(req)
            },
        });
        if (!post) {
            throw new NotfoundException("Failed to find matching result")

        }

        if (
            req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length
        ) {
            throw new NotfoundException("some of the mentioned users not found");
        }

        let attachments: string[] = [];

        if (req.files?.length) {
            attachments = await uploadFiles({
                storageApproach: storageEnum.memory,
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post${post.assetsFolderId}`,
                useLarge: true
            })
        }

        const [comment] = await this.commentModel.create({
            data: [{
                ...req.body,
                attachments,
                postId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!comment) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequistException("Failed to create this comment");
        }
        return successResponse({ res, statusCode: 201 })
    }

    replyOnComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId , commentId:Types.ObjectId };
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options:{
                populate:[{path:"postId" , match:{
                    allowComments: AllowCommentsEnum.allow,
                    $or: postAvilability(req)
                }}]
            }
        });
        if (!comment?.postId) {
            throw new NotfoundException("Failed to find matching result")

        }

        if (
            req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length
        ) {
            throw new NotfoundException("some of the mentioned users not found");
        }

        let attachments: string[] = [];

        if (req.files?.length) {
            const post = comment.postId as Partial<HPostDocument>
            attachments = await uploadFiles({
                storageApproach: storageEnum.memory,
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post${post.assetsFolderId}`,
                useLarge: true
            })
        }

        const [reply] = await this.commentModel.create({
            data: [{
                ...req.body,
                attachments,
                postId,
                commentId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!reply) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequistException("Failed to create this comment");
        }
        return successResponse({ res, statusCode: 201 })
    }
}
export default new CommentService();