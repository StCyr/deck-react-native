import { createSlice } from '@reduxjs/toolkit'

export const boardSlice = createSlice({
  name: 'boards',
  initialState: {
    value: {},
  },
  reducers: {
    addBoard: (state, action) => {
      state.value[action.payload.id] = action.payload
    },
    addCard: (state, action) => {
      state.value[action.payload.boardId].stacks[action.payload.stackId].cards[action.payload.card.id] = action.payload.card
    },
    addStack: (state, action) => {
      // Stores cards in an object where cards are indexed by their id rather than in an array
      const cards = action.payload.stack.cards
      action.payload.stack.cards = {}
      if (typeof cards !== 'undefined') {
        cards.forEach(card => {
          action.payload.stack.cards[card.id] = card
        })
      }
      // Filter out existing stack with same id
      if (state.value[action.payload.boardId].stacks?.length) {
        state.value[action.payload.boardId].stacks = state.value[action.payload.boardId].stacks.filter(oneStack => oneStack.id !== action.payload.stack.id)
      } else {
        // Prepare empty stack array
        state.value[action.payload.boardId].stacks = [];
      }
      // Adds stack
      state.value[action.payload.boardId].stacks.push(action.payload.stack)
      // Sort stacks by order
      state.value[action.payload.boardId].stacks.sort((a, b) => a.order - b.order)

      return state
    },
    deleteAllBoards: (state, action) => {
      state.value = {}
    },
    deleteCard: (state, action) => {
      delete state.value[action.payload.boardId].stacks[action.payload.stackId].cards[action.payload.cardId]
    },
    moveCard: (state, action) => {
      const card = state.value[action.payload.boardId].stacks[action.payload.oldStackId].cards[action.payload.cardId]
      state.value[action.payload.boardId].stacks[action.payload.newStackId].cards[action.payload.cardId] = card
      delete state.value[action.payload.boardId].stacks[action.payload.oldStackId].cards[action.payload.cardId]
    },
  }
})

export const { addBoard, addCard, addStack, deleteAllBoards, deleteCard, moveCard } = boardSlice.actions

export default boardSlice.reducer