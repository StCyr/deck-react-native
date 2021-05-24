import React from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import axios from 'axios';

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
        routes: [{ key: 'loading', title: 'Loading' }],
        scenes: {loading: () => (
            <View style={styles.loading}>
                <ActivityIndicator size="large" />
            </View>
          )}
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
            let routes = []
            let scenes = {}
            resp.data.forEach((stack) => {
                // Creates the routes needed for the TabView
                routes.push({
                    key: stack.id,
                    title: stack.title
                })
                // Creates the scenes needed for the TabView
                const view = () => (
                    <View style={styles.container}>
                        {stack.cards.map((card) => {
                            return <Pressable
                                key={card.id}
                                // TODO Show card details
                                onPress={() => {this.props.navigation.navigate('CardDetails',{
                                    boardId: this.props.route.params.boardId,
                                    stackId: stack.id,
                                    cardId: card.id
                                  })}}
                                style={styles.card}>
                                <Text style={styles.cardTitle}>
                                    {card.title}
                                </Text>
                            </Pressable>
                        }
                        )}
                        <Pressable
                            // TODO create 'onNewCard' action
                            onPress={() => {alert('hello')}}
                        >
                            <Text style={styles.boardTitle}>
                                Create card
                            </Text>
                        </Pressable>
                    </View>
                )
                scenes[stack.id.toString()] = view
            })

            this.setState({
                routes: routes,
                scenes: scenes
            })
        })
    }

    render() {
        return (
            <TabView
                navigationState={this.state}
                renderScene={SceneMap(this.state.scenes)}
                onIndexChange={this._handleIndexChange}
                initialLayout={{ width: Dimensions.get('window').width }} 
            />
        )
    }
  }