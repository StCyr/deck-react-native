import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

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
  
// Component that display the user's boards
export default class BoardScreen extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        boards: []
      }
    }
  
    componentDidMount() {
      axios.get('http://192.168.0.128/index.php/apps/deck/api/v1.0/boards', {
        headers: {
          'OCS-APIRequest': 'true',
          'Content-Type': 'application/json',
          // TODO Use the token retrieved during user login
          'Authorization': 'Basic YWRtaW46YWRtaW4='
        }
      })
        .then((resp) => {
          this.setState({
            // TODO check for error
            boards: resp.data
          })
        })  
    }
  
    boardStyle = function(color) {
      return {
        backgroundColor: '#' + color,
        width: '95%',
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
              Create new board
            </Text>
          </Pressable>
      </View>
    }
  }