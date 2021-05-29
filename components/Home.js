import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'lightskyblue',
      },
    LoginForm: { 
        alignSelf: 'center',      
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'darkslateblue',
        backgroundColor: 'aliceblue',
        width: '70%',
        padding: 10
    },
    Input: {
        borderColor: 'darkslateblue',
        borderWidth: 1,
        borderRadius: 3,
        marginTop: 5,
        padding: 2,
        height: 30,
    },
});

// Component to specify the URL of the Nextcloud server to connect to
export default class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            NCServer: '',
        };

        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
      return (
            <View style={styles.container}>
                <View style={styles.LoginForm}>
                <Text>
                    Please enter the URL of your Nextcloud server
                </Text>
                <TextInput style={styles.Input} 
                    value={this.state.NCServer}
                    onChangeText={NCServer => { this.setState({NCServer})}}
                    placeholder='https://'
                />
                <Button
                    title='Sign In'
                    onPress={this.onSubmit}
                />
                </View>
            </View>

      )
    }

    onSubmit() {
        // Persists NC Server URL and open the login form
        console.log(this.state.NCServer)
        AsyncStorage.setItem('NCServer', this.state.NCServer);
        this.props.navigation.navigate('Login',{NCServer: this.state.NCServer})
    }
}