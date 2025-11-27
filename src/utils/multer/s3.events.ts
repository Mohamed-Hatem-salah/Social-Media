import { EventEmitter } from "node:events"
import { deleteFile, getFile } from "./s3.config";
import { userRepository } from "../../DB/repository/user.repository";
import { HuserDocument, userModel } from "../../DB/model/user.model";
import { UpdateQuery } from "mongoose";

export const s3Event = new EventEmitter({});

s3Event.on("trackProfileImageUpload", (data) => {
    console.log({ data });

    setTimeout(async () => {

        const UserModel = new userRepository(userModel)
        try {
            await getFile({ Key: data.key })
            await UserModel.updateOne({
                filter: { _id: data.userId },
                update: {
                    $unset: { temprofileImage: 1 }
                }
            });

            await deleteFile({Key: data.oldKey})
        } catch (error: any) {

            
            if (error.code === "NoSuchKey") {
                let unsetData: UpdateQuery<HuserDocument> = { temprofileImage: 1 }
                if (!data.oldKey) {
                    unsetData = { temprofileImage: 1 , profileImage:1 };
                }
                await UserModel.updateOne({
                    filter: { _id: data.userId },
                    update: {
                        profileImage: data.oldKey,
                        $unset: unsetData
                    }
                });
            }
        }
    },
        data.expiresIn || Number(process.env.AWS_PRE_SIGNNED_URL_EXPIRES_IN_SECONDS) * 1000);

})