import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addStack, moveCard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { DraxProvider, DraxView } from 'react-native-drax';
import axios from 'axios';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { i18n } from '../i18n/i18n.js';

// Component that display a board's cards, grouped by stack
class BoardDetails extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
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

    // Function to change the displayed stack
    _handleIndexChange = index => this.setState({ index })

    // Function to detect long press on card
    cardPressedDown = (id) => {
        this.setState({cardPressed: id})
        setTimeout(() => {
            if(this.state.cardPressed === id) {
                console.log(`open context menu of card ${id}`)
                this.setState({cardPressed: -1}) // reset
            }
        }, 500)
    }

    // Gets the board's details from the server and setup the page's header bar
    async componentDidMount() {
        this.props.navigation.setOptions({
            headerTitle: 'Board details',
            headerRight: () => (<AppMenu/>)
        })
        await this.loadBoard()
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
                                onSubmitEditing={() => this.createStack()}
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
                    <ScrollView
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
                            <ScrollView style={this.props.theme.stackBar} 
                                horizontal
                                contentContainerStyle={{ flex: 1 }} >
                                {stacks.map(stack => (
                                    <DraxView
                                        key={stack.id}
                                        style={this.props.theme.stackTab}
                                        receivingStyle={this.props.theme.stackTabDraggedOver}
                                        onReceiveDragDrop={({ dragged: { payload } }) => {
                                            // Don't try to move card when the drop stack is the same
                                            if (stack.id !== payload.stackId) {
                                                console.log(`moving card ${payload.id}`);
                                                this.moveCard(payload.id, stack.id)
                                            }
                                        }}
                                    >
                                        <Pressable
                                            key={stack.id}
                                            onPress={() => {
                                                // Switches to selected stack
                                                this.setState({
                                                    index: stack.id
                                                })
                                            }}
                                        >
                                            <Text style={[this.props.theme.stackTabText, this.state.index === stack.id ? this.props.theme.stackTabTextSelected : this.props.theme.stackTabTextNormal]}>
                                                {stack.title}
                                            </Text>
                                        </Pressable>
                                    </DraxView>
                                ))}
                            </ScrollView>
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
                                        onDragEnd={({dragTranslation}) => {
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
                    </ScrollView>
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
                </DraxProvider>
            )
        }
    }

    createStack() {
        console.log('Creating stack', this.state.newStackName)
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`,
            {
                title: this.state.newStackName,
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
                this.props.addStack({
                    boardId: this.props.route.params.boardId,
                    stack: resp.data
                })
                // Select new stack
                this.setState({
                    index: this.props.boards.value[this.props.route.params.boardId].stacks[0].id,
                })
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }

    loadBoard() {
        this.setState({
            refreshing: true
        })
        axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then((resp) => {
            this.setState({
                refreshing: false
            })
            console.log('cards retrieved from server')
            // TODO check for error
            resp.data.forEach(stack => {
                this.props.addStack({
                    boardId: this.props.route.params.boardId,
                    stack
                })
            })
            // Shows stack with order === 0, if stacks are available
            if (this.props.boards.value[this.props.route.params.boardId].stacks?.length) {
                this.setState({
                    index: this.props.boards.value[this.props.route.params.boardId].stacks[0].id,
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
        .then((resp) => {
            // TODO check for error
            console.log('card moved')
            // Refresh board
            return this.loadBoard()
        })
        .catch((error) => {
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
}

// Connect to store
const mapStateToProps = state => ({
    boards: state.boards,
    server: state.server,
    theme: state.theme,
    token: state.token
})

const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        addStack,
        moveCard,
        setServer,
        setToken
    }, dispatch)
)

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BoardDetails)