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

import React from 'react'
import { useSelector } from 'react-redux'
import { Pressable, View } from 'react-native'
import Icon from './Icon.js'

const AppMenu = ({navigation}) => {

    const theme = useSelector(state => state.theme)

    return (
        <View style={{marginRight: 15}}>
            <Pressable onPress={() => {navigation.navigate('Settings')}}>
                <Icon name='cog-alt' style={theme.icon} />
            </Pressable>
        </View>
    )

}

export default AppMenu
