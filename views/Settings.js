//===============================================================================================================================================
//
// Settings: The app's Settings view
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

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pressable, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import axios from 'axios'
import { deleteAllBoards } from '../store/boardSlice'
import { setServer } from '../store/serverSlice'
import { setToken } from '../store/tokenSlice'
import { setColorScheme } from '../store/colorSchemeSlice'
import { i18n } from '../i18n/i18n.js'
import { showPaywall } from '../utils'
import { getColors } from '../styles/base.js'

const Settings = () => {

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)
    const token = useSelector(state => state.token)
    const colorScheme = useSelector(state => state.colorScheme)
    const dispatch = useDispatch()
    const radioOptions = ['os','light','dark']

    return (
        <View>
            <View style={{marginHorizontal: 20}}>
                <Text style={theme.title}>
                    {i18n.t('theme')}
                </Text>
                <View>
                    <SegmentedControl
                        values={ [i18n.t(radioOptions[0]), i18n.t(radioOptions[1]), i18n.t(radioOptions[2])] }
                        fontStyle = {colorScheme.value === 'os' ? {} : { color: getColors(colorScheme.value).text}}
                        activeFontStyle = {colorScheme.value === 'os' ? {} : { color: getColors(colorScheme.value).textReverted}}
                        selectedIndex={radioOptions.indexOf(colorScheme.value ?? 'os')}
                        onChange={(event) => {
                            AsyncStorage.setItem('colorScheme', radioOptions[event.nativeEvent.selectedSegmentIndex] )
                            dispatch(setColorScheme(radioOptions[event.nativeEvent.selectedSegmentIndex]));
                        }}
                    />
                </View>
            </View>
            <View style={{marginHorizontal: 20}}>
                <Text style={theme.title}>
                    {i18n.t('subscriptions')}
                </Text>
                <View >
                    <Text>
                        {i18n.t('useAppWithoutAds')}
                    </Text>
                    <Pressable style={theme.button}
                        onPress={() => {
                            showPaywall(false)
                        }}
                    >
                        <Text style={theme.buttonTitle}>
                            {i18n.t('subscribe')}
                        </Text>
                    </Pressable>
                </View>
            </View>
            <View style={{margin: 20}}>
                <Pressable style={[theme.button, theme.buttonDestruct]}
                    onPress={() => {
                        console.log('Logging out user')
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
                            console.warn('Error occured while logging user out from server. Trying to clear session here anyway')
                            AsyncStorage.clear()
                            dispatch(setToken(null))
                            dispatch(setServer(null))
                            dispatch(deleteAllBoards())
                        })
                    }}
                >
					<Text style={[theme.buttonTitle, theme.buttonTitleDestruct]}>
						{i18n.t('logout')}
					</Text>
				</Pressable>
            </View>
        </View>
    )

}

export default Settings