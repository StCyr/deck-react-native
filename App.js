import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoginForm from './LoginForm';
import aurora from './assets/aurora.jpg';

export default function App() {
  return (
    <View style={styles.container}>
      <ImageBackground source={aurora} style={styles.image}>
      <LoginForm />
      </ImageBackground>
      <StatusBar style="auto" />
    </View>
  );
}

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
