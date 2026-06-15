import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import itemService from './itemService'

const initialState = {
  items: [],
  item: null,
  shoppingList: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
}

export const getItems = createAsyncThunk('items/getAll', async ({ listId, includeDisabled } = {}, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.getItems({ listId, includeDisabled }, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const permanentlyDeleteItem = createAsyncThunk('items/permanentDelete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.permanentlyDeleteItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})


export const getItem = createAsyncThunk('items/getOne', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.getItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const createItem = createAsyncThunk('items/create', async (itemData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.createItem(itemData, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const updateItem = createAsyncThunk('items/update', async ({ id, itemData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.updateItem(id, itemData, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const buyItem = createAsyncThunk('items/buy', async ({ id, itemData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.buyItem(id, itemData, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const skipItem = createAsyncThunk('items/skip', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.skipItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const disableItem = createAsyncThunk('items/disable', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.disableItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const enableItem = createAsyncThunk('items/enable', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.enableItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const deleteItem = createAsyncThunk('items/delete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.deleteItem(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const generateShoppingList = createAsyncThunk('items/generate', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await itemService.generateShoppingList(token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isError = false
      state.isSuccess = false
      state.message = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getItems.pending, (state) => { state.isLoading = true })
      .addCase(getItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.items = action.payload
      })
      .addCase(getItems.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(permanentlyDeleteItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items = state.items.filter((i) => i._id !== action.payload.id)
      })
      .addCase(getItem.fulfilled, (state, action) => {
        state.isLoading = false
        state.item = action.payload
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items.unshift(action.payload)
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items = state.items.map((i) =>
          i._id === action.payload._id ? action.payload : i
        )
      })
      .addCase(buyItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items = state.items.map((i) =>
          i._id === action.payload._id ? action.payload : i
        )
      })
      .addCase(skipItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items = state.items.map((i) =>
          i._id === action.payload._id ? action.payload : i
        )
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.items = state.items.filter((i) => i._id !== action.payload.id)
      })
      .addCase(disableItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.item = action.payload
        state.items = state.items.map((i) =>
          i._id === action.payload._id ? action.payload : i
        )
      })
      .addCase(enableItem.fulfilled, (state, action) => {
        state.isSuccess = true
        state.item = action.payload
        state.items = state.items.map((i) =>
          i._id === action.payload._id ? action.payload : i
        )
      })
      .addCase(generateShoppingList.pending, (state) => { state.isLoading = true })
      .addCase(generateShoppingList.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.shoppingList = action.payload
      })
      .addCase(generateShoppingList.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  },
})

export const { reset } = itemSlice.actions
export default itemSlice.reducer
