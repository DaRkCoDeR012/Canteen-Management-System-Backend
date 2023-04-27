const router = require('express').Router();
const multer = require('multer');

const Storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req,file,cb) => {
        const unique =  Date.now() + Math.round(Math.random() * 1E9)
        cb(null, unique + file.originalname)
    }
})

const upload = multer({storage: Storage})

router.get('/', (req,res)=>{
    res.send("Upload Image")
})

router.post('/', upload.single('testimg'), (req,res)=>{
    res.send("Photo Uploaded");
})

router.post('/:cid', upload.single('testimg'), (req,res)=>{
    const cid = req.params.cid;
    res.send("Photo Uploaded");
})
