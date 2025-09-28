import { Router } from "express";
import { publishAVideo, videoCheck } from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("").get(videoCheck);

router.route("/publish-video").post(verifyJWT, upload.single("video"), publishAVideo)


export default router