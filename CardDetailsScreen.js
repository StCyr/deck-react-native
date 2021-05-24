import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
  });
  
// Component that display a card's details
export default class CardDetailsScreen extends React.Component {
  
    constructor(props) {
      super(props)
      this.state = {
        card: {}
      }
    }
  
    componentDidMount() {
      axios.get(`http://192.168.0.128/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}`, {
        headers: {
          'OCS-APIRequest': 'true',
          'Content-Type': 'application/json',
          // TODO Use the token retrieved during user login
          'Authorization': 'Basic YWRtaW46YWRtaW4='
        }
      })
        .then((resp) => {
          console.log(resp.data)
          this.setState({
            // TODO check for error
            card: resp.data
          })
        })  
    }
  
    render() {
      return <View style={styles.container}>
          <Text>
              { this.state.card.title }
          </Text>
      </View>
    }
  }