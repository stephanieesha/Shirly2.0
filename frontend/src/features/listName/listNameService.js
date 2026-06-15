import axios from 'axios'

const API_URL = '/api/lists/'

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
})

const getListNames = async (token) => {
  const response = await axios.get(API_URL, getAuthHeader(token))
  return response.data
}

const getDeletedListNames = async (token) => {
  const response = await axios.get(API_URL + 'bin', getAuthHeader(token))
  return response.data
}

const createListName = async (listNameData, token) => {
  const response = await axios.post(API_URL, listNameData, getAuthHeader(token))
  return response.data
}

const updateListName = async (id, listNameData, token) => {
  const response = await axios.put(API_URL + id, listNameData, getAuthHeader(token))
  return response.data
}

const deleteListName = async (id, token) => {
  const response = await axios.delete(API_URL + id, getAuthHeader(token))
  return response.data
}

const restoreListName = async (id, token) => {
  const response = await axios.patch(API_URL + id + '/restore', {}, getAuthHeader(token))
  return response.data
}

const permanentlyDeleteListName = async (id, token) => {
  const response = await axios.delete(API_URL + id + '/permanent', getAuthHeader(token))
  return response.data
}

const listNameService = { getListNames, getDeletedListNames, createListName, updateListName, deleteListName, restoreListName, permanentlyDeleteListName }

export default listNameService