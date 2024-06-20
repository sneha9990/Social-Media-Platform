require('dotenv').config() ;

const express= require('express') ;
const bcrypt= require('bcrypt') ;
const jwt= require('jsonwebtoken') ;
const cors= require('cors') ;
const cookieParser= require('cookie-parser') ;
const path = require('path') ;
const bodyparser = require('body-parser') ;
const http = require('http');
const socketIo = require('socket.io');

const authRouter= require('./routers/authRouter') ;
const postRouter = require('./routers/postRouter');
const myRouter = require('./routers/myRouter');
const auth = require('./middlewares/auth') ; 

const users= require("./models/userModel") ;
const posts= require("./models/postModel") ;
const chat = require("./models/chatModel");


const app=  express() ;
const server = http.createServer(app);
const io = socketIo(server);


const mongoose = require('mongoose');
const url = "mongodb://0.0.0.0:27017" ;
mongoose.connect(url)
.then(()=>{
    console.log("mongodb connected") ;
})
.catch((error)=>{
    console.error("failed to connect", error.message)  ;
})


io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('joinRoom', ({ username, room }) => {
      socket.join(room);
      console.log(`${username} joined room: ${room}`);
    });
  
    socket.on('chatMessage', async ({ room, message, sender }) => {
      const Chat = new chat({
        room,
        message,
        sender,
      });
      await Chat.save();
      io.to(room).emit('message', {
        sender: Chat.sender,
        message: Chat.message
      });
    });
  
    socket.on('disconnect', () => {
      console.log('User has left');
    });
});
  



app.use(express.json()) ;
app.use(cors()) ;
app.use(cookieParser()) ;
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname , './public'))) ;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/dp', express.static(path.join(__dirname, 'dp')));
app.use(bodyparser.json()) ;
app.use(bodyparser.urlencoded({ extended: true }));


app.use('/api',authRouter) ;
app.use('/api',auth, postRouter);
app.use('/api',auth, myRouter);


app.get('/',(req,res)=>{
    res.render('signin') ;
});
app.get('/signup',(req,res)=>{
    res.render('signup') ;
});

app.get('/home/:username', async (req, res) => {
    try {
        const user = await users.findOne({name: req.params.username})
        if (!user) {
            return res.status(404).send('User not found');
        }
        const array = await posts.find().populate('user', 'name') ;
        // const shuffledPosts = shuffle(posts_data);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        res.render('home', { posts: array, user});
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/profile/:username',async(req,res) => {
    try {
        const user = await users.findOne({name: req.params.username})
        if (!user) {
            return res.status(404).send('User not found');
        }
        // console.log(user.name) ;
        const currentUser= req.user ;

        res.render('profile', { user, currentUser : currentUser});
    } catch (err) {
        res.status(500).send(err.message);
    }
}); 




app.post('/',async(req,res)=>{
    try{
        const data={
            email: req.body.email,
            pswd: req.body.pswd
        }
        const check= await users.findOne({email: data.email})
        .populate("followers following", "-pswd") ;
        if(!check)
        return res.status(400).json({msg:"user doesn't exist"}) ;

        const userP= await bcrypt.compare(data.pswd,check.pswd) ; 
        if(!userP)
        return res.status(400).json({msg:"Wrong password"}) ;

        const atk= createAccessToken({id: check._id}) ;
        const rtk= createRefreshToken({id: check._id}) ;

        res.cookie('refreshtoken',rtk,{
            httpOnly: true,
            path: "/api/rtk",
            maxAge: 24*30*60*60*1000
        })

        const token = jwt.sign({ id: check._id, name: check.name }, process.env.ACCESSTOKENSECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.redirect(`/home/${check.name}`);
    } catch(err){
        res.status(500).json({msg:err.message}) ;
    }
});

app.post('/signup',async(req,res)=>{
    try{
        const data={
            name:req.body.name,
            email:req.body.email,
            pswd:req.body.pswd,
            gender:req.body.gender
        }
        const check = await users.findOne({name: data.name}) ;
        if(check){
            return res.status(400).json({msg:"Username already exists"}) ;
        }
        if(data.pswd.length<3){
            return res.status(400).json({msg:"Password must be atleast 3 characters"}) ;
        }
        const pswdHash= await bcrypt.hash(data.pswd,13) ;
        
        const myUser= new users({
            name:data.name, email:data.email, pswd: pswdHash,gender:data.gender 
        })

        console.log(myUser) ;
        await myUser.save() ;

        const atk= createAccessToken({id: myUser._id}) ;
        const rtk= createRefreshToken({id: myUser._id}) ;
        res.cookie('refreshtoken',rtk,{
            httpOnly: true ,
            path: "/api/rtk",
            maxAge: 24*30*60*60*1000
        })
        const token = jwt.sign({ id: myUser._id, name: myUser.name }, process.env.ACCESSTOKENSECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.redirect(`/home/${data.name}`);

    } catch(err){
        console.log(err) ;
        res.status(500).json({msg:err.message}) ;
    }
});








const createAccessToken=(payload) =>{
    return jwt.sign(payload,process.env.ACCESSTOKENSECRET, {expiresIn: "1d"})
}
const createRefreshToken=(payload) =>{
    return jwt.sign(payload,process.env.REFRESHTOKENSECRET, {expiresIn: "30d"})
}


const port= 8000 ;
const localhost = '127.0.0.1' ;

server.listen(port, localhost, () => {
    console.log(`Server Listening At Port ${port}`);
});