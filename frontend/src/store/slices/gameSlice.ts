import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type GameMode = "solo" | "multiplayer";

export type GameState = {
  mode: GameMode;
  timerSeconds: number; // Secondes restantes en mode multijoueur
  isTimerRunning: boolean;
};

const initialState: GameState = {
  mode: "solo",
  timerSeconds: 5,
  isTimerRunning: false,
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.mode = action.payload;
      // Ne pas démarrer le timer ici - il démarre après la première action
      state.timerSeconds = 5;
      state.isTimerRunning = false;
    },
    startTimer: (state) => {
      if (state.mode === "multiplayer") {
        state.timerSeconds = 5;
        state.isTimerRunning = true;
      }
    },
    decrementTimer: (state) => {
      if (state.timerSeconds > 0) {
        state.timerSeconds -= 1;
      }
      if (state.timerSeconds === 0) {
        state.isTimerRunning = false;
      }
    },
    resetTimer: (state) => {
      state.timerSeconds = 5;
      state.isTimerRunning = false;
    },
    stopTimer: (state) => {
      state.isTimerRunning = false;
    },
  },
});

export const gameActions = gameSlice.actions;
export default gameSlice.reducer;
