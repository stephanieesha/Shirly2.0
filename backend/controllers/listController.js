const asyncHandler = require('express-async-handler')

const User = require('../models/userModel')
const List = require('../models/tableModel')
const ListName = require('../models/listNameModel')
const LastBought = require('../models/lastBoughtModel')
const ShoppingHistory = require('../models/shoppingHistory')
const moment= require('moment') 
const _ = require("lodash");

const getUserLists = asyncHandler(async(req, res) => {
    const lists = await List.find({ user: req.user._id })
    res.status(200).json(lists)
})

const updateUserLists = asyncHandler(async(req, res) => {
    // const lists = await List.find({ user: req.user_id })
    const updatedUserItem = await List.findByIdAndUpdate(
        req.params.id, 
        req.body,
    )
    res.status(200).json(updatedUserItem)
})


const getUserList = asyncHandler(async(req, res) => {
    const list = await List.findById(req.params.id )
    res.status(200).json(list)
    res.status(200).json(list)
})
let shoppingLists = []



const getUserShoppingList = asyncHandler(async(req, res) => {
    const oneDayBack = moment(new Date()).subtract(0, 'days').format('YYYY-MM-DD')
    const twoDaysBack = moment(new Date()).subtract(2, 'days').format('YYYY-MM-DD')
    const threeDaysBack = moment(new Date()).subtract(3, 'days').format('YYYY-MM-DD')
    const oneWeekBack = moment(new Date()).subtract(1, 'weeks').format('YYYY-MM-DD')
    const twoWeeksBack = moment(new Date()).subtract(2, 'weeks').format('YYYY-MM-DD')
    const oneMonthBack = moment(new Date()).subtract(1, 'months').format('YYYY-MM-DD')
    const twoMonthsback = moment(new Date()).subtract(2, 'months').format('YYYY-MM-DD')
    const threeMonthsback = moment(new Date()).subtract(3, 'months').format('YYYY-MM-DD')
    const sixMonthsback = moment(new Date()).subtract(6, 'months').format('YYYY-MM-DD')
    const oneYearBack = moment(new Date()).subtract(1, 'years').format('YYYY-MM-DD')

   const Everyday = await List.find({ user: req.user._id  , "frequency": 'Everyday', $or: [{"boughtAt.updatedAt" : { $lte : new Date(oneDayBack)}},{"updatedAt" :{$lte: new Date(oneDayBack)}}]})
   const Every2days = await List.find({ user: req.user._id , "frequency": 'Every 2 days', $or: [{"boughtAt.updatedAt" : { $lte : new Date(twoDaysBack)}},{"updatedAt" :{$lte: new Date(twoDaysBack)}}]})
   const Every3days = await List.find({ user: req.user._id , "frequency": 'Every 3 days', $or: [{"boughtAt.updatedAt" : { $lte : new Date(threeDaysBack)}},{"updatedAt" :{$lte: new Date(threeDaysBack)}}]})
   const Weekly = await List.find({ user: req.user._id , "frequency": 'Weekly', $or: [{"boughtAt.updatedAt" : { $lte : new Date(oneWeekBack)}},{"updatedAt" :{$lte: new Date(oneWeekBack)}}]})
   const Every2weeks = await List.find({ user: req.user._id , "frequency": 'Every 2 weeks', $or: [{"boughtAt.updatedAt" : { $lte : new Date(twoWeeksBack)}},{"updatedAt" :{$lte: new Date(twoWeeksBack)}}]})
   const Monthly = await List.find({ user: req.user._id , "frequency": 'Monthly', $or: [{"boughtAt.updatedAt" : { $lte : new Date(oneMonthBack)}},{"updatedAt" :{$lte: new Date(oneMonthBack)}}]})
   const Every2months = await List.find({ user: req.user._id , "frequency": 'Every 2 months', $or: [{"boughtAt.updatedAt" : { $lte : new Date(twoMonthsback)}},{"updatedAt" :{$lte: new Date(twoMonthsback)}}]})
   const Every3months = await List.find({ user: req.user._id , "frequency": 'Every 3 months', $or: [{"boughtAt.updatedAt" : { $lte : new Date(threeMonthsback)}},{"updatedAt" :{$lte: new Date(threeMonthsback)}}]})
   const Every6months = await List.find({ user: req.user._id , "frequency": 'Every 6 months', $or: [{"boughtAt.updatedAt" : { $lte : new Date(sixMonthsback)}},{"updatedAt" :{$lte: new Date(sixMonthsback)}}]})
   const Yearly = await List.find({ user: req.user._id , "frequency": 'Yearly', $or: [{"boughtAt.updatedAt" : { $lte : new Date(oneYearBack)}},{"updatedAt" :{$lte: new Date(oneYearBack)}}]})

   shoppingLists = [Everyday, Every2days, Every3days, Weekly, Every2weeks, Monthly, Every2months, Every3months, Every6months, Yearly]
   

    res.status(200).json(shoppingLists.flat())

  await List.updateMany({ user: req.user_id , "frequency": 'Everyday', "updatedAt" : { $lte : new Date(oneDayBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 2 days', "updatedAt" : { $lte : new Date(twoDaysBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 3 days', "updatedAt" : { $lte : new Date(threeDaysBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Weekly', "updatedAt" : { $lte : new Date(oneWeekBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 2 weeks', "updatedAt" : { $lte : new Date(twoWeeksBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Monthly', "updatedAt" : { $lte : new Date(oneMonthBack) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 2 months', "updatedAt" : { $lte : new Date(twoMonthsback) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 3 months', "updatedAt" : { $lte : new Date(threeMonthsback) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Every 6 months', "updatedAt" : { $lte : new Date(sixMonthsback) }}, {"$set":{"shoppingInProgress": true}})
  await List.updateMany({ user: req.user_id , "frequency": 'Yearly', "updatedAt" : { $lte : new Date(oneYearBack) }}, {"$set":{"shoppingInProgress": true}})

})

const getLists = asyncHandler(async(req, res) => {
    const lists = await List.find({ listName: req.params.listNameId })
    res.status(200).json(lists)
})

//get request
const getList = asyncHandler(async(req, res) => {
    const list = await List.findById(req.params.id )
    res.status(200).json(list)
})

//post request
const createList = asyncHandler(async(req, res) => {
    const listName = await ListName.findById(req.params.listNameId)

    if (listName.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
      }

      const list = await List.create({
        listName: req.params.listNameId,
        user: req.user.id,
        name :_.startCase(req.body.name),
        ...(req.body.brand == '' ? {brand: ' '} : {brand: req.body.brand}),
        ...(req.body.comment == '' ? {comment: ' '} : {comment: req.body.comment}),
        ...(req.body.unitPrice == '' ? {unitPrice: ' '} : {unitPrice: Number(req.body.unitPrice)}),
        ...(req.body.unitPrice && req.body.quantity == ' ' ? {price: ' '} : {price: Number(req.body.unitPrice * req.body.quantity)}),
        ...(req.body.quantity == '' ? {quantity: ' '} : {quantity: Number(req.body.quantity)}),
        ...(req.body.frequency == '' ? {frequency: ' '} : {frequency: req.body.frequency}),
        ...(req.body.boughtAt == '' ? {boughtAt: ' '} : {boughtAt: req.body.boughtAt}),
      })
    
      res.status(200).json(list)
      return list

})


//delete request
const deleteList = asyncHandler(async(req, res) => {
    const list = await List.findById(req.params.id )
    await list.deleteOne({ id: req.params.id });
    res.status(200).json({success:true})
})

//delete request
const deleteListNameLists = asyncHandler(async(req, res) => {
    await List.deleteMany({ listName: req.params.listNameId })
    res.status(200).json({success:true})
})

//put request
const updateList = asyncHandler(async(req, res) => {
    const updatedItem = await List.findByIdAndUpdate(
        req.params.id, 
        req.body,
    )
    res.status(200).json(updatedItem)
})

const getListNames = asyncHandler(async(req, res) => {
    const listNames = await ListName.find({user:req.user.id})
    if(!listNames){
        res.status(401)
        throw new Error('User not found')
    }
    res.status(200).json(listNames)
})

//get request
const getListName = asyncHandler(async(req, res) => {
    
    const listName = await ListName.findById(req.params.id)
    
    if(!listName){
        res.status(401)
        throw new Error('User not found')
    }
    res.status(200).json(listName)
})

//post request
const createListName = asyncHandler(async(req, res) => {
    const listName = await ListName.create({
        ItemName:_.startCase(req.body.ItemName),
        user: req.user.id,
    })
    res.status(201).json(listName)
})

//delete request
const deleteListName = asyncHandler(async(req, res) => {
   const listName = await ListName.findById(req.params.id)
   await List.deleteMany({ listName: req.params.id })
   await listName.deleteOne({ id: req.params.id });
    res.status(200).json({success:true})
})

//put request
const updateListName = asyncHandler(async(req, res) => {
    const updatedItem = await ListName.findByIdAndUpdate(
        req.params.id, 
        {ItemName:_.startCase(req.body.ItemName)},
        {new: true})
    res.status(200).json(updatedItem)
})

const createLastBought = asyncHandler(async(req, res) => {
    const set = {'updatedAt': new Date()}
    const updatedItem = await List.findByIdAndUpdate(
        req.params.id,  
        {
        listName: req.params.listNameId,
        user: req.user.id,
        brand:req.body.brand,
        unitPrice: req.body.unitPrice,
        quantity:req.body.quantity,
        price: req.body.unitPrice * req.body.quantity,
        frequency:req.body.frequency,
        comment:req.body.comment,
        $push: { boughtAt: set} 
    }
    )
    res.status(200).json(updatedItem)
    const list = await List.findById(req.params.id )
    res.status(200).json(list)
})

const geAlltListNames =  asyncHandler(async(req, res) => {
const lists = await List.find({ listName: req.params.id })
const ors = [...lists]
const z = await ors.reduce((n, {totalSpent}) => n+ totalSpent, 0)
res.status(200).json(z)
    
})

const updateAll = asyncHandler(async(req, res) => {
    const data = await req.body
    await ShoppingHistory.create({
        shoppingHistories: data,
        user: req.user.id,
    })
    const i = await data.map(doc => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: 
                        { 
                            name: doc.name, 
                            listName:doc.listName, 
                            brand: doc.brand, 
                            unitPrice: doc.unitPrice, 
                            quantity: doc.quantity,
                            price: doc.price,
                            frequency: doc.frequency,
                            comment: doc.comment ,
                            shoppingInProgress: false,
                            totalSpent: doc.boughtAt.reduce((n, {price}) => n+ price, 0) + doc.price

                        },
                        $push: { 
                            boughtAt: {$each:
                            [{
                                updatedAt: new Date(),
                                name: doc.name,
                                brand:  doc.brand,
                                unitPrice:  doc.unitPrice,
                                quantity: doc.quantity,
                                price:  doc.price,
                                frequency:  doc.frequency,
                                comment:  doc.comment
                            }] ,$position: 0}}  
                    },
            upsert: true,
        }
    }))

// const z = await data.reduce((n, {price}) => n+ price, 0)

    
// const listNames = await ListName.find({user:req.user.id})
    
// const ors = [...listNames]
// let o = ors.map(a => a._id)

return List.bulkWrite(i)
.then(results => res.json(results))
.catch(err => next(err));
})

const getShoppingHistories = asyncHandler(async(req, res) => {
    const shoppingHistories = await ShoppingHistory.find({ user: req.user_id })
    res.status(200).json(shoppingHistories)
})

const updateLastBought = asyncHandler(async(req, res) => {
    const setBought = {'updatedAt': new Date()}
    await List.updateMany({ "shoppingInProgress": true}, 
        {
            "$set":{
                shoppingInProgress: false,
            }, 
            $push: { boughtAt: {$each: [setBought],$position: 0}}
        })
   res.status(200).json({success:true})


})

module.exports = {
    getUserLists,
    getUserShoppingList,
    getLists,
    getList,
    createList,
    deleteList,
    updateList,
    getListNames,
    getListName,
    createListName,
    deleteListName,
    updateListName,
    deleteListNameLists,
    createLastBought,
    updateLastBought,
    updateUserLists,
    getUserList,
    updateAll,
    getShoppingHistories,
    geAlltListNames
}