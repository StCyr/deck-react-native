//===============================================================================================================================================
//
// AssigneeList: A component to show or modify a card's assignees
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

import React, { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { Avatar } from 'react-native-elements'
import DropDownPicker from 'react-native-dropdown-picker'
import { useSelector } from 'react-redux'

// AssigneeList is displayed into a scrollview and I'm assuming there won't ever be a ton of users to display
// See also https://hossein-zare.github.io/react-native-dropdown-picker-website/docs/advanced/list-modes#notes
DropDownPicker.setListMode("SCROLLVIEW");

const AssigneeList = ({editable, boardUsers, cardAssignees, size='normal', udpateCardAsigneesHandler}) => {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(cardAssignees.map(user => user.participant.uid));

    const theme = useSelector(state => state.theme)
    const server = useSelector(state => state.server)

    // Updates parent when value changes
    useEffect(() => {
        if (typeof udpateCardAsigneesHandler !== 'undefined') {
            udpateCardAsigneesHandler(value)
        }
    }, [value])

    // Returns an URI to get a user's avatar
    const getUserUri = (user) => {
        if (size === 'small') {
            return server.value + '/index.php/avatar/' + user.participant.uid + '/32?v=2'
        } else {
            return server.value + '/index.php/avatar/' + user.participant.uid + '/40?v=2'
        }
    }
    
    // Computes the list of selectable users for the DropDownPicker
    const items = boardUsers?.map(user => {
        return {
            icon: () => <Image source={{uri: server.value + '/index.php/avatar/' + user.uid + '/32?v=2'}} style={{width:32, height:32, borderRadius:16}}/>,
            label: user.displayname,
            value: user.uid
        }
    })

    // Renders component
    if (editable) {
        return (
            <DropDownPicker
                items={items}
                multiple={true}
                open={open}
                value={value}
                setOpen={setOpen}
                setValue={setValue} />
        )
    } else {
        return (
            <View style={theme.cardLabelContainer} >
            {cardAssignees.map(user => 
                <Avatar
                    size={size === 'small' ? 32 : 40}
                    rounded
                    source={{uri: getUserUri(user)}}
                    title={user.participant.displayname}
                    key={user.participant.uid} />
            )}
        </View>
        )
    }

}

export default AssigneeList