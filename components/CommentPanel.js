import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRoute } from '@react-navigation/native'
import { addCard } from '../store/boardSlice'
import { Modal, Pressable, TextInput, View } from 'react-native'
import { Text } from 'react-native-elements'
import axios from 'axios'
import {Collapse,CollapseHeader, CollapseBody} from 'accordion-collapse-react-native'
import * as Localization from 'expo-localization'
import Toast from 'react-native-toast-message'
import Icon from './Icon.js'
import {i18n} from '../i18n/i18n.js'

// The comment div that's displayed in the CardDetails view
const CommentPanel = ({card, updateCard}) => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const dispatch = useDispatch()

    const route = useRoute()

    const [showAddCommentModal, setShowAddCommentModal] = useState(false)
    const [newComment, setNewComment] = useState("")

    // ComponentDidMount
    useEffect(() => {
    }, [])

    // Fetches card's comments
    const fetchCommentsIfNeeded = async () => {
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
                updateCard({
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
				let cardWithNewComment
				let comment = {
					'id': resp.data.ocs.data.id,
					'author': resp.data.ocs.data.actorDisplayName,
					'creationDate': new Date(resp.data.ocs.data.creationDateTime).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
					'name': resp.data.ocs.data.message
				}
				if (card.commentsCount) {
					cardWithNewComment = {
						...card,
						...{
							'commentsCount': card.commentsCount + 1,
							'comments': [
								...card.comments,
								...[comment]
							]
						}
					}
				} else {
					cardWithNewComment = {
                        ...card,
                        ... {
							'commentsCount': 1,
							'comments': [comment]
                        }
					}
				}
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: cardWithNewComment
                }))
                updateCard(cardWithNewComment)
                console.log('Card updated in store')

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

    // Edits a comment
    const editComment = () => {

    }

    // Deletes a comment
    const deleteComment = (comment) => {
        console.log(`deleting comment ${comment.id}`)
        axios.delete(server.value + `/ocs/v2.php/apps/deck/api/v1.0/cards/${route.params.cardId}/comments/${comment.id}`,
        {
            timeout: 8000,
            headers: {
                'OCS-APIREQUEST': true,
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
                // Saves card in store and updates frontend
                let newCard
                newCard = {
                    ...card,
                    ...{
                        'commentsCount': card.commentsCount -1,
                        'comments': card.comments.filter(c => c.id !== comment.id)
                    }
                }
                dispatch(addCard({
                    boardId: route.params.boardId,
                    stackId: route.params.stackId,
                    card: newCard
                }))
                updateCard(newCard)
                console.log('comment deleted')
            }
        })
    }

    return (
        <View>
            <Modal
                animationType="fade"
                visible={showAddCommentModal}
                presentationStyle="formSheet"
                onRequestClose={() => {
                    setShowAddCommentModal(false);
                }}>
                <View style={{...theme.container, ...{height: '100%'}}}>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('addComment')}
                    </Text>
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
            <Collapse
                onToggle={fetchCommentsIfNeeded}
            >
            <CollapseHeader>
                <View style={theme.itemWithIconsMenu}>
                    <Text h1 h1Style={theme.title}>
                        {i18n.t('comments') + ' (' + card.commentsCount + ')'}
                    </Text>
                    <Pressable onPress={() => setShowAddCommentModal(true)}>
                        <Icon size={32} name='plus-circle' style={theme.iconGrey} />
                    </Pressable>
                </View>
            </CollapseHeader>
            <CollapseBody>
                {card.comments ? card.comments.map(comment => (
                    <View key={comment.id} style={theme.itemWithIconsMenu}>
                        <View style={theme.comment}>
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
                        <View style={theme.iconsMenu}>
                            <Pressable onPress={() => editComment(comment)}>
                                <Icon size={32} name='pencil' style={{...theme.iconGrey, ...{paddingRight: 5}}} />
                            </Pressable>
                            <Pressable onPress={() => deleteComment(comment)}>
                                <Icon size={32} name='trash' style={theme.iconGrey} />
                            </Pressable>
                        </View>
                    </View>
                )
              ) :  null}
            </CollapseBody>
        </Collapse>
    </View>
    )

}

export default CommentPanel