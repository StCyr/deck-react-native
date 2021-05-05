import React, { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import WebView from 'react-native-webview';
import axios from 'axios';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    justifyContent: "center"
  },
});

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

function HomeScreen() {
  axios.get('http://192.168.0.128/index.php/apps/desk/api/v1.0/boards', {
    headers: {
      'OCS-APIRequest': 'true',
      'Content-Type': 'application/json'
    }
  })
    .then((resp) => {
      boards = resp
    })

  return (
    <View style={styles.container}>
      {boards.map((board) => 
        <Button>
        </Button>
}     )}
    </View>
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
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App;