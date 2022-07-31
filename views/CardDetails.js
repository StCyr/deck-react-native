import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import AppMenu from '../components/AppMenu'
import AssigneeList from '../components/AssigneeList'
import LabelList from '../components/LabelList'
import Spinner from '../components/Spinner'
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native'
import { Text } from 'react-native-elements'
import { HeaderBackButton } from '@react-navigation/elements'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BouncyCheckbox from "react-native-bouncy-checkbox"
import DateTimePicker from '@react-native-community/datetimepicker'
import axios from 'axios'
import {Collapse,CollapseHeader, CollapseBody} from 'accordion-collapse-react-native'
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

    const [saving, setSaving] = useState(false)
    const [card, setCard] = useState({})
    const [cardAssigneesBackup, setcardAssigneesBackup] = useState([])
    const [cardLabelsBackup, setcardLabelsBackup] = useState([])
    const [editMode, setEditMode] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showAddCommentModal, setShowAddCommentModal] = useState(false)
    const [newComment, setNewComment] = useState("")

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
        const cardFromStore = boards.value[route.params.boardId].stacks.find(oneStack => oneStack.id === route.params.stackId).cards[route.params.cardId]

        // Formats duedate properly for DateTimePicker and makes sure the component will show it in edit mode
        if (cardFromStore.duedate !== null) {
            cardFromStore.duedate = new Date(cardFromStore.duedate)
            setShowDatePicker(true)
        }

        // Saves card in local state
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

     // Fetches card's attachments
     const fetchAttachmentsIfNeeded = () => {
         if (card.attachments) {
            return
        }
        console.log('fetching attachments from server')
        axios.get(server.value + `/index.php/apps/deck/api/v1.1/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/attachments`, {
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token.value
            }
        }).then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
            } else {
                // Adds attachments to card
                console.log('card attachments retrieved from server')
                let attachments = resp.data.map(attachment => {
                    return {
                        'id': attachment.id,
                        'author': attachment.createdBy,
                        'creationDate': new Date(attachment.createdAt).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                        'name': attachment.data
                    }                        
                    })
                setCard({
                    ...card,
                    ...{'attachments': attachments}
                })
            }
        }).catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
        })
    }
      
    // Fetches card's comments
    const fetchCommentsIfNeeded = () => {
        if (card.comments) {
            return
        }
        console.log('fetching comments from server')
        axios.get(server.value + `/ocs/v2.php/apps/deck/api/v1.0/cards/${route.params.cardId}/comments`, {
			timeout: 8000,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token.value,
                'OCS-APIRequest': true
			}
		}).then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
            } else {
                // Adds comments to card
                console.log('card comments retrieved from server')
                let comments = resp.data.ocs.data.map(comment => {
                    return {
                        'id': comment.id,
                        'author': comment.actorDisplayName,
                        'creationDate': new Date(comment.creationDateTime).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                        'name': comment.message
                    }                        
                })
                setCard({
                    ...card,
                    ...{'comments': comments}
                })
            }
        }).catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
        })
    }

    // Func
    const addComment = () => {
        console.log('saving comment')
        axios.post(server.value + `/ocs/v2.php/apps/deck/api/v1.0/cards/${route.params.cardId}/comments`,
        {
            message: newComment
        },
        {
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token.value,
                'OCS-APIRequest': true
            }
        }).then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
            } else {
                console.log('comment saved')
                
                // Saves card
                // TODO: Make sure we have fetched the existing card comments before (otherwise we'll erase them in the frontend)
                // TODO: Update frontend properly (it doesn't rerender after setCard)
                let cardWithNewComment = {
                    ...card,
                    ...{
                        'commentsCount': card.commentsCount + 1,
                        'comments': [
                            ...card.comments,
                            ...[{
                                'id': resp.data.ocs.data.id,
                                'author': resp.data.ocs.data.actorDisplayName,
                                'creationDate': new Date(resp.data.ocs.data.creationDateTime).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                                'name': resp.data.ocs.data.message
                            }]
                        ]
                    }
                }
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: cardWithNewComment
                }))
                setCard(cardWithNewComment)

                // Resets state and hides modal
                setShowAddCommentModal(false)
                setNewComment('')
            }
        }).catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
        })

    }

    // Saves card and its labels
    const saveCard = () => {
        setSaving(true)
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
            setSaving(false)
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
            setSaving(false)
        })
    }

    return (
        <View style={{height: "100%", paddingBottom: 40, paddingHorizontal: 5}}>
            <Modal
                animationType="fade"
                visible={showAddCommentModal}
                presentationStyle="formSheet"
                onRequestClose={() => {
                    setShowAddCommentModal(false);
                  }}>
                <View style={theme.container}>
                    <Text h1 h1Style={theme.title}>{i18n.t('addComment')}</Text>
                    <TextInput style={theme.input}
                        editable={true}
                        multiline={true}
                        value={newComment}
                        onChangeText={comment => { setNewComment(comment) }}
                        placeholder={i18n.t('comment')}
                    />
                    <Pressable style={theme.button}
                        onPress={() => {
                            addComment()
                        }} >
                        <Text style={theme.buttonTitle}>
                            {i18n.t('save')}
                        </Text>
                    </Pressable>
                </View>
            </Modal>
            <ScrollView
                keyboardShouldPersistTaps="handled"
            >
                { saving &&
                    <Spinner title={i18n.t('saving')} />
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
                    <TextInput style={editMode ? [theme.input, theme.descriptionInput] : [theme.inputReadMode, theme.descriptionInput]}
                        editable={editMode}
                        multiline={true}
                        value={card.description}
                        onChangeText={description => {
                            setCard({...card, description})
                        }}
                        placeholder={i18n.t('descriptionOptional')}
                    />
                </View>
            </ScrollView>
            <Collapse
                disabled={card.attachmentCount === 0}
                onToggle={fetchAttachmentsIfNeeded}
            >
                <CollapseHeader>
                  <View>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('attachments') + ' (' + card.attachmentCount + ')'}
                    </Text>
                </View>
                </CollapseHeader>
                <CollapseBody>
                    {card.attachments ? card.attachments.map(attachment => (
                        <View key={attachment.id} style={theme.comment}>
                            <View style={theme.commentHeader}>
                                <Text style={theme.commentAuthor}>
                                    {attachment.author}
                                </Text>
                                <Text style={theme.commentCreationDate}>
                                    {attachment.creationDate}
                                </Text>
                            </View>
                            <Text>
                                {attachment.name}
                            </Text>
                        </View>
                    )
                  ) :  null}
                </CollapseBody>
            </Collapse>
            <Collapse
                disabled={card.commentsCount === 0}
                onToggle={fetchCommentsIfNeeded}
                handleLongPress={() => setShowAddCommentModal(true)}
            >
                <CollapseHeader>
                  <View>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('comments') + ' (' + card.commentsCount + ')'}
                    </Text>
                </View>
                </CollapseHeader>
                <CollapseBody>
                    {card.comments ? card.comments.map(comment => (
                        <View key={comment.id} style={theme.comment}>
                            <View style={theme.commentHeader}>
                                <Text style={theme.commentAuthor}>
                                    {comment.author}
                                </Text>
                                <Text style={theme.commentCreationDate}>
                                    {comment.creationDate}
                                </Text>
                            </View>
                            <Text style={theme.comment}>
                                {comment.name}
                            </Text>
                        </View>
                    )
                  ) :  null}
                </CollapseBody>
            </Collapse>
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
        </View>
)
}

export default CardDetails
