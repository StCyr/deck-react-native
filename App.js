import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import WebView from 'react-native-webview';
import BoardScreen from './BoardScreen';


const Stack = createStackNavigator();

 // login and get a device token if necessary
 function LoginScreen() {
    return (
        <WebView
          source={{
            uri: 'http://192.168.0.128/index.php/login/flow', 
            headers: { 'OCS-APIREQUEST': 'true'}
          }} />
    )
}

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
      <Stack.Navigator>
        {token === true ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen
            name="Home"
            component={BoardScreen}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App;