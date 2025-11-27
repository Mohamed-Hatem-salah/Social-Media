import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IFreindRequest {

    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt?: Date;
    createdAt: Date;
    updatedBy?: Date;
}

export type HFreindRequestDocument = HydratedDocument<IFreindRequest>;

const freindRequestSchema = new Schema<IFreindRequest>({

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,

}, {
    timestamps: true,
    strictQuery: true,
})


freindRequestSchema.pre(["find", "findOne" , "countDocuments"], function (next) {

    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    }else{
        this.setQuery({ ...query, freezedAt: {$exists: null }})
    }
    next()
})



freindRequestSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {

    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    }else{
        this.setQuery({ ...query, freezedAt: {$exists: null }})
    }
    next()
})


export const FreindRequestModel = models.FreindRequest || model<IFreindRequest>("FreindRequest", freindRequestSchema)