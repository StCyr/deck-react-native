import React from 'react';
import { ActionSheetIOS, Image, Pressable, View, Text, TextInput } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { addBoard, deleteBoard, renameBoard } from '../store/boardSlice';
import axios from 'axios';
import {i18n} from '../i18n/i18n.js';

// Component representing a user board
class Board extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            newBoardName: this.props.board.title,   // Stores the new board's name when editing a board's title
            renamingBoard: false     // Set to true to make the board's title editable
        }
        this.insets = initialWindowMetrics?.insets ?? {
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
          }    
    }
  
    render() {
        return (
            <Pressable
                onPress={() => {
                    // Opens board's details page
                    this.props.navigation.navigate('BoardDetails',{
                        boardId: this.props.board.id
                    })
                }}
                onLongPress={() => {
                    // Context menu
                    ActionSheetIOS.showActionSheetWithOptions(
                        {
                            options: [i18n.t("cancel"), i18n.t("rename"), i18n.t("archive"), i18n.t("delete")],
                            destructiveButtonIndex: 3,
                            cancelButtonIndex: 0,
                        },
                        buttonIndex => {
                            if (buttonIndex === 0) {
                                // cancel action
                            } else if (buttonIndex === 1) {
                                // Makes title editable
                                this.setState({ renamingBoard: true })
                            } else if (buttonIndex === 2) {
                                this.archiveBoard()
                            } else if (buttonIndex === 3) {
                                this.deleteBoard()
                            }
                        }
                    )                
                }}
                style={this.props.theme.card} >
                <View style={[this.props.theme.cardColor, {backgroundColor: `#${this.props.board.color}`}]} />
                {!this.state.renamingBoard &&
                    // Read only title
                    <Text style={this.props.theme.cardTitle}>
                        {this.props.board.title}
                    </Text>
                }
                {this.state.renamingBoard &&
                    // Editable title
                    <TextInput style={[this.props.theme.inputText, {flexGrow: 1}, {textAlign: 'left'}]}
                        value={this.state.newBoardName}
                        autoFocus={true}
                        maxLength={100}
                        onBlur={() => {
                            this.setState({ renamingBoard: false })
                            this.setState({ newBoardName: '' })
                        }}
                        onChangeText={newBoardName => {
                            this.setState({ newBoardName })
                        }}
                        onSubmitEditing={() => this.renameBoard()}
                        returnKeyType='done' />
                }
                <Image
                    style={{ width: 24, height: 24 }}
                    source={require('../assets/go.png')} />
            </Pressable> 
        )
    }

    archiveBoard() {
        this.props.deleteBoard({boardId: this.props.board.id})
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.board.id}`,
            {
                archived: true,
                color: this.props.board.color,
                title: this.props.board.title
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                this.props.addBoard(this.props.board)
                console.log('Error', resp)
            } else {
                console.log('Board archived')
            }
        })
        .catch((error) => {
            this.props.addBoard(this.props.board)
            console.log(error)
        })    
    }

    deleteBoard() {
        this.props.deleteBoard({boardId: this.props.board.id})
        axios.delete(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.board.id}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                this.props.addBoard(this.props.board)
                console.log('Error', resp)
            } else {
                console.log('Board deleted on server')
            }
        })
        .catch((error) => {
            this.props.addBoard(this.props.board)
            console.log(error)
        })    
    }

    renameBoard() {
        const boardNameBackup = this.props.board.title
        this.props.renameBoard({
            boardId: this.props.board.id,
            boardTitle: this.state.newBoardName
        })
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.board.id}`,
            {
                archived: false,
                color: this.props.board.color,
                title: this.state.newBoardName
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                this.props.renameBoard({
                    boardId: this.props.board.id,
                    boardTitle: boardNameBackup
                })
                console.log('Error', resp)
            } else {
                console.log('Board renamed')
            }
        })
        .catch((error) => {
            this.props.renameBoard({
                boardId: this.props.board.id,
                boardTitle: boardNameBackup
            })
            console.log(error)
        })    
    }

}

// Connect to store
const mapStateToProps = state => ({
    server: state.server,
    theme: state.theme,
    token: state.token,
})
const mapDispatchToProps = dispatch => (
    bindActionCreators({
        addBoard,
        deleteBoard,
        renameBoard,
    }, dispatch)
)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Board)
  