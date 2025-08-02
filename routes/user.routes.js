//user.routes.js

const express = require('express')
const router = express.Router()
const {body,validationResult} = require('express-validator')
const userModel = require('../models/user.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.get('/test',(req,res)=>{
    res.send('Hello World')
})

router.get('/register',(req,res)=>{
    res.render('register')
})

router.post('/register',
    body('email').trim().isEmail(),
    body('password').isLength({min: 8}),
    body('username').trim().isLength({min:3}),

    async (req,res)=>{

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
            res.send(errors)
        }else{
           
            const {username,email,password} = req.body;

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await userModel.create({
                username,
                email,
                password:hashedPassword
            })

            res.json(newUser)
        }
        
    console.log(req.body)
    
})

router.get('/login',(req,res)=>{
    res.render('login')
})

router.post('/login',
    body('username').trim().isLength({min:3}),
    body('password').isLength({min: 8}),
    async (req,res)=>{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const {username,password} = req.body
        const user = await userModel.findOne({username})
        if(!user){
            return res.status(400).json({message:'Invalid username or password'})
        }

        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({message:'Invalid username or password'})
        }
       
        const token = jwt.sign({
            id:user._id,
            username:user.username
        },process.env.JWT_SECRET,)
        

        res.cookie('token',token);
        res.send('Logged in successfully')
    }
)
module.exports = router