import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
        justifyContent: 'flex-start',
        maxHeight: '96%'
    },
    card: {
        borderWidth: 1,
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
class BoardDetails extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            index: 0,
            refreshing: false,
            routes: [{ key: 'loading', title: 'Loading' }],
            scenes: {loading: () => (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" />
                </View>
            )}
        }
        this.loadBoard = this.loadBoard.bind(this);
    }

    _handleIndexChange = index => this.setState({ index })

    componentDidMount() {
        this.loadBoard()
        this.props.navigation.setOptions({
            headerTitle: 'Board details',
            headerRight: () => (<AppMenu navigation={this.props.navigation} setServer={this.props.setServer} setToken={this.props.setToken} />)
          }, [this.props.navigation, this.props.setServer, this.props.setToken])    
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

    loadBoard() {
        // Gets the board 'stacks
        axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then((resp) => {
            console.log('cards retrieved from server')
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
                let buttons = []
                if (stack.hasOwnProperty('cards')) {
                    stack.cards.map((card) => {
                        buttons.push( 
                            <Pressable
                                key={card.id}
                                onPress={() => {this.props.navigation.navigate('CardDetails',{
                                    boardId: this.props.route.params.boardId,
                                    stackId: stack.id,
                                    cardId: card.id
                                })}}
                                style={styles.card} >
                                <Text style={styles.cardTitle}>
                                    {card.title}
                                </Text>
                            </Pressable>
                        )
                    })
                }
                const view = () => (
                    <View style={styles.container}>
                        <ScrollView contentContainerStyle={styles.container}
                            refreshControl={
                                <RefreshControl
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.loadBoard}
                                />
                            } >
                            {buttons}
                        </ScrollView>
                        <Pressable
                            onPress={() => {this.props.navigation.navigate('NewCard', {
                                boardId: this.props.route.params.boardId,
                                stackId: stack.id,                              
                            })}}
                            style={styles.card} >
                            <Text style={styles.cardTitle}>
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
    
}


// Connect to store
const mapStateToProps = state => ({
    server: state.server,
    token: state.token
  })
  const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        setServer,
        setToken
    }, dispatch)
  )
  export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(BoardDetails)