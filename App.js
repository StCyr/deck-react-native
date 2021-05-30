import React from 'react';

// Persistent storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// UI
import Login from './components/Login';
import Home from './components/Home';
import AllBoards from './components/AllBoards';
import BoardDetails from './components/BoardDetails';
import CardDetails from './components/CardDetails';

// Store
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from './store/serverSlice';
import { setToken } from './store/tokenSlice';

// For creating an URL handler to retrieve the device token
import * as Linking from 'expo-linking';

// Create Stack navigator
const Stack = createStackNavigator()

// Application
class App extends React.Component {

  constructor(props) {
    console.log('initialising app')
    super(props)

    // Retrieve token from storage if available
    const expoDebug = false
    if (!expoDebug) {
      AsyncStorage.getItem('token').then(token => {
        if (token !== null) {
          console.log('token retrieved from asyncStorage')
          this.props.setToken('Bearer ' + token)
        }
      })
    } else {
      // Expo doesn't support registering URL protocol handler
      console.log('expo debug mode: setting token and server from hardcoded value')
      this.props.setToken('Basic YWRtaW46YWRtaW4=')
      this.props.setServer('https://nextcloud-dev.bollu.be')
    }

    // Register handler to catch Nextcloud's redirect after successfull login
    Linking.addEventListener('url', (url) => {this.handleRedirect(url)})
  }

  // Function to retrieve the device's token and save it after user logged in
  handleRedirect = async (url) => {
    if (url.url.startsWith('nc://login/server')) {
      console.log('Received the expected nc:// redirect')
      try {
        token = url.url.substring(url.url.lastIndexOf(':'))
        console.log('Persisting token in asyncStorage')
        AsyncStorage.setItem('token', token);  
        console.log('Saving token in store')
        this.props.setToken('Bearer ' + token)
      } catch (e) {
        // TODO
      } 
    }
  }

  render() {
    if (this.props.token.value === null) {
      // No token is stored yet, we need to get one
      return (
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Login" component={Login} />
            </Stack.Navigator>
          </NavigationContainer>
      ) 
    } else {
      return (
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="AllBoards" component={AllBoards} options={{title: 'All boards'}} />
            <Stack.Screen name="BoardDetails" component={BoardDetails} options={{title: 'Board details'}} />
            <Stack.Screen name="CardDetails" component={CardDetails} options={{title: 'Card details'}} />
          </Stack.Navigator>
          </NavigationContainer>
      )
    }
  }
}

// Connect to store
const mapStateToProps = state => ({
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
)(App)
