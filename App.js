import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import Login from './components/Login';
import Home from './components/Home';
import AllBoards from './components/AllBoards';
import BoardDetails from './components/BoardDetails';
import CardDetails from './components/CardDetails';

const Stack = createStackNavigator()

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      token: null
    }
    // Retrieve token from storage if available
    AsyncStorage.getItem('token').then(token => {
      console.log('get token from storage', token)
      this.setState({token})  
    })
    // Register handler to catch Nextcloud's redirect after successfull login
    Linking.addEventListener('url', (url) => {this.handleRedirect(url)})
  }

  // function to retrieve the device's token after user logged in
  handleRedirect = async (url) => {
    if (url.url.startsWith('nc://login/server')) {
      try {
        token = url.url.substring(url.url.lastIndexOf(':'))
        console.log('Persisting token', token)
        AsyncStorage.setItem('token', token);  
        this.setState({token})
      } catch (e) {
        // TODO
      } 
    }
  }

  render() {
    console.log('rendering')
    if (this.state.token === null) {
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
