import React from 'react';
import env from './environment'; // For debugging
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './components/Login';
import Home from './components/Home';
import AllBoards from './components/AllBoards';
import BoardDetails from './components/BoardDetails';
import Card from './components/Card';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from './store/serverSlice';
import { setToken } from './store/tokenSlice';
import * as Linking from 'expo-linking'; // For creating an URL handler to retrieve the device token
import {encode as btoa} from 'base-64'; // btoa isn't supported by android (and maybe also iOS)

// Create Stack navigator
const Stack = createStackNavigator()

// Application
class App extends React.Component {

  constructor(props) {
    console.log('initialising app')
    super(props)

     // Register handler to catch Nextcloud's redirect after successfull login
    Linking.addEventListener('url', (url) => {this.handleRedirect(url)})
  }

  componentDidMount() {
    // Retrieve token from storage if available
    if (!env.expoDebug) {
      AsyncStorage.getItem('NCtoken').then(token => {
        if (token !== null) {
          console.log('token retrieved from asyncStorage', token)
          this.props.setToken('Basic ' + token)
          AsyncStorage.getItem('NCserver').then(server => {
            if (server !== null) {
              console.log('server retrieved from asyncStorage', server)
              this.props.setServer(server)    
            }
          })
        }
      })
    } else {
      // Expo doesn't support registering URL protocol handler so we hardcode 
      // authentication parameters in environment.js file
      console.log('expo debug mode: setting token and server from hardcoded value')
      this.props.setToken(env.token)
      this.props.setServer(env.server)
    }
  }

  // Function to retrieve the device's token and save it after user logged in
  handleRedirect = async ({url}) => {
    if (url.startsWith('nc://login/server')) {
        console.log('Received the expected nc:// redirect', url)
        user = decodeURIComponent(url.substring(url.lastIndexOf('user:')+5, url.lastIndexOf('&')))
        pwd = url.substring(url.lastIndexOf(':')+1)
        token = btoa(user + ':' + pwd)
        console.log('Persisting token in asyncStorage', token)
        // TODO Use expo-secure-store to securely store the token
        AsyncStorage.setItem('NCtoken', token);  
        console.log('Saving token in store')
        this.props.setToken('Basic ' + token)
    }
  }

  render() {
    if (this.props.token.value === null || this.props.server.value === null) {
      // No token is stored yet, we need to get one
      return (
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Home" component={Home} options={{ title: 'Login' }}/>
              <Stack.Screen name="Login" component={Login}/>
            </Stack.Navigator>
          </NavigationContainer>
      ) 
    } else {
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior='padding'>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="AllBoards" component={AllBoards} />
              <Stack.Screen name="BoardDetails" component={BoardDetails} />
              <Stack.Screen name="CardDetails" component={Card} />
              <Stack.Screen name="NewCard" component={Card} />
            </Stack.Navigator>
          </NavigationContainer>
        </KeyboardAvoidingView>
      )
    }
  }
}

// Connect to store
const mapStateToProps = state => ({
  token: state.token,
  server: state.server
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
