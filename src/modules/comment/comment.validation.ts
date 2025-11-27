import { z } from 'zod';
import { generalFeilds } from '../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';

export const createComment = {
    params: z.strictObject({postId:generalFeilds.id}),
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFeilds.file(fileValidation.image)).max(2).optional(),
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


export const replyOnComment = {
    params:createComment.params.extend({
        commentId: generalFeilds.id
    }),
    body: createComment.body,

}