import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import WebView from 'react-native-webview';
import BoardScreen from './BoardScreen';
import BoardDetailsScreen from './BoardDetailsScreen';
import CardDetailsScreen from './CardDetailsScreen';

 const App = () => {

  const [token, setToken] = useState(true);
  
  // function to retrieve the device's token after user logged in
  Linking.addEventListener('url', (url) => {this.handleRedirect(url)})
  handleRedirect = (url) => {
    if (url.url.startsWith('nc://login/server')) {
      setToken(url.url.substring(url.url.lastIndexOf(':')));  
    }

  }

  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
        {token !== true ? (
          // login and get a device token
          <WebView
            source={{
              uri: 'http://192.168.0.128/index.php/login/flow', 
              headers: { 'OCS-APIREQUEST': 'true'}
            }}
          />
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Home" component={BoardScreen} options={{title: 'All boards'}} />
            <Stack.Screen name="BoardDetails" component={BoardDetailsScreen} options={{title: 'Board details'}} />
            <Stack.Screen name="CardDetails" component={CardDetailsScreen} options={{title: 'Card details'}} />
          </Stack.Navigator>
          )}
    </NavigationContainer>
  )
}

export default App;