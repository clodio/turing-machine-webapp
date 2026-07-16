import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CodeStateValue = "normal" | "greyed" | "outlined";

export type ManualCodeListState = Record<string, CodeStateValue>;

const initialState: ManualCodeListState = {};

const NEXT_STATE: Record<CodeStateValue, CodeStateValue> = {
  normal: "greyed",
  greyed: "outlined",
  outlined: "normal",
};

export const manualCodeListSlice = createSlice({
  name: "manualCodeList",
  initialState,
  reducers: {
    toggleCode: (state, action: PayloadAction<string>) => {
      const code = action.payload;
      const current: CodeStateValue = state[code] ?? "normal";
      state[code] = NEXT_STATE[current];
    },
    setCodeState: (
      state,
      action: PayloadAction<{ code: string; value: CodeStateValue }>
    ) => {
      const { code, value } = action.payload;
      state[code] = value;
    },
    setCodesState: (
      state,
      action: PayloadAction<Record<string, CodeStateValue>>
    ) => {
      for (const [code, value] of Object.entries(action.payload)) {
        state[code] = value;
      }
    },
    reset: () => initialState,
  },
});

export const manualCodeListActions = manualCodeListSlice.actions;
export default manualCodeListSlice.reducer;
