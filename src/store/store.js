// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import nodesReducer from "../slices/nodesSlice";
import connectionsReducer from "../slices/connectionsSlice";


export const store = configureStore({
  reducer: {
    nodes: nodesReducer,
    connections: connectionsReducer,
  },
});
