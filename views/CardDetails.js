//===============================================================================================================================================
//
// CardDetails: The detailed view of a card, showing all card's information
//
//  This file is part of "Nextcloud Deck".
//
// "Nextcloud Deck" is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//
// "Nextcloud Deck" is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warrant
// of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with "Nextcloud Deck". If not, see <https://www.gnu.org/licenses/>. 
//
//===============================================================================================================================================

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
import Markdown, { MarkdownIt } from 'react-native-markdown-display'
import axios from 'axios'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import {i18n} from '../i18n/i18n.js'
import {decode as atob} from 'base-64'
import { FloatingAction } from "react-native-floating-action"
import * as MailComposer from 'expo-mail-composer'

const taskLists = require('markdown-it-task-lists')
const mdParser = MarkdownIt().use(taskLists, {enabled: true})

const CardDetails = () => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const boards = useSelector(state => state.boards)
    const dispatch = useDispatch()

    const navigation = useNavigation()
    const route = useRoute()

    const [user, setUser] = useState({})
    const [busy, setBusy] = useState(false)
    const [card, setCard] = useState({})
    const [cardDescription, setCardDescription] = useState("")
    const [cardAssigneesBackup, setcardAssigneesBackup] = useState([])
    const [cardLabelsBackup, setcardLabelsBackup] = useState([])
    const [editMode, setEditMode] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)

    // ComponentDidMount
    useEffect(() => {

        // Initialises user
        const id = atob(token.value.substring(6)).split(':')[0]
        getUserDetails(id, server, token.value).then( details => {
            let user = details
            user.canEditBoard = canUserEditBoard(user,boards.value[route.params.boardId])
            setUser(user)
        })

        // Setup page header
        navigation.setOptions({
            headerTitle: i18n.t('cardDetails'),
            headerRight: () => (<AppMenu navigation={navigation} />),
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
                console.error('Error', resp)
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
            }
            setEditMode(false) 
            setBusy(false)
        })
        .catch((error) => {
            console.error(error)
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

    // Function to check/uncheck task list item in the card's description
    const updateCardDescriptionTaskListItem = (text) => {
        // tries to uncheck first
        let regexp = new RegExp("- \\[x\]" + text, "g")
        let description = card.description.replace(regexp, "- [ ]" + text)
        // if uncheck didn't change a thing then we must check
        if (description === card.description) {
            regexp = new RegExp("- \\[ \]" + text, "g")
            description = card.description.replace(regexp, "- [x]" + text)
        }
        setCard({...card, description})
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
                                    console.log(description)
									setCard({...card, description})
								}}
								placeholder={i18n.t('descriptionOptional')}
							/>
						:
						<Markdown
                            rules={{
                                html_inline: (node, children, parent, styles, inheritedStyles = {}) => (
                                    <BouncyCheckbox key={node.key} style={[inheritedStyles, styles.inline]}
                                        disableText={true}
                                        isChecked={node.content.match(/checked=/)}
                                        onPress={() => {
                                            const text = parent[0].children[1].content
                                            updateCardDescriptionTaskListItem(text)
                                        }}
                                    />
                                )
                            }}
							styles={theme.markdown}
                            mergeStyle={true}
                            markdownit={mdParser}
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
