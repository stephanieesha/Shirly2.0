const asynchHandler = require('express-async-handler')
const bycrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/userModel')

const registerUser = asynchHandler(async(req, res) => {
    const {name, email, password} = req.body

    if(!name || !email || !password){
        res.status(400)
        throw new Error('please enter all fields')
    }

    const userExists = await User.findOne({email: email})

    if(userExists){
        res.status(400)
        throw new Error('User already exists')
    }
// hash password
    const salt = await bycrypt.genSalt(10)
    const hashedPassword = await bycrypt.hash(password, salt)

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    })

    if(user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken( user._id),
        })

    }else{
        res.status(400)
        throw new error('Invalid user data');
    }
})

const loginUser = asynchHandler(async(req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({email})

    //check user and password match
    if(user && (await bycrypt.compare(password, user.password))){
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        })
    }else{
        res.status(401)
        throw new Error("Invalid Credentials")
    }
})
const getMe = asynchHandler(async(req, res) => {
    const user = {
        id: req.user_id,
        email: req.user.email,
        name: req.user.name
    }
   res.status(200).json(user)
})

const getUserLists = asynchHandler(async(req, res) => {
    const user = {
        id: req.user_id,
        email: req.user.email,
        name: req.user.name,
        lists: req.params.listId,

    }
   res.status(200).json(user)
})

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}



module.exports = {
    registerUser,
    loginUser,
    getMe
}