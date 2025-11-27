import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as TDocument } from "../model/user.model";
import { databaseRepository } from "./database.repository";
import { BadRequistException } from "../../utils/response/error.response";




export class userRepository extends databaseRepository<TDocument>{
    // create: any;
    
    constructor(protected override readonly model:Model<TDocument>) {
        super(model);
    }

    async createUser({
        data,
        options
    }: {
        data: Partial<TDocument>[],
        options?: CreateOptions
    }): Promise<HydratedDocument<TDocument>> {
        const [user] =  (await this.create({data, options})) || [];
        if (!user){
            throw new BadRequistException('Can not create user');
        }
        return user;
    }
    // create(arg0: { data: Partial<TDocument>[]; options: CreateOptions | undefined; }): [any] | PromiseLike<[any]> {
    //     throw new Error("Method not implemented.");
    // }
}