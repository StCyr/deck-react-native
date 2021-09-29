import axios from 'axios';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { deleteAllBoards } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import { Image, Pressable, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {i18n} from '../i18n/i18n.js';
import Icon from './Icon.js';

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
                            <Icon name='more' />
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
                                AsyncStorage.clear()
                                this.props.setToken(null)
                                this.props.setServer(null)
                                this.props.deleteAllBoards()
                            })
                            .catch(error => {
                                console.log('Error occured while logging user out from server. Trying to clear session here anyway')
                                AsyncStorage.clear()
                                this.props.setToken(null)
                                this.props.setServer(null)
                                this.props.deleteAllBoards()
                            })
                        }}
                    >
                         {i18n.t('logout')}
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
        deleteAllBoards,
        setServer,
        setToken
    }, dispatch)
)

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AppMenu)