//app.js


const express = require('express')
const app = express()
const userRouter = require('./routes/user.routes')
const indexRouter = require('./routes/index.routes')
const dotenv = require('dotenv')
const cookieParser= require('cookie-parser')
const fileRouter = require('./routes/file.routes');
const session = require('express-session');



dotenv.config()

const connectToDb = require('./config/db')



connectToDb();


app.set('view engine','ejs');
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(session({
  secret: process.env.SESSION_SECRET || 'your secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

app.use('/', fileRouter);
app.use('/',indexRouter)
app.use('/user',userRouter)


app.listen(3000,()=>{
    console.log('Server is running on port 3000')
})