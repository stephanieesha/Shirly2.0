const express = require('express')
const router = express.Router()
const { getListNames, getDeletedListNames, createListName, updateListName, deleteListName, restoreListName, permanentlyDeleteListName } = require('../controllers/listNameController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.route('/').get(getListNames).post(createListName)
router.route('/bin').get(getDeletedListNames)
router.route('/:id').put(updateListName).delete(deleteListName)
router.route('/:id/restore').patch(restoreListName)
router.route('/:id/permanent').delete(permanentlyDeleteListName)

module.exports = router