import { Model } from "mongoose";
import { databaseRepository } from "./database.repository";
import { IFreindRequest as TDocument } from "../model";



export class FreindRequestRepository extends databaseRepository<TDocument> {

    constructor(protected override readonly model: Model<TDocument>) {
        super(model);
    }
}