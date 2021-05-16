import React from 'react';
import { Dimensions, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import axios from 'axios';

// Component that display a board's cards, grouped by stack using a TabView component
export default class BoardDetailsScreen extends React.Component {

    constructor(props) {
      super(props)
      this.state = {
        index: 0,
        routes: [],
      }
    }

    _handleIndexChange = index => this.setState({ index });

    componentDidMount() {
        // Get the board 'stacks and create the routes needed to render the TabView
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
            const routes = resp.data.map((stack) => {
                return {
                    key: stack.id,
                    title: stack.title
                }
            })
            this.setState({
                routes: routes
            })
        })
    }
  
    render() {
        let scenes = {}
        this.state.routes.forEach((route) => {
            view = () => (
                <View style={{ flex: 1}} />
            )
            scenes[route.key.toString()] = view
        })
        return <TabView
            navigationState={this.state}
            renderScene={SceneMap(scenes)}
            onIndexChange={this._handleIndexChange}
            initialLayout={{ width: Dimensions.get('window').width }} 
        />
    }
  }