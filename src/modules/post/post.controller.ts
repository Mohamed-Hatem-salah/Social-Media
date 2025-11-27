import { authentication } from "../../middleware/authintication.middleware";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";
import {postService} from "./post.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { Router } from "express";
import { commentRouter } from "../comment";


const router = Router()

router.use("/:postId/comment" , commentRouter)

router.get("/",
    authentication(),
    postService.postList)


router.post("/",
    authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createPost),
    postService.createPost)


router.patch("/:postId",
    authentication(),
    validation(validators.likePost),
    postService.likePost)


router.patch("/:postId/like",
    authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.updatePost),
    postService.updatePost)

export default router