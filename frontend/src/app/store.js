import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import listNameReducer from '../features/listName/listNameSlice'
import itemReducer from '../features/items/itemSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listNames: listNameReducer,
    items: itemReducer,
  },
})