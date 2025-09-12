import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) //we can use unique or nano id
        cb(null, file.originalname) //many options inside this file
    }
})

export const upload = multer({
    // storage: storage,
    storage
})