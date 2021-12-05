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
			state.value[action.payload.boardId].stacks.find(oneStack => oneStack.id === action.payload.stackId).cards[action.payload.card.id] = action.payload.card
		},
		addLabel: (state, action) => {
			state.value[action.payload.boardId].labels.push(action.payload.label)
		},
		addStack: (state, action) => {
			// Stores stacks in an object where stacks are indexed by their order rather than in an array
			const cards = action.payload.stack.cards
			action.payload.stack.cards = {}
			if (typeof cards !== 'undefined') {
				cards.forEach(card => {
					action.payload.stack.cards[card.order] = card
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
		deleteAllBoards: (state) => {
			state.value = {}
		},
		deleteBoard: (state, action) => {
			delete state.value[action.payload.boardId]
			console.log('Board ' + action.payload.boardId + ' removed from store')
		},
		deleteCard: (state, action) => {
			delete state.value[action.payload.boardId].stacks.find(oneStack => oneStack.id === action.payload.stackId).cards[action.payload.cardId]
		},
		deleteStack: (state, action) => {
			const stackIndex = state.value[action.payload.boardId].stacks.findIndex(stack => stack.id === action.payload.stackId)
			delete state.value[action.payload.boardId].stacks.splice(stackIndex, 1)
		},
		moveCard: (state, action) => {
			const card = state.value[action.payload.boardId].stacks.find(oneStack => oneStack.id === action.payload.oldStackId)?.cards[action.payload.cardId]
			state.value[action.payload.boardId].stacks.find(oneStack => oneStack.id === action.payload.newStackId).cards[action.payload.cardId] = card
			delete state.value[action.payload.boardId].stacks.find(oneStack => oneStack.id === action.payload.oldStackId).cards[action.payload.cardId]
		},
		renameBoard: (state, action) => {
		state.value[action.payload.boardId].title = action.payload.boardTitle
		}
	}
})

export const { addBoard, addCard, addLabel, addStack, deleteAllBoards, deleteBoard, deleteCard, deleteStack, moveCard, renameBoard } = boardSlice.actions

export default boardSlice.reducer
