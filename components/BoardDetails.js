import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addStack, deleteCard, deleteStack, moveCard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { ActionSheetIOS, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { DraxProvider, DraxScrollView, DraxView } from 'react-native-drax';
import axios from 'axios';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/elements';
import { i18n } from '../i18n/i18n.js';

// Component that display a board's cards, grouped by stack
class BoardDetails extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            addingStack: false,
            index: 0,   // the index of the stack currently shown
            newStackName: '',
            refreshing: false,
            cardPressed: -1, // array of cards pressed
        }
        this.createCard = this.createStack.bind(this)
        this.loadBoard = this.loadBoard.bind(this)
        this.moveCard = this.moveCard.bind(this)
        this.insets = initialWindowMetrics?.insets ?? {
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
        }
    }

    // Function to detect long press on card and open a context menu
    cardPressedDown(id) {
        this.setState({cardPressed: id})
        setTimeout(() => {
            if(this.state.cardPressed === id) {
                // Context menu
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
                            // Makes title editable
                        } else if (buttonIndex === 2) {
                            // Delete card
                            this.deleteCard(id)
                        }
                    }
                )
                this.setState({cardPressed: -1}) // reset
            }
        }, 500)
    }

    async componentDidMount() {

        // Setup page's header bar
        this.props.navigation.setOptions({
            headerTitle: this.props.boards.value[this.props.route.params.boardId].title,
            headerRight: () => (<AppMenu/>),
            headerLeft: () => (
                <HeaderBackButton
                    label = 'All boards'
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

    }

    render() {
        const stacks = this.props.boards.value[this.props.route.params.boardId].stacks;
        if (stacks.length === 0 && !this.state.refreshing) {
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
            const currentStack = stacks.find(oneStack => oneStack.id === this.state.index);
            return (
                <DraxProvider>
                    <View style={{flex:1}}>
                    <DraxScrollView
                        contentContainerStyle={{flexGrow: 1}}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.loadBoard}
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
                                                            // TODO
                                                        } else if (buttonIndex === 2) {
                                                            this.setState({addingStack: true})
                                                        } else if (buttonIndex === 3) {
                                                            this.deleteStack(stack.id)
                                                        }
                                                    }
                                                )                
                                            }}
                                        >
                                            <Text style={[this.props.theme.stackTabText, this.state.index === stack.id ? this.props.theme.stackTabTextSelected : this.props.theme.stackTabTextNormal]}>
                                                {stack.title}
                                            </Text>
                                        </Pressable>
                                    </DraxView>
                                ))}
                            </DraxScrollView>
                        </View>
                        {currentStack?.cards &&
                        <View style={this.props.theme.boardDetailsContainer}>
                            {Object.values(currentStack.cards).map(card => (
                                <Pressable
                                    key={card.id}
                                    onPress={() => {
                                        // Navigates to the card's details page
                                        this.props.navigation.navigate('CardDetails',{
                                            boardId: this.props.route.params.boardId,
                                            stackId: this.state.index,
                                            cardId: card.id
                                        })
                                    }}
                                >
                                    <DraxView
                                        key={card.id}
                                        payload={card}
                                        style={this.props.theme.card}
                                        draggingStyle={{opacity: 0}}
                                        dragReleasedStyle={{opacity: 0}}
                                        hoverStyle={[this.props.theme.card, {opacity: 0.6, shadowOpacity: 0}]}
                                        longPressDelay={250}
                                        onDragStart={() => this.cardPressedDown(card.id)}
                                        onDrag={({dragTranslation}) => {
                                            if(dragTranslation.y > 5 || dragTranslation.y < -5) {
                                                // if the card was actually moved, cancel opening the context menu
                                                this.setState({cardPressed: -1})
                                            }
                                        }}
                                        onDragEnd={() => {
                                            // Shows selected card's details when the user just clicked the card
                                            this.setState({cardPressed: -1})
                                        }}
                                    >
                                        <Text style={[this.props.theme.cardTitle, { width: '100%' }]}>
                                            {card.title}
                                        </Text>
                                    </DraxView>
                                </Pressable>
                            ))}
                        </View>
                        }
                    </DraxScrollView>
                    </View>
                    {!this.state.addingStack &&
                        <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                            <Pressable
                                style={this.props.theme.button}
                                onPress={() => {this.props.navigation.navigate('NewCard', {
                                    boardId: this.props.route.params.boardId,
                                    stackId: this.state.index,
                                })}}
                            >
                                <Text style={this.props.theme.buttonTitle}>
                                    {i18n.t('createCard')}
                                </Text>
                            </Pressable>
                        </View>
                    }
                    {this.state.addingStack &&
                        <View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
                            <View style={this.props.theme.inputButton} >
                                <TextInput style={[this.props.theme.inputText, {flexGrow: 1}]}
                                    value={this.state.newStackName}
                                    autoFocus={true}
                                    maxLength={100}
                                    onBlur={() => {
                                        this.setState({addingStack: false})
                                        this.setState({ newStackName: '' })
                                    }}
                                    onChangeText={newStackName => {
                                        this.setState({ newStackName })
                                    }}
                                    onSubmitEditing={() => this.createStack(this.state.newStackName)}
                                    placeholder={i18n.t('newStackHint')}
                                    returnKeyType='send'
                                />
                            </View>
                        </View>
                    }
                </DraxProvider>
            )
        }
    }

    createStack(stackName) {
        console.log('Creating stack', stackName)
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`,
            {
                title: stackName,
                order: 10 // TODO depends on other stacks in the board
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
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
            console.log(error)
        })
    }

    async loadBoard() {

        console.log('Retrieving board details from server')
        this.setState({
            refreshing: true
        })

        await axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        }).then((resp) => {

            // TODO check for error
            console.log('board details retrieved from server')
            this.setState({
                refreshing: false
            })

            // Update board's details in store
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
                    index:  this.props.route.params.stackId !== null ? parseInt(this.props.route.params.stackId) : resp.data[0].id,
                })
            }

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
            { headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then(() => {
            // TODO check for error
            console.log('card moved')
            // Refresh board
            return this.loadBoard()
        })
        .catch(() => {
            // Reverts change and inform user
            // TODO inform user
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
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
            console.log(error)
        })
    }

    deleteCard(cardId) {
        console.log(`deleting card ${cardId}`)
        axios.delete(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${cardId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card deleted')
                this.props.deleteCard({
                    boardId: this.props.route.params.boardId,
                    stackId: this.state.index,
                    cardId,
                })
            }
        })
        .catch((error) => {
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
        addStack,
        deleteCard,
        deleteStack,
        moveCard,
        setServer,
        setToken,
    }, dispatch)
)

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(BoardDetails)