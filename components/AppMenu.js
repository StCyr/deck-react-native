//===============================================================================================================================================
//
// AppMenu: The three-dots menu in the upper-right corner of every screens
//
//  This file is part of "Nextcloud Deck".
//
// "Nextcloud Deck" is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//
// "Nextcloud Deck" is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warrant
// of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with "Nextcloud Deck". If not, see <https://www.gnu.org/licenses/>. 
//
//===============================================================================================================================================

import React from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { deleteAllBoards } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import { Pressable, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {i18n} from '../i18n/i18n.js';
import Icon from './Icon.js';
import axios from 'axios';

const AppMenu = () => {

    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const theme = useSelector(state => state.theme)
    const dispatch = useDispatch()

    const menu = React.createRef();

    return (
        <View style={{marginRight: 15}}>
            <Menu
                ref={menu}
                button={
                    <Pressable
                        onPress={() => {
                            menu.current.show();
                        }}
                    >
                        <Icon name='more' style={theme.icon} />
                    </Pressable>
                }
            >
                <MenuItem
                    onPress={() => {
                        axios.delete(server.value + '/ocs/v2.php/core/apppassword', {
                            timeout: 8000,
                            headers: {
                                'OCS-APIREQUEST': true,
                                'Authorization': token.value
                            }
                        }).then(() => {
                            console.log('User logged out from server')
                            AsyncStorage.clear()
                            dispatch(setToken(null))
                            dispatch(setServer(null))
                            dispatch(deleteAllBoards())
                        })
                        .catch(() => {
                            console.log('Error occured while logging user out from server. Trying to clear session here anyway')
                            AsyncStorage.clear()
                            dispatch(setToken(null))
                            dispatch(setServer(null))
                            dispatch(deleteAllBoards())
                        })
                    }}
                >
                     {i18n.t('logout')}
               </MenuItem>
            </Menu>
        </View>
    )

}

export default AppMenu