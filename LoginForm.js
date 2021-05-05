import axios from 'axios';
import { createPortal } from 'react-dom';
import { Button, StyleSheet, TextInput, View } from 'react-native';
const React = require('react');

class LoginForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
        };

        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
      return (<View style={styles.LoginForm}>
                <TextInput style={styles.Input} 
                    value={this.state.username}
                    onChangeText={username => { this.setState({username: username})}}
                    placeholder='username' />
                <TextInput style={styles.Input}
                    secureTextEntry={true}
                    value={this.state.password}
                    onChangeText={password => { this.setState({password: password})}}
                    placeholder='password' />
                <Button title='Sign In' onPress={this.onSubmit}/>
             </View>
      )
    }

    onSubmit() {
        axios.post(server, {
            username: this.state.username,
            passowrd: this.state.password,
        }).then(resp => {
            console.log('hello');
        }).catch(e => {
            alert(e);
        })
    }
}

const styles = StyleSheet.create({
    LoginForm: {  
        alignSelf: 'center',      
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: '#55ACEE',
        width: '60%',
    },
    Input: {
        height: 45,
    },
});

export default LoginForm;