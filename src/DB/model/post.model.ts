import { HydratedDocument, model, models, Schema, Types } from "mongoose";


export enum AllowCommentsEnum {
    allow = "allow",
    deny = "deny"
}


export enum AvilabilityEnum {
    public = "public",
    friends = "friends",
    onlyMe = "only-me"
}


export enum LikeActionEnum {
    like = "like",
    unlike = "unlike",
}


export interface IPost {
    content?: string;
    attachments?: string[];
    assetsFolderId: string;


    allowComments: AllowCommentsEnum;
    avilability: AvilabilityEnum;

    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];

    createdBy: Types.ObjectId;

    freezedAt?: Date;
    freezedBy?: Types.ObjectId;

    restoredAt?: Date;
    restoredBy?: Types.ObjectId;

    createdAt?: Date;
    updatedBy?: Date;
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>({
    content: {
        type: String, minlength: 2, maxlegnth: 500000, requierd: function () {
            return !this.attachments?.length
        }
    },
    attachments: [String],
    assetsFolderId: { type: String, required: true },


    avilability: { type: String, enum: AvilabilityEnum, default: AvilabilityEnum.public },
    allowComments: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // except: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // only: [{ type: Schema.Types.ObjectId, ref: "User" }],

    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})

postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: null } })
    }
    next()
})


postSchema.pre(["find", "findOne" , "countDocuments"], function (next) {

    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    }else{
        this.setQuery({ ...query, freezedAt: {$exists: null }})
    }
    next()
})



postSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {

    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    }else{
        this.setQuery({ ...query, freezedAt: {$exists: null }})
    }
    next()
})


// postSchema._id = commentSchema.postId;
postSchema.virtual("comments" , {
    localField:"_id",
    foreignField:"postId",
    ref:"Comment",
    justOne: true
})

export const postModel = models.post || model<IPost>("post", postSchema)