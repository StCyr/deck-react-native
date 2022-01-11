import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import AppMenu from './AppMenu'
import LabelList from './LabelList'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { Avatar, Text } from 'react-native-elements'
import { HeaderBackButton } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BouncyCheckbox from "react-native-bouncy-checkbox"
import DateTimePicker from '@react-native-community/datetimepicker'
import axios from 'axios'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import {i18n} from '../i18n/i18n.js'

const CardDetails = () => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const boards = useSelector(state => state.boards)
    const dispatch = useDispatch()

    const navigation = useNavigation()
    const route = useRoute()

    const [card, setCard] = useState({})
    const [cardLabelsBackup, setcardLabelsBackup] = useState([])
    const [editMode, setEditMode] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)

    // ComponentDidMount
    useEffect(() => {
        // Setup page header
        navigation.setOptions({
            headerTitle: i18n.t('cardDetails'),
            headerRight: () => (<AppMenu />),
            headerLeft: () => (
                <HeaderBackButton
                    label = {i18n.t('back')}
                    labelVisible = {true}
                    onPress = {() => {
                        AsyncStorage.removeItem('navigation')
                        navigation.goBack()
                    }}
                />
            )

        })

        // Getting card details from server
        console.log('Getting card details from server')
        axios.get(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token.value
            }
        })
        .then((resp) => {
            // TODO check for error
            const newCard = resp.data
            // Formats card's duedate properly for DateTimePicker
            if (newCard.duedate) {
                newCard.duedate = new Date(newCard.duedate)
                setShowDatePicker(true)
            }
            setCard(newCard)
            setcardLabelsBackup(newCard.labels)
        })
    }, [])

    // Handler to let the LabelList child update the card's labels
    const udpateCardLabelsHandler = (values) => {
        const boardLabels = boards.value[route.params.boardId].labels
        const labels = boardLabels.filter(label => {
            return values.indexOf(label.id) !== -1
        })    
        setCard({
            ...card,
            labels
        })
    }

    // Saves card and its labels
    const saveCard = () => {
        // Adds new labels
        card.labels.forEach(label => {
            if (cardLabelsBackup.every(backupLabel => backupLabel.id !== label.id)) {
                console.log('Adding label', label.id)
                axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/assignLabel`,
                    {labelId: label.id},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token.value
                        }
                    }
                )
            }
        })
        // Removes labels
        cardLabelsBackup.forEach(backupLabel => {
            if (card.labels.every(label => label.id !== backupLabel.id)) {
                console.log('Removing label', backupLabel.id)
                axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/removeLabel`,
                    {labelId: backupLabel.id},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token.value
                        }
                    }
                )
            }
        })
        // Saves card
        axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}`,
            card,
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
            } else {
                console.log('Card saved')
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: {...card, duedate: card.duedate.toString()},
                }))
                navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
            if (error.message === 'Request failed with status code 403') {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: i18n.t('unauthorizedToEditCard'),
                })
            } else {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: error.message,
                })
            }
        })
    }

    return (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            style={[theme.container, {paddingBottom: 40, flex: 1}]}
            contentContainerStyle={{flexGrow: 1}}
        >
            <View style={theme.inputField}>
                <Text h1 h1Style={theme.title}>
                    {i18n.t('title')}
                </Text>
                <TextInput style={editMode ? theme.input : theme.inputReadMode}
                    editable={editMode}
                    value={card.title}
                    onChangeText={title => { setCard({...card, title}) }}
                    placeholder='title'
                />
            </View>
            { editMode &&
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <BouncyCheckbox
                        disableText={true}
                        isChecked={showDatePicker}
                        onPress={(isChecked) => {
                            setShowDatePicker(isChecked)
                            // Sets or delete the card's duedate property
                            const copyOfCard = {...card}
                            if (!isChecked) {
                                delete copyOfCard['duedate']
                            } else {
                                copyOfCard['duedate'] = new Date()
                            }
                            // Updates card
                            setCard(copyOfCard)
                        }}
                    />
                    <Text style={theme.textCheckbox}>
                        {i18n.t('setDueDate')}
                    </Text>
                </View>
            }
            { showDatePicker &&
                <View style={theme.inputField}>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('dueDate')}
                    </Text>
                    { editMode ?
                        <DateTimePicker
                            disabled={!editMode}
                            value={card.duedate ?? new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, newDuedate) => {
                                setCard({...card, duedate: newDuedate})
                            }}
                        />
                    :
                        <Text style={theme.inputReadMode}>
                           {card.duedate?.toLocaleDateString(Localization.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    }
                </View>
            }
            { (card.labels?.length > 0 || editMode) &&
                <View style={{zIndex: 10000}}>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('labels')}
                    </Text>
                    <LabelList
                        editable = {editMode}
                        boardLabels = {boards.value[route.params.boardId].labels}
                        cardLabels = {card.labels}
                        udpateCardLabelsHandler = {udpateCardLabelsHandler} />
                </View>
            }
            { card.assignedUsers?.length > 0 &&
                <View>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('assignees')}
                    </Text>
                    <View style={theme.cardLabelContainer} >
                        {card.assignedUsers.map(user =>
                            <Avatar
                            size={40}
                                rounded
                                source={{uri: server.value + '/index.php/avatar/' + user.participant.uid + '/40?v=2'}}
                                title={user.participant.displayname}
                                key={user.id} />
                        )}
                    </View>
                </View>
            }
            <View keyboardShouldPersistTaps="handled" style={{...theme.inputField, flexGrow: 1}}>
                <Text h1 h1Style={theme.title}>
                    {i18n.t('description')}
                </Text>
                <TextInput style={editMode ? [theme.input, theme.descriptionInput] : [theme.inputReadMode, theme.descriptionInput]}
                    editable={editMode}
                    multiline={true}
                    value={card.description}
                    onChangeText={description => {
                        setCard({...card, description})
                    }}
                    placeholder='description (optional)'
                />
            </View>
            { editMode === false ?
                <Pressable
                    style={theme.button}
                    onPress={() => { setEditMode(true) }} >
                    <Text style={theme.buttonTitle}>
                        {i18n.t('edit')}
                    </Text>
                </Pressable>
            :
                <Pressable style={theme.button}
                    onPress={() => {
                        saveCard()
                    }} >
                    <Text style={theme.buttonTitle}>
                        {i18n.t('save')}
                    </Text>
                </Pressable>
            }
        </ScrollView>
    )
}

export default CardDetails