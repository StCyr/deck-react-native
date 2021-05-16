import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    pageTitle: {
      fontSize: 32,
      fontWeight: 'bold'
    },
    boardTitle: {
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 20,
      fontWeight: 'bold',
      margin: 20
    },
  });
  
// Component that display a board's details
export default class BoardDetailsScreen extends React.Component {
    constructor(props) {
      console.log('props', props)
      super(props)
      this.state = {
        stacks: []
      }
    }
  
    componentDidMount() {
      axios.get(`http://192.168.0.128/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
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
            stacks: resp.data
          })
        })  
    }
  
    boardStyle = function(color) {
      console.log('color',color)
      return {
        backgroundColor: '#' + color,
        width: '95%',
        borderRadius: 10,
        margin: 2
      }
    }
  
    render() {
      return <View style={styles.container}>
        <Text style={styles.pageTitle}>
          Boards
        </Text>
        {this.state.stacks.map((board) => 
          <Pressable
            key={board.id}
            // TODO navigate to board
            onPress={() => {this.props.navigation.navigate('BoardDetails')}}
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
          </Pressable>
      </View>
    }
  }