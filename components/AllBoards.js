import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { addBoard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import { Pressable, RefreshControl, ScrollView, View, Text, TextInput, Image } from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/EvilIcons';
import { DraxProvider } from 'react-native-drax';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import {i18n} from '../i18n/i18n.js';
import axios from 'axios';
import AppMenu from './AppMenu';
import createStyles from '../styles/base.js'

const styles = createStyles()

// Component that display the user's boards
class AllBoards extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        creatingBoard: false,
        refreshing: false,
        newBoardName: '',
      }
      this.loadBoards = this.loadBoards.bind(this);
      this.insets = initialWindowMetrics?.insets ?? {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
      }
    }
  
    componentDidMount() { 
      this.loadBoards()
      this.props.navigation.setOptions({
        headerTitle: 'All Boards',
        headerRight: () => (<AppMenu navigation={this.props.navigation} setServer={this.props.setServer} setToken={this.props.setToken} />)
      }, [this.props.navigation, this.props.setServer, this.props.setToken])
    }
  
    render() {
      return (
        <DraxProvider>
          <ScrollView contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this.loadBoards}
              />
            } >
              {typeof Object.values(this.props.boards.value) !== 'undefined' && Object.values(this.props.boards.value).map((board) => 
                <Pressable
                  key={board.id}
                  onPress={() => {
                    this.props.navigation.navigate('BoardDetails',{
                      boardId: board.id
                    })
                  }}
                  style={styles.card}
                >
                  <View style={[styles.cardColor, {backgroundColor: `#${board.color}`}]} />
                  <Text style={styles.cardTitle}>
                    {board.title}
                  </Text>
                  <Image
                    style={{ width: 24, height: 24 }}
                    source={require('../assets/go.png')}
                  />
                </Pressable>
              )}
          </ScrollView>
          {!this.state.creatingBoard &&
            <View style={[styles.container, {marginBottom: this.insets.bottom}]}>
              <Pressable
                style={styles.button}
                onPress={() => {this.setState({creatingBoard: true})}}
              >
                <Text style={styles.buttonTitle}>
                  {i18n.t('createBoard')}
                </Text>
              </Pressable>
            </View>
          }
          {this.state.creatingBoard &&
            <View style={[styles.container, {marginBottom: this.insets.bottom}]}>
              <View style={styles.inputButton} >
                <TextInput style={[styles.inputText, {flexGrow: 1}]}
                  value={this.state.newBoardName}
                  maxLength={100}
                  onChangeText={newBoardName => {
                    this.setState({ newBoardName })
                  }}
                  placeholder={i18n.t('newBoardHint')}
                />
                <Button
                  icon={
                    <Icon
                      name='arrow-right'
                      color='#b4b4b4'
                      size={30}
                    />
                  }
                  type='clear'
                  onPress={() => this.createBoard()}
                />
              </View>
            </View>
          }
        </DraxProvider>
      )  
  }

  createBoard() {
    this.setState({creatingBoard: false})
    this.setState({ newBoardName: '' })
    axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards`,
        {
            title: this.state.newBoardName,
            color:  (Math.floor(Math.random() * 2 ** 24)).toString(16).padStart(0, 6)
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
            console.log('Board created')
            this.props.addBoard(resp.data)
        }
    })
    .catch((error) => {
      this.setState({ newBoardName: '' })
      console.log(error)
    })
  }

  loadBoards() {
    // Get all user boards
    this.setState({
      refreshing: true
    })
    axios.get(this.props.server.value + '/index.php/apps/deck/api/v1.0/boards', {
        headers: {
        'Content-Type': 'application/json',
        'Authorization': this.props.token.value
        }
    })
    .then((resp) => {
      console.log('boards retrieved from server')
      // TODO check for error
      this.setState({
        refreshing: false,
      })
      resp.data.forEach(board => {
        if (!board.archived) {
          this.props.addBoard(board)
        }
      })
    })
    .catch((error) => {
      this.setState({
        refreshing: false
      })
      console.log('Error while retrieving boards from the server', error)
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
      addBoard,
      setServer,
      setToken
  }, dispatch)
)
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AllBoards)