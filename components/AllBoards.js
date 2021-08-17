import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { addBoard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';

import { Pressable, RefreshControl, ScrollView, View, Text, Image } from 'react-native';
import axios from 'axios';
import AppMenu from './AppMenu';
import createStyles from '../styles/base.js'

const styles = createStyles()

// Component that display the user's boards
class AllBoards extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        refreshing: false,
      }
      this.loadBoards = this.loadBoards.bind(this);
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
      )  
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
      resp.data.forEach(board => this.props.addBoard(board))
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