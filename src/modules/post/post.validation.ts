import { z } from 'zod';
import { AllowCommentsEnum, AvilabilityEnum, LikeActionEnum } from '../../DB/model/post.model';
import { generalFeilds } from '../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFeilds.file(fileValidation.image)).max(2).optional(),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        avilability: z.enum(AvilabilityEnum).default(AvilabilityEnum.public),

        tags: z.array(generalFeilds.id).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Either content or attachments must be provided.",
            });
        }

        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated tagged users"
            })
        }
    })
}


export const updatePost = {

    params: z.strictObject({
        postId: generalFeilds.id
    }),

    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        allowComments: z.enum(AllowCommentsEnum).optional(),
        avilability: z.enum(AvilabilityEnum).optional(),

        attachments: z.array(generalFeilds.file(fileValidation.image)).max(2).optional(),

        removedAttachments: z.array(z.string()).max(2).optional(),

        tags: z.array(generalFeilds.id).max(10).optional(),
        removedtags: z.array(generalFeilds.id).max(10).optional(),
    })
        .superRefine((data, ctx) => {
            if (!Object.values(data)?.length) {
                ctx.addIssue({
                    code: "custom",
                    message: "All feilds ar empty",
                });
            }

            if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tagged users"
                })
            }

            if (data.removedtags?.length && data.removedtags.length !== [...new Set(data.removedtags)].length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["removedtags"],
                    message: "Duplicated removedtags users"
                })
            }
        })
}


export const likePost = {
    params: z.strictObject({
        postId: generalFeilds.id
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like)
    })
}