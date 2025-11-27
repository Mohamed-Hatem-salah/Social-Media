import { Model } from "mongoose";
import { databaseRepository } from "./database.repository";
import { IToken as TDocument } from "../model/token.model";

export class tokenRepository extends databaseRepository<TDocument> {
    constructor(protected override readonly model: Model<TDocument>) {
        super(model);
    }
}