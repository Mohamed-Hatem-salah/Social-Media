import multer, { FileFilterCallback } from "multer";
import {v4 as uuid} from "uuid";
import os from "node:os";
import { Request } from 'express';
import { BadRequistException } from "../response/error.response";


export enum storageEnum{
    memory = "memory",
    disk = "disk",
}

export const fileValidation = {
    image: ["image/jpeg", "image/png", "image/gif"]
}

export const cloudFileUpload = ({
    validation =[],
    storageApproach = storageEnum.memory,
    maxSizeMB = 2
}: {
    validation?: string[];
    storageApproach?: storageEnum;
    maxSizeMB?: number;
}): multer.Multer => {

    const storage = storageApproach === storageEnum.memory  
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: os.tmpdir(),
        filename: function (req: Request, file: Express.Multer.File, callBack) {
            callBack(null , `${uuid()}_${file.originalname}`)
        }
    });

    function fileFilter (req: Request, file: Express.Multer.File, callBack: FileFilterCallback) {
        if (!validation.includes(file.mimetype)) {
            return callBack(new BadRequistException('Validation Error', {validationErrors:[{key:"file" , issue:[{path:"file" , message:"Invalid file type"}]}]}));
        }
        return callBack(null, true);
    }
    return multer({ fileFilter , limits: { fileSize: maxSizeMB * 1024 * 1024 } , storage});
}