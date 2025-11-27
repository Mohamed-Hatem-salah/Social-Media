import { z } from 'zod';
import { logoutEnum } from '../../utils/security/token.security';
import { Types } from 'mongoose';
import { generalFeilds } from '../../middleware/validation.middleware';
import { RoleEnum } from '../../DB/model';



export const logout = {
    body: z.object({
        flag: z.enum(logoutEnum).default(logoutEnum.only)
    })
}


export const sendFriendRequest = {
    params:z.strictObject({
        userId: generalFeilds.id
    }),
}


export const acceptFriendRequest = {
    params:z.strictObject({
        requesTd: generalFeilds.id
    }),
}


export const changeRole = {
    params: sendFriendRequest.params,
    body: z.strictObject({
        role:z.enum(RoleEnum)
    })
}


export const freezeAccount = {
    params: z.object({
        userId: z.string().optional()
    }).optional().refine(data => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true
    }, { error: "invalid objectId format", path: ['userId'] })
}


export const restoreAccount = {
    params: z.object({
        userId: z.string()
    }).refine(data => {
        return  Types.ObjectId.isValid(data.userId) 
    }, { error: "invalid objectId format", path: ['userId'] })
}


export const hardDelete = restoreAccount;