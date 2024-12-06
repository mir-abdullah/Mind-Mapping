import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    addConnection: (state, action) => {
      state.push(action.payload);
    },
    updateConnection: (state, action) => {
      const index = state.findIndex(
        (conn) => conn.from === action.payload.from && conn.to === action.payload.to
      );
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },
    deleteConnection: (state, action) => {
      return state.filter(
        (conn) => conn.from !== action.payload && conn.to !== action.payload
      );
    },
    setConnections: (state, action) => {
      return action.payload; // Directly sets the connections state
    },
  },
});

export const { addConnection, updateConnection, deleteConnection, setConnections } = connectionsSlice.actions;
export default connectionsSlice.reducer;
