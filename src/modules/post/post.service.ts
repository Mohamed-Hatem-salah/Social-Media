import type { Request, Response } from 'express';
import { successResponse } from '../../utils/response/success.responce';
import { postRepository, userRepository } from '../../DB/repository';
import { AvilabilityEnum, HPostDocument, LikeActionEnum, postModel } from '../../DB/model/post.model';
import { userModel } from '../../DB/model/user.model';
import { BadRequistException, NotfoundException } from '../../utils/response/error.response';
import { deleteFiles, uploadFiles } from '../../utils/multer/s3.config';
import { v4 as uuid } from 'uuid';
import { LikePostQueryInputsDto } from './post.dto';
import { UpdateQuery } from 'mongoose';
import { Types } from 'mongoose';
import { storageEnum } from '../../utils/multer/cloud.multer';


export const postAvilability = (req: Request) => {

    return [
        { availability: AvilabilityEnum.public },
        { availability: AvilabilityEnum.onlyMe, createdBy: req.user?._id },
        { availability: AvilabilityEnum.friends, createdBy: { $in: [...(req.user?.friends || []), req.user?._id] } },
        { availability: { $ne: AvilabilityEnum.onlyMe }, tags: { $in: req.user?._id } },

    ]
}

class PostService {

    private userModal = new userRepository(userModel);
    private postModal = new postRepository(postModel);
    constructor() { }

    createPost = async (req: Request, res: Response): Promise<Response> => {

        if (
            req.body.tags?.length &&
            (await this.userModal.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length
        ) {
            throw new NotfoundException("some of the mentioned users not found");
        }

        let attachments: string[] = [];
        let assetsFolderId: string = uuid()

        if (req.files?.length) {
            attachments = await uploadFiles({
                storageApproach: storageEnum.memory,
                files: req.files as Express.Multer.File[],
                path: `users/${req.user?._id}/post${assetsFolderId}`,
                useLarge: true
            })
        }

        const [post] = await this.postModal.create({
            data: [{
                ...req.body,
                attachments,
                assetsFolderId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!post) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequistException("Failed to create this post");
        }
        return successResponse({ res, statusCode: 201 })
    }

    updatePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId };
        const post = await this.postModal.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id
            }

        })
        if (!post) {
            throw new BadRequistException("Fail to find matching reult")
        }

        if (
            req.body.tags?.length &&
            (await this.userModal.find({ filter: { _id: { $in: req.body.tags, $ne: req.user?._id } } })).length !== req.body.tags.length
        ) {
            throw new NotfoundException("some of the mentioned users not found");
        }

        let attachments: string[] = [];

        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}}/post${post.assetsFolderId}`,
                useLarge: true
            })
        }

        const updatedPost = await this.postModal.updateOne({
            filter: { _id: post._id },
            update: [
                {
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || post.allowComments,
                        avilability: req.body.avilability || post.avilability,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: ["$attachments", req.body.removedAttachments || []]
                                },
                                attachments,
                            ]
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: ["$tags", (req.body.removedtags || []).map((tag: string) => {
                                        return Types.ObjectId.createFromHexString(tag)
                                    })]
                                },
                                (req.body.tags || []).map((tag: string) => {
                                    return Types.ObjectId.createFromHexString(tag)
                                })]
                        }
                    }
                }

                // // $addToSet: { attachments: { $each: attachments || [] }, tags: { $each: req.body.tags || [] } },

            ]
        })


        if (!updatedPost.matchedCount) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequistException("Failed to create this post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await deleteFiles({ urls: req.body.removedAttachments })
            }
        }

        return successResponse({ res })
    }

    likePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params as { postId: string }
        const { action } = req.query as LikePostQueryInputsDto
        let update: UpdateQuery<HPostDocument> = { $addToSet: { likes: req.user?._id } };
        if (action === LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.postModal.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: postAvilability(req),
            },
            update,
        });
        if (!post) {
            throw new NotfoundException("Invalid postid or post not exist");
        }
        return successResponse({ res, statusCode: 200 })
    }

    postList = async (req: Request, res: Response): Promise<Response> => {

        let { page, size } = req.query as unknown as { page: number, size: number }
        const posts = await this.postModal.pageinate({
            filter: {
                $or: postAvilability(req),
            },
            options: {
                populate: [{
                    path: "comments", match: { commentId: { $exists: false }, freezedAt: { $exists: false } },
                    populate: [{
                        path: "reply",
                        match: {
                            commentId: { $exists: false }, freezedAt: { $exists: false }
                        },
                        populate: [{
                            path: "comments", match: { commentId: { $exists: false }, freezedAt: { $exists: false } },
                            populate: [{
                                path: "reply",
                                match: {
                                    commentId: { $exists: false }, freezedAt: { $exists: false }
                                }
                            }]
                        }]
                    }]
                }]
            },
            page,
            size,
        });

        return successResponse({ res, data: { posts } })
    }
}


export const postService = new PostService();

