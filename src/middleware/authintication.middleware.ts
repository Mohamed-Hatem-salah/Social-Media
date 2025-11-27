import type { Request, Response, NextFunction } from "express"
import { BadRequistException, forbiddenException } from "../utils/response/error.response"
import { decodeToken, TokenEnum } from "../utils/security/token.security"
import { RoleEnum } from "../DB/model/user.model"


export const authentication = (tokenType: TokenEnum = TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        if (!req.headers.authorization) {
            throw new BadRequistException('Validation Error', {
                key: "headers",
                issues: [{ path: "authorization", message: "Missing authorization" }]
            });
        }
        const { decoded, user } = await decodeToken({
            authorization: req.headers.authorization,
            tokenType
        })

        req.user = user;
        req.decoded = decoded;
        next()
    }
}




export const authorization = (accessRoles: RoleEnum[] = [], tokenType: TokenEnum = TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        if (!req.headers.authorization) {
            throw new BadRequistException('Validation Error', {
                key: "headers",
                issues: [{ path: "authorization", message: "Missing authorization" }]
            });
        }
        const { decoded, user } = await decodeToken({
            authorization: req.headers.authorization,
            tokenType
        })

        if (!accessRoles.includes(user.role)) {
            throw new forbiddenException('Not authorized account')
        }

        req.user = user;
        req.decoded = decoded;
        next()
    }
}