const express = require('express')
const router = express.Router()
const {
  getItems, getItem, createItem, updateItem, buyItem,
  deleteItem, generateShoppingList, skipItem, disableItem, enableItem,
  permanentlyDeleteItem
} = require('../controllers/itemController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.get('/generate', generateShoppingList)
router.route('/').get(getItems).post(createItem)
router.route('/:id').get(getItem).put(updateItem).delete(deleteItem)
router.post('/:id/buy', buyItem)
router.post('/:id/skip', skipItem)
router.patch('/:id/disable', disableItem)
router.patch('/:id/enable', enableItem)
router.delete('/:id/permanent', permanentlyDeleteItem)

module.exports = router