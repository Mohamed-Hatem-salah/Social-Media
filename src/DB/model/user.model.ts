import { model, models, Schema, HydratedDocument, Types } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.event";


export enum GenderEnum {
    male = "male",
    female = "female",
}

export enum RoleEnum {
    user = "user",
    admin = "admin",
    superAdmin = "super-admin",
}


export enum providerEnum {
    GOOGLE = "GOOGLE",
    SYSTEM = "SYSTEM",
}


export interface IUser {

    slug: string;
    firstName: string;
    lastName: string;
    username?: string;

    email: string;
    confrimEmailOtp?: string;
    confirmedAt?: Date;

    password: string;
    resetPasswordOtp?: string;
    changeCredentialsTime: Date;

    phone?: string;
    address?: string;
    profileImage?: string;
    temprofileImage?: string;
    coverImages?: string[];

    gender: GenderEnum;
    role: RoleEnum;
    provider: providerEnum;

    freezedAt?: Date;
    freezedBy?: Types.ObjectId;
    restoredAt?: Date;
    restoredBy?: Types.ObjectId;
    friends?: Types.ObjectId[];

    updatedAt?: Date;
    createdAt: Date;

}

const userSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true, minlength: 2, maxlength: 25 },
        lastName: { type: String, required: true, minlength: 2, maxlength: 25 },
        slug: { type: String, required: true, minlength: 5, maxlength: 51 },

        email: { type: String, required: true, unique: true },
        confrimEmailOtp: { type: String },
        confirmedAt: { type: Date },

        password: {
            type: String, required: function (this: IUser) {
                return this.provider === providerEnum.GOOGLE ? false : true;
            }
        },
        resetPasswordOtp: { type: String },
        changeCredentialsTime: { type: Date },

        phone: { type: String },
        address: { type: String },

        profileImage: String,
        temprofileImage: String,
        coverImages: [String],

        gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
        role: { type: String, enum: RoleEnum, default: RoleEnum.user },

        freezedAt: Date,
        freezedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        restoredAt: Date,
        restoredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],

        provider: { type: String, enum: providerEnum, default: providerEnum.SYSTEM },

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    });

userSchema
    .virtual("username")
    .set(function (value: string) {
        const [firstName, lastName] = value.split(" ") || [];
        this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
    })
    .get(function () {
        return this.firstName + " " + this.lastName;
    });

userSchema.pre("save", async function (this: HuserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string }, next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await generateHash(this.password)
    }
    if (this.isModified("confrimEmailOtp")) {
        this.confirmEmailPlainOtp = this.confrimEmailOtp as string
        this.confrimEmailOtp = await generateHash(this.confrimEmailOtp as string)
    }
    next();
})


userSchema.post("save", async function (doc, next) {
    const that = this as HuserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string };
    if (that.wasNew && that.confirmEmailPlainOtp) {
        emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp })

    }
    next()
})

userSchema.pre(["find", "findOne"], function (next) {

    const query = this.getQuery();
    if (query.pranoid === false) {
        this.setQuery({ ...query })
    }else{
        this.setQuery({ ...query, freezedAt: {$exists: null }})
    }
    next()
})

export const userModel = models.user || model<IUser>("user", userSchema);
export type HuserDocument = HydratedDocument<IUser>;
