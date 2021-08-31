import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from '../store/serverSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, ImageBackground, StyleSheet, Text, TextInput, View } from 'react-native';
import {i18n} from '../i18n/i18n.js';

// Component to specify the URL of the Nextcloud server to connect to
class Home extends React.Component {
    constructor(props) {
        super(props);        
        this.state = {
            NCserver: ''
        }
        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
      return (
            <View style={styles.container}>
                <ImageBackground source={require('../assets/kanban.png')} style={styles.background}>
                    <View style={styles.LoginForm}>
                        <Text>
                            {i18n.t('setUrl')}
                       </Text>
                        <TextInput style={styles.Input} 
                            value={this.state.NCserver}
                            onChangeText={server => { 
                                this.setState({
                                    NCserver: server
                                })
                            }}
                            placeholder='https://'
                            autoCapitalize='none'
                            autoCorrect={false}
                            keyboardType='url'
                            textContentType='URL'
                        />
                        <Button
                            title={i18n.t('signIn')}
                            onPress={this.onSubmit}
                        />
                    </View>
                </ImageBackground>
            </View>
      )
    }

    onSubmit() {
        // Persists NC Server URL and open the login form
        console.log('Storing server address in redux store and AsyncStorage', this.state.NCserver)
        this.props.setServer(this.state.NCserver)
        AsyncStorage.setItem('NCserver', this.state.NCserver)
        console.log('Navigating')
        this.props.navigation.navigate('Login')
    }
}

// Connect to store
const mapStateToProps = state => ({
    server: state.server
})
const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        setServer,
    }, dispatch)
)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Home)

// Component styles
const styles = StyleSheet.create({
    background: {
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
    LoginForm: { 
        position: 'absolute',
        top: '10%',
        left: '15%',      
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'white',
        opacity: 0.95,
        width: '70%',
        height: 180,
        padding: 10,
        justifyContent: 'space-between',
    },
    Input: {
        borderColor: 'darkslateblue',
        backgroundColor: 'white',
        opacity: 1,
        borderWidth: 1,
        borderRadius: 3,
        marginTop: 5,
        padding: 2,
        height: 30,
    },
});