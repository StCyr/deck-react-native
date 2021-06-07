import React from 'react';
import { connect } from 'react-redux';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

// Component that display the user's boards
class AllBoards extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        boards: []
      }
    }
  
    componentDidMount() { 
      // Get all user boards
      axios.get(this.props.server.value + '/index.php/apps/deck/api/v1.0/boards', {
        headers: {
          'OCS-APIRequest': 'true',
          'Content-Type': 'application/json',
          'Authorization': this.props.token.value
        }
      })
        .then((resp) => {
          console.log('boards restrieved from server')
          // TODO check for error
          this.setState({
            boards: resp.data
          })
        })  
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
      return <View style={styles.container}>
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
          <Pressable
            // TODO create 'onNewBoard' action
            onPress={() => {alert('hello')}}
            style={this.boardStyle('lightblue')}
            >
            <Text style={styles.boardTitle}>
              Create board
            </Text>
          </Pressable>
      </View>
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