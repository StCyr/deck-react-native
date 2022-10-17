import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import { View } from 'react-native'
import { Text } from 'react-native-elements'
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system'
import axios from 'axios'
import {Collapse,CollapseHeader, CollapseBody} from 'accordion-collapse-react-native'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import {i18n} from '../i18n/i18n.js'

// The attachments div that's displayed in the CardDetails view
const AttachmentPanel = ({card, updateCard, showSpinner}) => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
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
        console.log('fetching attachments from server')
        let newCard = axios.get(server.value + `/index.php/apps/deck/api/v1.1/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/attachments`, {
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
               let cardWithAttachments
               let attachments = resp.data.map(attachment => {
                   return {
                       'id': attachment.id,
                        'author': attachment.createdBy,
                       'creationDate': new Date(attachment.createdAt).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                       'name': attachment.data
                   }
               })
               cardWithAttachments = {
                   ...card,
                    ...{'attachments': attachments}
                }
               updateCard(cardWithAttachments)
               console.log('attachments fetched from server')
               return cardWithAttachments
           }
        }).catch((error) => {
           Toast.show({
               type: 'error',
                text1: i18n.t('error'),
               text2: error.message,
           })
           console.log(error)
        })
        showSpinner(false)
        return newCard
    }
   
    // Adds an attachment to the card
    const addAttachment = async () => {
		try {
			// Selects document
			DocumentPicker.getDocumentAsync({copyToCacheDirectory: false})
			.then(resp => {
				if (resp.type === 'success') {

					// Uploads attachment
                    showSpinner(true)
					console.log('Uploading attachment')
                    FileSystem.uploadAsync(
                        server.value + `/index.php/apps/deck/api/v1.0/boards/${route.params.boardId}/stacks/${route.params.stackId}/cards/${route.params.cardId}/attachments`,
                        resp.uri,
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
                                            creationDate: new Date(attachment.createdAt).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
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
                                        creationDate: new Date(attachment.createdAt).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
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
					})
					.catch((error) => {
                        Toast.show({
                            type: 'error',
                            text1: i18n.t('error'),
                            text2: error.message,
                        })
						console.log(error)
					})
				}
                showSpinner(false)
			})
            .catch((error) => {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: error.message,
                })
                console.log(error)
            })
        } catch(error) {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
			console.log(error)
		}
	}

    return (
        <Collapse
            onToggle={fetchAttachmentsIfNeeded}
            handleLongPress={() => addAttachment()}
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
    )

}

export default AttachmentPanel
