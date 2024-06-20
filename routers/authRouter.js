const users= require("../models/userModel") ;
const bcrypt= require('bcrypt') ;
const jwt= require('jsonwebtoken') ;
const router= require('express').Router() ;
const multer = require('multer');
const path = require('path');
const fs = require('fs');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './dp/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Rename the uploaded file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });




router.post('/signout',async(req,res)=>{
    try{
        res.clearCookie('refreshtoken', {path:'/api/rtk'})
        res.json({msg:'logged out'}) ;
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});


router.post('/profile/:username', upload.single('profileImage') ,async(req,res)=>{
    try{
        const { email, password, address, phone, gender, about } = req.body;
        const user = await users.findOne({name: req.params.username});
        if (!user) {
            return res.status(404).send('users not found');
        }
        user.email = email;
        if (password) {
            user.pswd = await bcrypt.hash(password, 13) ;
        }
        user.addr = address;
        user.phone = phone;
        user.gender = gender;
        user.about = about;
        user.dp=req.file ? `/dp/${req.file.filename}` : null 

        await user.save();
        // return res.status(200).send(`Successfully updated profile of ${user.name}`);
        res.redirect(`/api/profile/${user.name}?updated=true`);
        // res.redirect(`/api/profile/${user.name}`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});




router.post('/rtk',async(req,res)=>{
    try{
        const rf_t= req.cookies.refreshtoken ;
        if(!rf_t)
        return res.status(400).json({msg:"Refresh token required"})

        jwt.verify(rf_t, process.env.REFRESHTOKENSECRET,async(err,result)=>{
            if(err) return res.status(400).json({msg:"no"}) ;
            const check= await users.findById(result.id).select("-pswd")
            .populate("followers following") ;
            if(!check)
            return res.status(400).json({msg:"user doesn't exist"}) ;

            const ac_t=  createAccessToken({id: result.id}) ;

            res.json({
                ac_t,
                check
            })
        })
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});



const createAccessToken=(payload) =>{
    return jwt.sign(payload,process.env.ACCESSTOKENSECRET, {expiresIn: "1d"})
}
const createRefreshToken=(payload) =>{
    return jwt.sign(payload,process.env.REFRESHTOKENSECRET, {expiresIn: "30d"})
}

module.exports= router ;