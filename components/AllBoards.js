import React from 'react';
import { connect } from 'react-redux';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import axios from 'axios';

// Component that display the user's boards
class AllBoards extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        refreshing: false,
        boards: []
      }
      this.loadBoards = this.loadBoards.bind(this);
    }
  
    componentDidMount() { 
      this.loadBoards()
    }
  
    boardStyle = function(color) {
      return {
        backgroundColor: '#' + color,
        width: '95%',
        borderWidth: 1,
        borderRadius: 10,
        margin: 2
      }
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
            {this.state.boards.map((board) => 
            <Pressable
              key={board.id}
              onPress={() => {
                this.props.navigation.navigate('BoardDetails',{
                  boardId: board.id
                })
              }}
              style={this.boardStyle(board.color)}
            >
              <Text style={styles.boardTitle}>
                {board.title}
              </Text>
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
        'OCS-APIRequest': 'true',
        'Content-Type': 'application/json',
        'Authorization': this.props.token.value
      }
    })
    .then((resp) => {
      console.log('boards retrieved from server')
      // TODO check for error
      this.setState({
        refreshing: false,
        boards: resp.data
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
  server: state.server,
  token: state.token
})
export default connect(mapStateToProps)(AllBoards)

// Component style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  boardTitle: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20
  },
});