import { JwtPayload } from "jsonwebtoken";
import { HuserDocument } from "../../DB/model/user.model";


declare module "express-serve-static-core" {
    interface Request {
        user?: HuserDocument
        decoded?: JwtPayload


    }
}