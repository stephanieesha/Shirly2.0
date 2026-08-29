import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import listNameService from './listNameService'

const initialState = {
  listNames: [],
  deletedListNames: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
}

export const getListNames = createAsyncThunk('listNames/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.getListNames(token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const getDeletedListNames = createAsyncThunk('listNames/getDeleted', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.getDeletedListNames(token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const createListName = createAsyncThunk('listNames/create', async (listNameData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.createListName(listNameData, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const updateListName = createAsyncThunk('listNames/update', async ({ id, listNameData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.updateListName(id, listNameData, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const deleteListName = createAsyncThunk('listNames/delete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.deleteListName(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const restoreListName = createAsyncThunk('listNames/restore', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.restoreListName(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})

export const permanentlyDeleteListName = createAsyncThunk('listNames/permanentDelete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token
    return await listNameService.permanentlyDeleteListName(id, token)
  } catch (error) {
    const message = error.response?.data?.message || error.message
    return thunkAPI.rejectWithValue(message)
  }
})


const listNameSlice = createSlice({
  name: 'listNames',
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
      .addCase(getListNames.pending, (state) => { state.isLoading = true })
      .addCase(getListNames.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.listNames = action.payload
      })
      .addCase(getListNames.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getDeletedListNames.pending, (state) => { state.isLoading = true })
      .addCase(getDeletedListNames.fulfilled, (state, action) => {
        state.isLoading = false
        state.deletedListNames = action.payload
      })
      .addCase(getDeletedListNames.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(createListName.fulfilled, (state, action) => {
        state.isSuccess = true
        if (action.payload && action.payload._id) {
          state.listNames.unshift(action.payload)
        }
      })
      .addCase(createListName.rejected, (state, action) => {
        state.isError = true
        state.message = action.payload
      })
      .addCase(updateListName.fulfilled, (state, action) => {
        state.isSuccess = true
        state.listNames = state.listNames.map((l) =>
          l._id === action.payload._id ? action.payload : l
        )
      })
      .addCase(deleteListName.fulfilled, (state, action) => {
        state.isSuccess = true
        state.listNames = state.listNames.filter((l) => l._id !== action.payload.id)
      })
      .addCase(restoreListName.fulfilled, (state, action) => {
        state.isSuccess = true
        state.deletedListNames = state.deletedListNames.filter((l) => l._id !== action.payload._id)
        state.listNames.unshift(action.payload)
      })
      .addCase(permanentlyDeleteListName.fulfilled, (state, action) => {
      state.isSuccess = true
      state.deletedListNames = state.deletedListNames.filter((l) => l._id !== action.payload.id)
      })
  },
})

export const { reset } = listNameSlice.actions
export default listNameSlice.reducer
