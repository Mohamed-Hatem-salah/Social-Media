import type { NextFunction, Request, Response } from "express"
import type { ZodError, ZodType } from "zod";
import { BadRequistException } from "../utils/response/error.response";
import { z } from "zod";
import { Types } from "mongoose";

type keyReqType = keyof Request
type SchemaType = Partial<Record<keyReqType, ZodType>>
type validationErrorsType = Array<{
    key: keyReqType,
    issues: Array<{
        message: string,
        path: string | number | symbol | undefined
    }>
}>

export const validation = (schema: SchemaType) => {

    return (req: Request, res: Response, next: NextFunction): NextFunction => {

        const validationErrors: validationErrorsType = []

        for (const key of Object.keys(schema) as keyReqType[]) {
            if (!schema[key]) continue;
            if (req.file) {
                req.body.attachment = req.file
            }

            if (req.files) {
                req.body.attachments = req.files
            }

            const validationReult = schema[key].safeParse(req[key]);
            if (!validationReult.success) {
                const error = validationReult.error as ZodError
                validationErrors.push({
                    key,
                    issues: error.issues.map(issue => {
                        return { message: issue.message, path: issue.path[0] }
                    })
                })
            }
        }

        if (validationErrors.length) {
            throw new BadRequistException('Validation Error', {
                validationErrors,
            })
        }

        return next() as unknown as NextFunction
    };
}




export const generalFeilds = {

    username: z.string({
        error: 'Username is required',
    })
        .min(2, { error: 'min user legnth is 2 char' })
        .max(20, { error: 'max user legnth is 20 char' }),
    email: z.email({ error: 'Invalid email address' }),
    otp: z.string().regex(/^\d{6}$/),
    password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: z.string(),

    file: function (mimetype:string[]) {
        return z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimetype),
            buffer: z.any().optional(),
            path: z.string().optional(),
            size: z.number(),
        }).refine(data => {
            return data.buffer || data.path
        }, {error: 'File data is required' , path:['file']});
    },

    id: z.string().refine(data=>{return Types.ObjectId.isValid(data) }, {error:"invalid objectid format" }),
}