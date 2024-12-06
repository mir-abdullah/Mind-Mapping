import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const nodesSlice = createSlice({
  name: "nodes",
  initialState,
  reducers: {
    addNode: (state, action) => {
      state.push(action.payload);
    },
    updateNode: (state, action) => {
      const index = state.findIndex((node) => node.id === action.payload.id);
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },
    deleteNode: (state, action) => {
      return state.filter((node) => node.id !== action.payload);
    },
    setNodes: (state, action) => {
      return action.payload; // Directly sets the nodes state
    },
  },
});

export const { addNode, updateNode, deleteNode, setNodes } = nodesSlice.actions;
export default nodesSlice.reducer;
