import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    card: {
        width: '95%',
        borderRadius: 10,
        margin: 2
    },
    cardTitle: {
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        margin: 20
    },
});

// Component that display a board's cards, grouped by stack using a TabView component
export default class BoardDetailsScreen extends React.Component {

    constructor(props) {
      super(props)
      this.state = {
        index: 0,
        routes: [],
        cards: []
      }
    }

    _handleIndexChange = index => this.setState({ index })

    componentDidMount() {
        // Gets the board 'stacks
        axios.get(`http://192.168.0.128/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
            headers: {
                'OCS-APIRequest': 'true',
                'Content-Type': 'application/json',
                // TODO Use the token retrieved during user login
                'Authorization': 'Basic YWRtaW46YWRtaW4='
            }
        })
        .then((resp) => {
            // TODO check for error
            // Creates the routes needed to render the TabView
            let routes = []
            let cards = []
            resp.data.forEach((stack) => {
                routes.push({
                    key: stack.id,
                    title: stack.title
                })
                stack.cards.forEach((card) => {
                    cards.push({
                        id: card.id,
                        title: card.title,
                        stackId: card.stackId
                    })
                })
            })
            this.setState({
                routes: routes
            })
            this.setState({
                cards: cards
            })     
        })
    }
    
    render() {        
        // Creates the scenes that will be rendered within the TabView component
        let scenes = {}
        this.state.routes.forEach((route) => {
            const view = () => (
                    <View style={styles.container}>
                        {this.state.cards.filter(card => card.stackId === route.key).map((card) => 
                            <Pressable
                                key={card.id}
                                // TODO Show card details
                                onPress={() => {alert('hello')}}
                                style={styles.card}>
                                <Text style={styles.cardTitle}>
                                    {card.title}
                                </Text>
                            </Pressable>
                        )}
                    </View>
            )
            scenes[route.key.toString()] = view
        })

        // Renders the TabView component
        return (
            <TabView
                navigationState={this.state}
                renderScene={SceneMap(scenes)}
                onIndexChange={this._handleIndexChange}
                initialLayout={{ width: Dimensions.get('window').width }} 
            />
        )
    }
  }