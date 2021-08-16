import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addStack, moveCard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DraxProvider, DraxView } from 'react-native-drax';
import axios from 'axios';

const styles = StyleSheet.create({
    card: {
        flex: 1,
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 10,
        margin: 2,
        minHeight: 60,
        maxHeight: 60
    },
    cardTitle: {
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
      },    
    stackBar: {
        flex: 1,
        flexDirection: 'row',
        maxHeight: 40
    },
    stackTab: {
        flexGrow: 1,
        backgroundColor: 'lightskyblue',
        justifyContent: 'center'
    },
    stackTabDraggedOver: {
        borderColor: 'yellow',
        borderWidth: 1
    },
    stackTabText: {
        textAlign: 'center',
        textTransform: 'uppercase',
        color: 'white'
    },
    stackTabTextSelected: {
        fontWeight: 'bold'
    },
    stackTabTextNormal: {
        fontWeight: 'normal'
    }
})

// Component that display a board's cards, grouped by stack
class BoardDetails extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            index: 0,   // the index of the stack currently shown
            refreshing: false,
        }
        this.loadBoard = this.loadBoard.bind(this)
        this.moveCard = this.moveCard.bind(this)
    }

    _handleIndexChange = index => this.setState({ index })

    // Gets the board's details from the server and setup the page's header bar
    componentDidMount() {
        this.loadBoard()
        this.props.navigation.setOptions({
            headerTitle: 'Board details',
            headerRight: () => (<AppMenu/>)
        })    
    }

    render() {
        return (
            <DraxProvider>
                <View style={styles.stackBar} >
                {this.props.boards.value[this.props.route.params.boardId].stacks.map(stack => (
                    <DraxView
                        key={stack.id}
                        style={styles.stackTab}
                        receivingStyle={styles.stackTabDraggedOver}
                        onReceiveDragDrop={({ dragged: { payload } }) => {
                            console.log(`moving card ${payload}`);
                            this.moveCard(payload, stack.id)
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
                            <Text style={[styles.stackTabText, this.state.index === stack.id ? styles.stackTabTextSelected : styles.stackTabTextNormal]}>
                                {stack.title}
                            </Text>
                        </Pressable>
                    </DraxView>
                ))}
                </View>
                {typeof this.props.boards.value[this.props.route.params.boardId].stacks[this.state.index] !== 'undefined' && typeof this.props.boards.value[this.props.route.params.boardId].stacks[this.state.index].cards !== 'undefined' && 
                    <ScrollView contentContainerStyle={styles.container}
                        refreshControl={
                            <RefreshControl                           
                                refreshing={this.state.refreshing}
                                onRefresh={this.loadBoard}
                            />
                        } 
                    >
                    {Object.values(this.props.boards.value[this.props.route.params.boardId].stacks[this.state.index].cards).map(card => (
                        <DraxView
                            key={card.id}
                            payload={card.id}
                            style={styles.card}
                            onDragEnd={(event) => {
                                // Shows selected card's details when the user just clicked the card
                                if (event.dragTranslation.x < 5 &&
                                    event.dragTranslation.x > -5 &&
                                    event.dragTranslation.y < 5 && 
                                    event.dragTranslation.y > -5) {
                                    this.props.navigation.navigate('CardDetails',{
                                        boardId: this.props.route.params.boardId,
                                        stackId: this.state.index,
                                        cardId: card.id
                                    })
                                }
                            }}
                        >
                            <Text style={styles.cardTitle}>
                                {card.title}
                            </Text>
                        </DraxView>
                    ))}
                    </ScrollView>
                }
                <Pressable
                    style={[styles.card, {marginBottom: 40}]}
                    onPress={() => {this.props.navigation.navigate('NewCard', {
                        boardId: this.props.route.params.boardId,
                        stackId: this.state.index,                              
                    })}}
                >
                    <Text style={styles.cardTitle}>
                        Create card
                    </Text>
                </Pressable>
            </DraxProvider>
        )
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
            this.setState({
                index: Math.min(...Object.keys(this.props.boards.value[this.props.route.params.boardId].stacks)),
            })
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