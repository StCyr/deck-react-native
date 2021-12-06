import React, { useState } from 'react';
import { ActionSheetIOS, Pressable, Text, View } from 'react-native';
import { DraxView } from 'react-native-drax';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux'
import { addCard, deleteCard } from '../store/boardSlice';
import { i18n } from '../i18n/i18n.js';
import axios from 'axios';

// A component representing a card in a stack list
const Card = ({card, navigation, route, stackId}) => {

    const [timeoutId, setTimeoutId] = useState(-1);
    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const dispatch = useDispatch()

    // Function to detect long press on card and open a context menu
    function cardPressedDown(cardId) {
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
                        // TODO Makes title editable
                    } else if (buttonIndex === 2) {
                         // Delete card
                        removeCard(cardId)
                    }
                }
            )
        }, 500)
        setTimeoutId(id)
    }

    // Function to delete the card
    function removeCard(cardId) {
        console.log(`deleting card ${cardId}`)
        // Opportunistically deletes card from the store. We'll add it back if deleting it from the server fails.
        dispatch(deleteCard({
            boardId: route.params.boardId,
            stackId,
            cardId,
        }))
        // Deletes card from server
        axios.delete(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${cardId}`,
            {
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

    return (
        <Pressable
            key={card.id}
            onPress={() => {
                // Navigates to the card's details page
                navigation.navigate('CardDetails',{
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
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
                onDragStart={() => cardPressedDown(card.id)}
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
                    <Text 
                        style={[theme.cardTitle, { width: '100%' }]}
                        numberOfLines={1} >
                        {card.title}
                    </Text>
                    <View style={theme.cardLabelContainer} >
                        {card.labels && Object.values(card.labels).map(label => (
                            <View
                                key={label.id}
                                style={[theme.cardLabel, { backgroundColor: '#' + label.color}]} >
                                <Text style={theme.cardLabelText} >
                                    {label.title}
                                </Text>
                            </View>                                                    
                        ))}
                    </View>
                </View>
            </DraxView>
        </Pressable>
    )

}

export default Card