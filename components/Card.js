import React, { useState } from 'react'
import { ActionSheetIOS, Pressable, Text, TextInput, View } from 'react-native'
import { DraxView } from 'react-native-drax'
import Toast from 'react-native-toast-message'
import { useDispatch, useSelector } from 'react-redux'
import { addCard, deleteCard } from '../store/boardSlice'
import AssigneeList from './AssigneeList'
import LabelList from './LabelList'
import { i18n } from '../i18n/i18n.js'
import axios from 'axios'

// A component representing a card in a stack list
const Card = ({card, navigation, route, stackId}) => {

    const [newCardName, setNewCardName] = useState('')
    const [editMode, setEditMode] = useState(false)
    const [timeoutId, setTimeoutId] = useState(-1);
    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const dispatch = useDispatch()

    // Function to detect long press on card and open a context menu
    function cardPressedDown() {
        // Sets a timeout that will display a context menu if it is not canceled later by a drag of the card
        const id = setTimeout(() => {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [i18n.t("cancel"), i18n.t("rename"), i18n.t("delete")],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                },
                buttonIndex => {
                    if (buttonIndex === 0) {
                        // Cancel action
                    } else if (buttonIndex === 1) {
                        // Makes card's title editable
                        setEditMode(true)
                    } else if (buttonIndex === 2) {
                         // Delete card
                        removeCard()
                    }
                }
            )
        }, 500)
        setTimeoutId(id)
    }

    // Function to delete the card
    function removeCard() {
        console.log(`deleting card ${card.id}`)
        // Opportunistically deletes card from the store. We'll add it back if deleting it from the server fails.
        dispatch(deleteCard({
            boardId: route.params.boardId,
            stackId,
            cardId: card.id,
        }))
        // Deletes card from server
        axios.delete(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${stackId}/cards/${card.id}`,
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId,
                    card,
                }))
                    }
        })
        .catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
           console.log(error)
           dispatch(addCard({
                boardId: route.params.boardId,
                stackId,
                card,
            }))
        })
    }

    // Function to rename a card
    function changeCardTitle() {
        console.log(`Renaming card "${card.title}" to "${newCardName}"`)
        // Changes card title and keep a backup of its name in case something goes wrong
        const oldCardName = card.title
        // Opportunistically replaces card in the store. We'll replace it back if updating it from the server fails.
         dispatch(addCard({
            boardId: route.params.boardId,
            stackId,
            card: {
                ...card,
                ...{
                    title: newCardName
                }
            }
        }))
        // Update the card on the server
        axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${stackId}/cards/${card.id}`,
            {
                ...card,
                ...{
                    title: newCardName
                }
            },
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: stackId,
                    card: {
                        ...card,
                        ...{
                            title: oldCardName
                        }
                    }
                }))
           } else {
                console.log('Card renamed successfully')
                setEditMode(false)
                setNewCardName('')
            }
        })
        .catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
            card.title = oldCardName
            dispatch(addCard({
                boardId: route.params.boardId,
                stackId,
                card: {
                    ...card,
                    ...{
                        title: oldCardName
                    }
                }
            }))
        })
    }

    return (
        <Pressable
            key={card.id}
            onPress={() => {
                // Navigates to the card's details page
                navigation.navigate('CardDetails',{
                    boardId: route.params.boardId,
                    stackId,
                    cardId: card.id
                })
            }} >
            <DraxView
                key={card.id}
                payload={card}
                style={theme.card}
                draggingStyle={{opacity: 0}}
                dragReleasedStyle={{opacity: 0}}
                hoverStyle={[theme.card, {opacity: 0.6, shadowOpacity: 0}]}
                longPressDelay={250}
                onDragStart={() => cardPressedDown()}
                onDrag={({dragTranslation}) => {
                    if((dragTranslation.y > 5 || dragTranslation.y < -5) && timeoutId !== -1) {
                        // if the card was actually moved, cancel opening the context menu
                        clearTimeout(timeoutId)
                        setTimeoutId(-1)
                    }
                }}
                onDragEnd={() => {
                    // Shows selected card's details when the user just clicked the card
                    clearTimeout(timeoutId)
                    setTimeoutId(-1)
                }} >
                <View style={{flex: 1}}>
                     { editMode ?
                        <TextInput style={[theme.inputText, {flexGrow: 1}]}
                        value={newCardName}
                        autoFocus={true}
                        maxLength={100}
                        onBlur={() => {
                            setEditMode(false)
                            setNewCardName('')
                        }}
                        onChangeText={name => {
                            setNewCardName(name)
                        }}
                        onSubmitEditing={() => changeCardTitle()}
                        placeholder={card.title}
                        returnKeyType='send' /> :
                        <Text
                            style={[theme.cardTitle, { width: '100%' }]}
                            numberOfLines={1} >
                            {card.title}
                        </Text>
                    }
                    <View style={{flex:1, flexDirection:'row', justifyContent: 'space-between'}}>
                        <View>
                            <LabelList
                                editable={false}
                                cardLabels={card.labels ?? []}
                                size='small' />
                            <AssigneeList
                                editable={false}
                                cardAssignees = {card.assignedUsers ?? []}
                                size='small'/>
                        </View>
                        { card.duedate &&
                            <View style={{flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                <Text>{new Date(card.duedate).toLocaleDateString()}</Text>
                            </View>
                        }
                    </View>
                </View>
            </DraxView>
        </Pressable>
    )

}

export default Card