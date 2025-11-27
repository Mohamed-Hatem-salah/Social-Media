import { Model } from "mongoose";
import { databaseRepository } from "./database.repository";
import { IComment as TDocument } from "../model";



export class CommentRepository extends databaseRepository<TDocument> {
    constructor(protected override readonly model:Model<TDocument>) {
        super(model);
    }
}