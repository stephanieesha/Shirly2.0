import axios from 'axios'

const API_URL = '/api/items/'

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
})

const getItems = async ({ listId, includeDisabled } = {}, token) => {
  let url = API_URL + '?listId=' + listId
  if (includeDisabled) url += '&includeDisabled=true'
  const response = await axios.get(url, getAuthHeader(token))
  return response.data
}

const getItem = async (id, token) => {
  const response = await axios.get(API_URL + id, getAuthHeader(token))
  return response.data
}

const createItem = async (itemData, token) => {
  const response = await axios.post(API_URL, itemData, getAuthHeader(token))
  return response.data
}

const updateItem = async (id, itemData, token) => {
  const response = await axios.put(API_URL + id, itemData, getAuthHeader(token))
  return response.data
}

const buyItem = async (id, itemData, token) => {
  const response = await axios.post(API_URL + id + '/buy', itemData, getAuthHeader(token))
  return response.data
}

const skipItem = async (id, token) => {
  const response = await axios.post(API_URL + id + '/skip', {}, getAuthHeader(token))
  return response.data
}

const disableItem = async (id, token) => {
  const response = await axios.patch(API_URL + id + '/disable', {}, getAuthHeader(token))
  return response.data
}

const enableItem = async (id, token) => {
  const response = await axios.patch(API_URL + id + '/enable', {}, getAuthHeader(token))
  return response.data
}

const deleteItem = async (id, token) => {
  const response = await axios.delete(API_URL + id, getAuthHeader(token))
  return response.data
}

const generateShoppingList = async (token) => {
  const response = await axios.get(API_URL + 'generate', getAuthHeader(token))
  return response.data
}

const permanentlyDeleteItem = async (id, token) => {
  const response = await axios.delete(API_URL + id + '/permanent', getAuthHeader(token))
  return response.data
}

const itemService = {
  getItems, getItem, createItem, updateItem,
  buyItem, skipItem, disableItem, enableItem,
  deleteItem, generateShoppingList,
  permanentlyDeleteItem
}

export default itemService
