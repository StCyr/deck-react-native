import axios from 'axios';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';

import { Image, Pressable, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppMenu extends React.Component {

    constructor(props) {
        super(props)
        this.menu = React.createRef();
    }

    render() {
        return (
            <View style={{marginRight: 15}}>
                <Menu
                    ref={this.menu}
                    button={
                        <Pressable
                            onPress={() => {
                                this.menu.current.show();
                            }}
                        >
                            <Image
                                style={{ width: 24, height: 24 }}
                                source={require('../assets/more.png')}
                            />
                        </Pressable>
                    }
                >
                    <MenuItem 
                        onPress={() => {
                            axios.delete(this.props.server.value + '/ocs/v2.php/core/apppassword', {
                                headers: {
                                    'OCS-APIREQUEST': true,
                                    'Authorization': this.props.token.value
                                }                    
                            }).then(resp => {
                                console.log('User logged out from server')
                                AsyncStorage.clear();
                                this.props.setToken(null)
                                this.props.setServer(null)  
                            })
                            .catch(error => {
                                console.log('Error occured while logging user out from server. Trying to clear session here anyway')
                                AsyncStorage.clear();
                                this.props.setToken(null)
                                this.props.setServer(null)  
                            })
                        }}
                    >
                        Logout
                    </MenuItem>
                </Menu>
            </View>
        )
    }

}

// Connect to store
const mapStateToProps = state => ({
    server: state.server,
    token: state.token
})

const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        setServer,
        setToken
    }, dispatch)
)

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AppMenu)