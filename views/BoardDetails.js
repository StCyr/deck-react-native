//===============================================================================================================================================
//
// BoardDetails: A component that display a board's cards, grouped by stack
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

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addCard, addLabel, addStack, addUser, deleteStack, moveCard, renameStack } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from '../components/AppMenu';
import Card from '../components/Card';
import { canUserEditBoard, getUserDetails } from '../utils';
import { ActionSheetIOS, Image, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { DraxProvider, DraxScrollView, DraxView } from 'react-native-drax';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/elements';
import { FloatingAction } from "react-native-floating-action";
import Toast from 'react-native-toast-message';
import { i18n } from '../i18n/i18n.js';
import {decode as atob} from 'base-64';

class BoardDetails extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            addingCard: false,
            addingStack: false,
            cardPressed: -1, // array of cards pressed
            index: null,   // the index of the stack currently shown
            newCardName: '',
            newStackName: undefined,
            refreshing: false,
            stackToRename: false,
            user: {
                id: atob(this.props.token.value.substring(6)).split(':')[0]
            }
        }
        this.createCard = this.createCard.bind(this)
        this.createStack = this.createStack.bind(this)
        this.deleteStack = this.deleteStack.bind(this)
        this.loadBoard = this.loadBoard.bind(this)
        this.moveCard = this.moveCard.bind(this)
        this.insets = initialWindowMetrics?.insets ?? {
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
        }
        
    }

    async componentDidMount() {

        // Setup page's header bar
        const title = this.props.boards.value[this.props.route.params.boardId].title
        this.props.navigation.setOptions({
            headerTitle: title.length > 25 ? title.slice(0,24) + '...' : title,
            headerRight: () => (<AppMenu navigation={this.props.navigation} />),
            headerLeft: () => (
                <HeaderBackButton
                    label = {i18n.t('all')}
                    labelVisible = {true}
                    onPress = {() => {
                        AsyncStorage.removeItem('navigation')
                        this.props.navigation.navigate('AllBoards')
                    }}
                />
            )
        })

        // Gets board details if not yet done
        if (this.props.boards.value[this.props.route.params.boardId].stacks.length === 0) {
            await this.loadBoard()
        } else {
            // Navigates to stack with order === 0
            this.setState({
                index:  this.props.boards.value[this.props.route.params.boardId].stacks[0].id,
            })
        }

        // Gets user details
        getUserDetails(this.state.user.id, this.props.server, this.props.token.value).then( details => {
            const canEditBoard = canUserEditBoard(details,this.props.boards.value[this.props.route.params.boardId])
            this.setState({user: {...details, canEditBoard} })
        })
    }

    render() {

        const icon = <Image
            style={{
                width: 20,
                height: 20,
                tintColor: 'white',
            }}
            source={require('../assets/plus.png')}
        />

        const stacks = this.props.boards.value[this.props.route.params.boardId]?.stacks
        if (stacks === undefined) {
            return (
                <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                </View>
            )
        } else if (stacks.length === 0 && !this.state.refreshing) {
            // Board has no stack
            return (
                <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                    <View>
                        <Text style={this.props.theme.textWarning}>
                            {i18n.t('noStack')}
                       </Text>
                    </View>
                    <View style={this.props.theme.inputButton} >
                        <TextInput style={[this.props.theme.inputText, {flexGrow: 1}]}
                                value={this.state.newStackName}
                                autoFocus={true}
                                maxLength={100}
                                onChangeText={newStackName => {
                                    this.setState({ newStackName })
                                }}
                                onSubmitEditing={() => this.createStack(this.state.newStackName)}
                                placeholder={i18n.t('newStackHint')}
                                returnKeyType='send'
                        />
                    </View>
                </View>
            )
        } else {
            const currentStack = stacks.find(oneStack => oneStack.id === this.state.index)
            return (
                <DraxProvider>
                    <View style={{flex:1}}>
                    <DraxScrollView
                        style={{height:'100%'}}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.loadBoard}
                                size='large'
                            />
                        }
                        stickyHeaderIndices={[0]}
                    >
                        {/* This view is needed as an extra wrapper,
                        ScrollView can use to make the containing view sticky,
                        without changing styles on the containing view */}
                        <View>
                            <DraxScrollView
                                style={this.props.theme.stackBar}
                                horizontal
                                contentContainerStyle={this.props.theme.stackBarScrollInner}
                            >
                                {stacks.map(stack => (
                                    <DraxView
                                        key={stack.id}
                                        style={this.props.theme.stackTab}
                                        receivingStyle={this.props.theme.stackTabDraggedOver}
                                        onReceiveDragDrop={({ dragged: { payload } }) => {
                                            // Don't try to move card when the drop stack is the same
                                            if (stack.id !== payload.stackId) {
                                                console.log(`moving card ${payload.id}`)
                                                this.moveCard(payload.id, stack.id)
                                            }
                                        }}
                                    >
                                        <Pressable
                                            key={stack.id}
                                            onPress={() => {
                                                // Switches to selected stack and remember navigation
                                                console.log(`Navigating to stack ${stack.id}`)
                                                this.setState({
                                                    index: stack.id,
                                                })
                                                AsyncStorage.setItem('navigation', JSON.stringify({
                                                    boardId: this.props.route.params.boardId,
                                                    stackId: stack.id,
                                                }))
                                            }}
                                            onLongPress={() => {
                                                if (this.state.user.canEditBoard) {
                                                    // Context menu
                                                    ActionSheetIOS.showActionSheetWithOptions(
                                                        {
                                                            options: [i18n.t("cancel"), i18n.t("renameStack"), i18n.t("addStack"), i18n.t("deleteStack")],
                                                            destructiveButtonIndex: 3,
                                                            cancelButtonIndex: 0,
                                                        },
                                                        buttonIndex => {
                                                            if (buttonIndex === 0) {
                                                                // cancel action
                                                            } else if (buttonIndex === 1) {
                                                                this.setState({stackToRename: stack})
                                                            } else if (buttonIndex === 2) {
                                                                this.setState({addingStack: true})
                                                            } else if (buttonIndex === 3) {
                                                                this.deleteStack(stack.id)
                                                            }
                                                        }
                                                    )
                                                }
                                            }}
                                        >
                                            <Text style={[this.props.theme.stackTabText, this.state.index === stack.id ? this.props.theme.stackTabTextSelected : this.props.theme.stackTabTextNormal]}>
                                                {stack.title}
                                            </Text>
                                        </Pressable>
                                    </DraxView>
                                ))}
                                {/*
								<View style={[this.props.theme.boardMenu]}>
									<Menu
										ref={menu}
										button={
											<Pressable
												onPress={() => {
													menu.current.show();
												}}
											>
												<Icon name='ellipsis-vert' style={this.props.theme.icon} />
											</Pressable>
										}
									>
										<MenuItem
											onPress={() => {
											}}
										>
											{i18n.t('manageBoardLabels')}
										</MenuItem>
										<MenuItem
											onPress={() => {
											}}
										>
											{i18n.t('manageBoardMembers')}
										</MenuItem>
										<MenuItem
											onPress={() => {
											}}
										>
											{i18n.t('search')}
										</MenuItem>
									</Menu>
								</View>
                                */}
                            </DraxScrollView>
                        </View>
                        {currentStack?.cards &&
                        <View style={this.props.theme.container}>
                            {Object.values(currentStack.cards).sort((a,b) => a.order - b.order).map(card => (
                                <Card
                                    card={card}
                                    key={card.id}
                                    navigation={this.props.navigation} 
                                    route={this.props.route}
                                    stackId={currentStack.id}
                                     />
                            ))}
                        </View>
                        }
                    </DraxScrollView>
                    </View>
                    {(!(this.state.addingStack || this.state.addingCard || this.state.stackToRename || !this.state.user.canEditBoard)) &&
                        <FloatingAction
                            style={this.props.theme.button}
                            overrideWithAction = {true}
                            actions={
                                [
                                    {
                                        name: "add",
                                        icon: icon,
                                        position: 1
                                    },
                                ]
                            }
                            onPressItem={() => { this.setState({addingCard: true}) }}
                        />
                    }
                    {this.state.addingCard &&
                        <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                            <View style={this.props.theme.inputButton} >
                                <TextInput style={[this.props.theme.inputText, {flexGrow: 1}]}
                                    value={this.state.newCardName}
                                    autoFocus={true}
                                    maxLength={100}
                                    onBlur={() => {
                                        this.setState({addingCard: false})
                                        this.setState({ newCardName: '' })
                                    }}
                                    onChangeText={newCardName => {
                                        this.setState({ newCardName })
                                    }}
                                    onSubmitEditing={() => this.createCard(this.state.newCardName)}
                                    placeholder={i18n.t('newCardHint')}
                                    returnKeyType='send'
                                />
                            </View>
                        </View>
                    }
                    {(this.state.addingStack || this.state.stackToRename) &&
                        <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                            <View style={this.props.theme.inputButton} >
                                <TextInput style={[this.props.theme.inputText, {flexGrow: 1}]}
                                    defaultValue={this.state.stackToRename ? this.state.stackToRename.title : false}
                                    value={this.state.newStackName}
                                    autoFocus={true}
                                    maxLength={100}
                                    onBlur={() => {
                                        this.setState({addingStack: false})
                                        this.setState({stackToRename: false})
                                        this.setState({ newStackName: undefined })
                                    }}
                                    onChangeText={newStackName => {
                                        this.setState({ newStackName })
                                    }}
                                    onSubmitEditing={() => {
                                        if (this.state.addingStack) {
                                            this.createStack(this.state.newStackName)
                                        } else {
                                            this.renameStack(this.state.index, this.state.newStackName)
                                        }
                                    }}
                                    placeholder={this.state.stackToRename ? false : i18n.t('newStackHint')}
                                    returnKeyType='send'
                                />
                            </View>
                        </View>
                    }
                </DraxProvider>
            )
        }
    }

    createCard(cardName) {
        console.log('Creating card', cardName)
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.state.index}/cards`,
            {
                description: '',
                duedate: null,
                title: cardName,
            },
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
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
                console.log('Card created')
                // Saves card to stack in store
                this.props.addCard({
                    boardId: this.props.route.params.boardId,
                    stackId: this.state.index,
                    card: {...resp.data, labels: []},
                })
                // Reset newCardName and hide newCardName button
                this.setState({addingCard: false})
                this.setState({ newCardName: '' })
                
            }
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

    renameStack(stackId, stackName) {
        console.log(`Renaming stack ${stackId} to ${stackName}`)
        const stacks = this.props.boards.value[this.props.route.params.boardId].stacks
        const currentStack = stacks.find(oneStack => oneStack.id === this.state.index)
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${stackId}`,
            {
                title: stackName,
                order: currentStack.order
            },
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
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
                console.log('Stack renamed')
                // Rename stack in store
                this.props.renameStack({
                    boardId: this.props.route.params.boardId,
                    stackId: this.state.index,
                    stackTitle: stackName
                })
                // Reset newStackName and hide newStackName button
                this.setState({renamingStack: false})
                this.setState({ newStackName: '' })
            }
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

    createStack(stackName) {
        console.log('Creating stack', stackName)
        // Finds stack with highest order (should probably be a selector but I haven't figure out yet how to do it)
        var lastStack = { order: 0 }
		this.props.boards.value[this.props.route.params.boardId].stacks.forEach(stack => {
			if (stack.order >= lastStack.order) {
				lastStack = stack
			}
		})
        // Creates stack
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`,
            {
                title: stackName,
                order: lastStack.order + 1 // Puts stack after latest one
            },
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
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
                console.log('Stack created')
                // Add stack to board in store
                this.props.addStack({
                    boardId: this.props.route.params.boardId,
                    stack: resp.data
                })
                // Navigate to stack when it's the first one created
                if (this.state.index === 0 ) {
                    this.setState({
                        index: this.props.boards.value[this.props.route.params.boardId].stacks[0].id,
                    })
                }
                // Reset newStackName and hide newStackName button
                this.setState({addingStack: false})
                this.setState({ newStackName: '' })
            }
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

    // Loads the detailed information of the board
    async loadBoard() {

        // Shows loading spinner
        this.setState({
            refreshing: true
        })

        // Retrieves board details (eg:labels)
        // TODO: Merge both axios requests
        console.log('Retrieving board details from server')
        await axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}`, {
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
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
                console.log('board details retrieved from server')
                // Add labels to board in store
                console.log('Adding labels info to the board in store')
                resp.data.labels.forEach(label => {
                    this.props.addLabel({
                        boardId: this.props.route.params.boardId,
                        label
                    })
                })
                // Add users to board in store
                console.log('Adding users info to the board in store')
                resp.data.users.forEach(user => {
                    this.props.addUser({
                        boardId: this.props.route.params.boardId,
                        user
                    })
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

        // Retrieves board stacks
        console.log('Retrieving board stacks from server')
        await axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
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
                console.log('board details retrieved from server')

                // Add stacks to board in store
                resp.data.forEach(stack => {
                    this.props.addStack({
                        boardId: this.props.route.params.boardId,
                        stack
                    })
                })

                // Shows last visited stack or stack with order === 0 (assumes server's answer is ordered)
                // TODO: handle case where the remembered stackId has been deleted
                if (resp.data.length > 0) {
                    this.setState({
                        index:  (this.props.route.params.stackId !== null && this.state.index === null) ? parseInt(this.props.route.params.stackId) : this.state.index ?? resp.data[0].id,
                    })
                }
            }
        }).catch((error) => {
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            console.log(error)
        })

        // Hides loading spinner
        this.setState({
            refreshing: false
        })
}

    moveCard(cardId, stackId) {
        this.props.moveCard({
            boardId: this.props.route.params.boardId,
            oldStackId: this.state.index,
            newStackId: stackId,
            cardId
        })
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.state.index}/cards/${cardId}/reorder`,
            {
                order: 0,
                stackId,
            },
            { 
                timeout: 8000,
                headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
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
                console.log('card moved')
            }
        })
        .catch((error) => {
            // Reverts change and inform user
            console.log(error)
            Toast.show({
                type: 'error',
                text1: i18n.t('error'),
                text2: error.message,
            })
            this.props.moveCard({
                boardId: this.props.route.params.boardId,
                oldStackId: stackId,
                newStackId: this.state.index,
                cardId
            })
        })
    }

    deleteStack(stackId) {
        console.log(`deleting stack ${stackId}`)
        axios.delete(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${stackId}`,
            {
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
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
                console.log('Stack deleted')
                this.props.deleteStack({
                    boardId: this.props.route.params.boardId,
                    stackId,
                })
            }
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

}

// Connect to store
const mapStateToProps = state => ({
    boards: state.boards,
    server: state.server,
    theme: state.theme,
    token: state.token,
})

const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        addCard,
        addLabel,
        addStack,
        addUser,
        deleteStack,
        moveCard,
        renameStack,
        setServer,
        setToken,
    }, dispatch)
)

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(BoardDetails)
