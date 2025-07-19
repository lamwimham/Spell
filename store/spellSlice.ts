// store/spellSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义单个咒语的类型
export type Spell = {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
};

// 定义状态类型
export type SpellState = {
  spells: Spell[];
};

// 初始状态
const initialState: SpellState = {
  spells: [],
};

// 创建 slice
const spellSlice = createSlice({
  name: 'spells',
  initialState,
  reducers: {
    // 添加一个咒语
    addSpell: (state, action: PayloadAction<Spell>) => {
      state.spells.push(action.payload);
    },

    // 删除一个咒语（通过 id）
    deleteSpell: (state, action: PayloadAction<string>) => {
      state.spells = state.spells.filter(spell => spell.id !== action.payload);
    },

    // 更新一个咒语
    updateSpell: (state, action: PayloadAction<Spell>) => {
      const index = state.spells.findIndex(spell => spell.id === action.payload.id);
      if (index !== -1) {
        state.spells[index] = action.payload;
      }
    },

    // 替换所有咒语（可用于从本地存储加载）
    setSpells: (state, action: PayloadAction<Spell[]>) => {
      state.spells = action.payload;
    },

    // 清空所有咒语
    clearSpells: (state) => {
      state.spells = [];
    },
  },
});

// 导出 actions
export const { addSpell, deleteSpell, updateSpell, setSpells, clearSpells } = spellSlice.actions;

// 导出 reducer
export default spellSlice.reducer;