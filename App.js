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
import { Provider } from 'react-redux';
import store from './store/store';

// For creating an URL handler to retrieve the device token
import * as Linking from 'expo-linking';

// Create Stack navigator
const Stack = createStackNavigator()

// Application
export default class App extends React.Component {

  constructor(props) {
    console.log('initialising app')
    super(props)

    // Retrieve token from storage if available
    AsyncStorage.getItem('token').then(token => {
      if (token !== null) {
        console.log('token retrieved from asyncStorage')
        store.dispatch({
          type: 'setToken',
          payload: token
        })
      }
})

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
        store.dispatch({ 
          type: 'setToken',
          payload: token
        })
      } catch (e) {
        // TODO
      } 
    }
  }

  render() {
    if (store.getState().token.value === null) {
      // No token is stored yet, we need to get one
      return (
        <Provider store={store}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Login" component={Login} />
            </Stack.Navigator>
          </NavigationContainer>
        </Provider>
      ) 
    } else {
      return (
        <Provider store={store}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="AllBoards" component={AllBoards} options={{title: 'All boards'}} />
            <Stack.Screen name="BoardDetails" component={BoardDetails} options={{title: 'Board details'}} />
            <Stack.Screen name="CardDetails" component={CardDetails} options={{title: 'Card details'}} />
          </Stack.Navigator>
        </Provider>
      )
    }
  }
}
