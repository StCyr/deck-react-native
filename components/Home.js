import React from 'react';

// Store
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from '../store/serverSlice';

// Persistent storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// UI
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

// Component to specify the URL of the Nextcloud server to connect to
class Home extends React.Component {
    constructor(props) {
        super(props);
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
                    value={this.props.server.value}
                    onChangeText={server => { 
                        this.props.setServer(server) }}
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
        AsyncStorage.setItem('NCServer', this.props.server.value);
        this.props.navigation.navigate('Login')
    }
}

// Connect to store
const mapStateToProps = state => ({
    server: state.server
})
const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        setServer
    }, dispatch)
)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Home)

// Component styles
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