import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import { Alert, Pressable, View } from 'react-native'
import { Text } from 'react-native-elements'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import FileViewer from 'react-native-file-viewer'
import axios from 'axios'
import {Collapse,CollapseHeader, CollapseBody} from 'accordion-collapse-react-native'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import Icon from './Icon.js'
import {i18n} from '../i18n/i18n.js'
import {decode as atob} from 'base-64';
import { fetchAttachments, getAttachmentURI } from '../utils'
import * as ImagePicker from 'expo-image-picker';

// The attachments div that's displayed in the CardDetails view
const AttachmentPanel = ({card, updateCard, showSpinner}) => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const user = atob(token.value.substring(6)).split(':')[0]
    const dispatch = useDispatch()

    const route = useRoute()

    // ComponentDidMount
    useEffect(() => {
    }, [])

    // Fetches card's attachments
    const fetchAttachmentsIfNeeded = async () => {
        if (card.attachments) {
           return card
        }
        showSpinner(true)
        const attachments = await fetchAttachments(route.params.boardId, route.params.stackId, route.params.cardId, server, token.value)
        const cardWithAttachments = {
            ...card,
            ...{'attachments': attachments}
        }
        updateCard(cardWithAttachments)
        showSpinner(false)
        return cardWithAttachments
    }
   
    // Adds an attachment to the card
    const addAttachment = async (attachmentType) => {
		try {
			// Selects document
            let resp
			if (attachmentType === 'photo') {
                resp = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                  });
            } else if (attachmentType === 'camera') {
                const result = await ImagePicker.requestCameraPermissionsAsync();
                if (result.granted) {
                    resp = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.All,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 1,
                    });
                }
            } else {
                resp = await DocumentPicker.getDocumentAsync({copyToCacheDirectory: false})
            }

            const status = resp.type ? resp.type : !resp.canceled ? resp.assets.type : 'cancel'

			if (status !== 'cancel') {

                const uri = resp.uri ? resp.uri : resp.assets.uri
				// Uploads attachment
                showSpinner(true)
				console.log('Uploading attachment')
                FileSystem.uploadAsync(
                    server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/attachments`,
                    uri,
                    {
                        fieldName: 'file',
						httpMethod: 'POST',
                        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                        headers: {
                            'Content-Type': 'application/json',
							'Authorization': token.value
						},
                        parameters: {
                            type: 'file'
                        }
                    },
				)
				.then(async (resp) => {
                    if (resp.status === 200) {
                        console.log('Attachment uploaded')

                        // Makes sure we have the existing card attachments, if any
                        let tempCard = card
                        if (tempCard.attachmentCount && tempCard.attachments === null) {
                            tempCard = await fetchAttachmentsIfNeeded()
                        }

                        // Saves card in store and updates frontend
                        let cardWithNewAttachment
                        let attachment = JSON.parse(resp.body)
                        if (tempCard.attachmentCount) {
                            cardWithNewAttachment = {
                                ...tempCard,
                                ...{
                                    'attachmentCount': tempCard.attachmentCount + 1,
                                    'attachments': [
                                        ...tempCard.attachments,
                                        ...[{
                                            author: attachment.createdBy,
                                            creationDate: new Date().toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                                            id: attachment.id,
                                            name: attachment.data
                                        }]
                                    ]
                                }
                            }
                        } else {
                            cardWithNewAttachment = {
                                ...tempCard,
                                ...{
                                    'attachmentCount': 1,
                                    'attachments': [{
                                        author: attachment.createdBy,
                                        creationDate: new Date().toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                                        id: attachment.id,
                                        name: attachment.data
                                    }]
                                }
                            }
                        }
                        dispatch(addCard({
                            boardId: route.params.boardId,
                            stackId: route.params.stackId,
                            card: cardWithNewAttachment
                        }))
                        updateCard(cardWithNewAttachment)
                        console.log('Card updated in store')
                        showSpinner(false)
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: i18n.t('error'),
                            text2: JSON.parse(resp.body).message,
                        })
                        console.log(JSON.parse(resp.body).message)
                        showSpinner(false)
                    }
				})
				.catch((error) => {
                    Toast.show({
                        type: 'error',
                        text1: i18n.t('error'),
                        text2: error.message,
                    })
					console.log('error', error)
                    showSpinner(false)
				})
			}
        }
        catch (error) {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
        }
}

    // Opens an attachment
    const openAttachment = async (attachment) => {
        const uri = await getAttachmentURI(attachment, route.params.boardId, route.params.stackId, route.params.cardId, server, token.value)
        if (uri !== null) {
            FileViewer.open(uri)
        }
    }

    // Deletes an attachment
    const deleteAttachement = async (attachment) => {
        console.log(`deleting attachment ${attachment.id}`)
        axios.delete(server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/attachments/${attachment.id}`,
        {
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token.value,
            },
            data: {
                'type': 'file'
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
                // Saves card in store and updates frontend
                let newCard
                newCard = {
                    ...card,
                    ...{
                        'attachmentCount': card.attachmentCount -1,
                        'attachments': card.attachments.filter(a => a.id !== attachment.id)
                    }
                }
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: newCard
                }))
                updateCard(newCard)
                console.log('attachment deleted')
            }
        })
    }

    return (
        <Collapse
            onToggle={fetchAttachmentsIfNeeded}
        >
            <CollapseHeader>
              <View style={theme.itemWithIconsMenu}>
                <Text h1 h1Style={theme.title}>
                    {i18n.t('attachments') + ' (' + card.attachmentCount + ')'}
                </Text>
                <Pressable onPress={ () => {
                    Alert.alert(
                        i18n.t("attachmentSource"),
                        i18n.t("attachmentSourcePrompt"), [
                            {
                                text: i18n.t("photoGallery"),
                                onPress: () => {addAttachment('photo')},
                            },
                            {
                                text: i18n.t("camera"),
                                onPress: () => {addAttachment('camera')},
                            },
                            {
                                text: i18n.t("document"),
                                onPress: () => {addAttachment('document')}
                            },
                            {
                                text: i18n.t("cancel"),
                                style: 'cancel'
                            }
                        ]
                    )
                }}>
                    <Icon size={32} name='plus-circle' style={theme.iconGrey} />
                </Pressable>
            </View>
            </CollapseHeader>
            <CollapseBody>
                {card.attachments ? card.attachments.map(attachment => (
                    <View key={attachment.id} style={{...theme.itemWithIconsMenu, ...{alignItems: 'center'}}}>
                        <Pressable style={theme.attachment} onPress={() => openAttachment(attachment)}>
                            <View style={theme.attachmentHeader}>
                                <Text style={theme.attachmentAuthor}>
                                    {attachment.author}
                                </Text>
                                <Text style={theme.attachmentCreationDate}>
                                    {attachment.creationDate}
                                </Text>
                            </View>                            
                            <Text style={theme.attachmentName}>
                                {attachment.name}
                            </Text>
                        </Pressable>
                        <View style={theme.iconsMenu}>
                            <Pressable onPress={() => deleteAttachement(attachment)} disabled={user!==attachment.author}>
                                <Icon size={32} name='trash' style={user===attachment.author ? theme.iconEnabled : theme.iconDisabled} />
                            </Pressable>
                        </View>
                    </View>
                )
              ) :  null}
            </CollapseBody>
        </Collapse>
    )

}

export default AttachmentPanel
