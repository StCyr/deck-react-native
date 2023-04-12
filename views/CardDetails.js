import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import AppMenu from '../components/AppMenu'
import AssigneeList from '../components/AssigneeList'
import AttachmentPanel from '../components/AttachmentPanel'
import CommentPanel from '../components/CommentPanel'
import LabelList from '../components/LabelList'
import Spinner from '../components/Spinner'
import { canUserEditBoard, fetchAttachments, getAttachmentURI, getUserDetails } from '../utils'
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native'
import { Text } from 'react-native-elements'
import { HeaderBackButton } from '@react-navigation/elements'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BouncyCheckbox from "react-native-bouncy-checkbox"
import DateTimePicker from '@react-native-community/datetimepicker'
import Markdown from 'react-native-markdown-package'
import axios from 'axios'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import {i18n} from '../i18n/i18n.js'
import {decode as atob} from 'base-64';
import { FloatingAction } from "react-native-floating-action";
import * as MailComposer from 'expo-mail-composer';

// The detailed view of a card, showing all card's information
const CardDetails = () => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const boards = useSelector(state => state.boards)
    const dispatch = useDispatch()

    const navigation = useNavigation()
    const route = useRoute()

    let user = {}
    user.id = atob(token.value.substring(6)).split(':')[0]

    const [busy, setBusy] = useState(false)
    const [card, setCard] = useState({})
    const [cardAssigneesBackup, setcardAssigneesBackup] = useState([])
    const [cardLabelsBackup, setcardLabelsBackup] = useState([])
    const [editMode, setEditMode] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)

    // Can the user edit the card?
    getUserDetails(user.id, server, token.value).then( details => {
        user = details
        user.canEditBoard = canUserEditBoard(user,boards.value[route.params.boardId])
    })

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

        // Gets card from store
        console.log('Loading card from store')
        const cardFromStore = boards.value[route.params.boardId].stacks.find(oneStack => oneStack.id === route.params.stackId).cards[route.params.cardId]

        // Formats duedate properly for DateTimePicker and makes sure the component will show it in edit mode
        if (cardFromStore.duedate !== null) {
            cardFromStore.duedate = new Date(cardFromStore.duedate)
            setShowDatePicker(true)
        }

        // Saves card in local state
        console.log('Card retrieved from store. Updating frontend')
        setCard(cardFromStore)

        // Remembers current card labels and assignees in case we change them 
        setcardLabelsBackup(cardFromStore.labels)
        setcardAssigneesBackup(cardFromStore.assignedUsers)

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

    // Handler to let the AssigneeList child update the card's assigned users
    const udpateCardAsigneesHandler = (values) => {
        const boardUsers = boards.value[route.params.boardId].users
        const assignedUsers = boardUsers.filter(user => {
            return values.indexOf(user.uid) !== -1
        }).map(user => { return {participant: user} })
        setCard({
            ...card,
            assignedUsers
        })
    }

    // Saves card and its labels
    const saveCard = () => {
        setBusy(true)
        // Adds new labels
        card.labels.forEach(label => {
            if (cardLabelsBackup.every(backupLabel => backupLabel.id !== label.id)) {
                console.log('Adding label', label.id)
                axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/assignLabel`,
                    {labelId: label.id},
                    {
                        timeout: 8000,
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
                        timeout: 8000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token.value
                        }
                    }
                )
            }
        })
        // Adds new assignees
        card.assignedUsers.forEach(user => {
            if (cardAssigneesBackup?.every(backupUser => backupUser.participant.uid !== user.participant.uid)) {
                console.log('Adding assignee', user.participant.uid)
                axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/assignUser`,
                    {userId: user.participant.uid},
                    {
                        timeout: 8000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token.value
                        }
                    }
                )
            }
        })
        // Removes labels
        cardAssigneesBackup?.forEach(backupUser => {
            if (card.assignedUsers.every(user => user.participant.uid !== backupUser.participant.uid)) {
                console.log('Removing assignee', backupUser.participant.uid)
                axios.put(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/unassignUser`,
                    {userId: backupUser.participant.uid},
                    {
                        timeout: 8000,
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
            } else {
                console.log('Card saved')
                var cardToBeSaved = {...card}
                if (card.duedate !== null) {
                    cardToBeSaved = {...card, duedate: card.duedate.toString()}
                }
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: cardToBeSaved,
                }))
                navigation.goBack()
            }
            setBusy(false)
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
            setBusy(false)
        })
    }

    const sendEmail = async(attachments) => {
        var options = {
            subject: card.title,
            body: card.description
        }
        if (attachments.length > 0) {
            options = {...options, attachments}
        }

        MailComposer.composeAsync(options)
    }

    const sendEmailWithAttachment = async () => {
        const attachments = await fetchAttachments(route.params.boardId, route.params.stackId, route.params.cardId, server, token.value)
        const attachmentURIs = await Promise.all(attachments.map(async attachment => {
            return await getAttachmentURI(attachment,route.params.boardId, route.params.stackId, route.params.cardId, server, token.value)
        }));
        sendEmail(attachmentURIs)
    }

    return (
        <View style={{height: "100%", paddingBottom: 40, paddingHorizontal: 5}}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
            >
                { busy &&
                    <Spinner/>
                }
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
                                    copyOfCard['duedate'] = null
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
                { (showDatePicker || (!editMode && card.duedate !== null)) &&
                    <View style={theme.inputField}>
                        <Text h1 h1Style={theme.title}>
                            {i18n.t('dueDate')}
                        </Text>
                        { editMode ?
                            <DateTimePicker
                                disabled={!editMode}
                                value={card.duedate === null ? new Date() : new Date(card.duedate)}
                                mode="date"
                                display="default"
                                onChange={(event, newDuedate) => {
                                    setCard({...card, duedate: newDuedate})
                                }}
                            />
                        :
                            <Text style={theme.inputReadMode}>
                                   {new Date(card.duedate).toLocaleDateString(Localization.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        }
                    </View>
                }
                { (card.labels?.length > 0 || editMode) &&
                    <View style={{zIndex: 2000}}>
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
                { (card.assignedUsers?.length > 0 || editMode) &&
                    <View style={{zIndex: 1000}}>
                        <Text h1 h1Style={theme.title}>
                            {i18n.t('assignees')}
                        </Text>
                        <AssigneeList
                            editable = {editMode}
                            boardUsers = {boards.value[route.params.boardId].users}
                            cardAssignees = {card.assignedUsers ?? []}
                            udpateCardAsigneesHandler = {udpateCardAsigneesHandler} />
                    </View>
                }
                <View keyboardShouldPersistTaps="handled" style={{...theme.inputField, flexGrow: 1}}>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('description')}
                    </Text>
					{
						editMode ?
							<TextInput style={[theme.input, theme.descriptionInput]}
								editable={true}
								multiline={true}
								value={card.description}
									onChangeText={description => {
									setCard({...card, description})
								}}
								placeholder={i18n.t('descriptionOptional')}
							/>
						:
						<Markdown
							styles={theme.markdown}
						>
							{card.description}
						</Markdown>
					}
                </View>
            </ScrollView>
            <AttachmentPanel
                card = {card}
                updateCard = {setCard}
                showSpinner = {setBusy}
            />
            <CommentPanel
                card = {card}
                updateCard = {setCard}
                showSpinner = {setBusy}
            />
            { (editMode === false && user.canEditBoard) &&
                <FloatingAction
                    style={theme.button}
                    actions={
                        [
                            {
                                text: i18n.t('edit'),
                                name: "edit",
                                icon: require('../assets/edit.png'),
                                position: 1
                            },
                            {
                                text: i18n.t('sendByMail'),
                                name: "send_email",
                                icon: require('../assets/mail.png'),
                                position: 2
                            }
                        ]
                    }
                    onPressItem={(name) => { 
                        if (name === 'edit') {
                            setEditMode(true) 
                        } else {
                            Alert.alert(
                                i18n.t("sendAttachments"),
                                i18n.t("sendAttachmentsPrompt"), [
                                    {
                                        text: i18n.t("no"),
                                        onPress: () => {sendEmail([])},
                                        style: "cancel"
                                    },
                                    {
                                        text: i18n.t("yes"),
                                        onPress: sendEmailWithAttachment
                                    }
                                ]
                            )
                        }
                    }} >
                </FloatingAction>
            }
            { (editMode && user.canEditBoard) &&
                <Pressable style={theme.button}
                    onPress={() => {
                        saveCard()
                    }} >
                    <Text style={theme.buttonTitle}>
                        {i18n.t('save')}
                    </Text>
                </Pressable>
            }
        </View>
    )
}

export default CardDetails