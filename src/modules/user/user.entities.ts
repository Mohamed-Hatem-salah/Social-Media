import { HuserDocument } from "../../DB/model/user.model";

export interface IProfileImageResponce {
    url: string
}


export interface IUserResponce {
    user: Partial<HuserDocument>
}