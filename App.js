import React from 'react';

// Persistent storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Login';
import Home from './Home';
import BoardScreen from './BoardScreen';
import BoardDetailsScreen from './BoardDetailsScreen';
import CardDetailsScreen from './CardDetailsScreen';

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
              <Stack.Screen name="AllBoard" component={BoardScreen} options={{title: 'All boards'}} />
              <Stack.Screen name="BoardDetails" component={BoardDetailsScreen} options={{title: 'Board details'}} />
              <Stack.Screen name="CardDetails" component={CardDetailsScreen} options={{title: 'Card details'}} />
            </Stack.Navigator>
          </NavigationContainer>
        </Provider>
      )
    }
  }
}