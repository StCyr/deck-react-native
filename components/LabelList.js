//===============================================================================================================================================
//
// LabelList: A component to show or modify a card's label
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
import { Text, View } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { useSelector } from 'react-redux'

// LabelList is displayed into a scrollview and I'm assuming there won't ever be a ton of labels to display
// See also https://hossein-zare.github.io/react-native-dropdown-picker-website/docs/advanced/list-modes#notes
DropDownPicker.setListMode("SCROLLVIEW");
// To show selected labels (otherwise, only "x item(s) have been selected." is shown)
DropDownPicker.setMode("BADGE");

const LabelList = ({editable, boardLabels, cardLabels, size='normal', udpateCardLabelsHandler}) => {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(cardLabels?.map(item => item.id));

    const theme = useSelector(state => state.theme)

    // Updates parent when value changes
    useEffect(() => {
        if (typeof udpateCardLabelsHandler !== 'undefined') {
            udpateCardLabelsHandler(value)
        }
    }, [value])

    // default style. Will be overriden later depending on the size props
    var viewStyle = theme.cardDetailsLabel
    var textStyle = theme.cardDetailsLabelText
   
    // Computes the list of selectable labels for the DropDownPicker
    const items = boardLabels?.map(item => {
        return {
            containerStyle: { 
                backgroundColor: '#' + item.color,
                borderRadius: 24,
                margin: 2,
                minWidth: 0,
            },
            labelStyle: {
                fontWeight: "bold",
                justifyContent: 'center',
                textAlign: 'center',
            },
            label: item.title,
            value: item.id
        }
    })

    // Computes the colors of the selectable labels for the DropDownPicker
    const badgeColors = []
    boardLabels?.forEach(item => {

        // This is how badgeColors are looked up in DropDownPicker
        const str = item.id.toString()
        var idx = 0
        for (let i=0; i<str.length; i++) {
            idx += str.charCodeAt(i)
        }

        badgeColors[idx] = '#' + item.color
    })

    // Render
    if (editable) {
        return (
            <DropDownPicker
                labelStyle={{
                    fontWeight: "bold"
                  }}
                badgeColors={badgeColors}
                showBadgeDot={false}
                items={items}
                multiple={true}
                open={open}
                value={value}
                setOpen={setOpen}
                setValue={setValue} />
        )
    } else {
        if (size === 'small') {
            viewStyle = theme.cardLabel
            textStyle = theme.cardLabelText
        }
        return (
            <View style={theme.cardLabelContainer} >
                {cardLabels?.map(label => (
                    <View
                        key={label.id}
                        style={[viewStyle, { backgroundColor: '#' + label.color}]} >
                        <Text style={textStyle} >
                            {label.title}
                        </Text>
                    </View>
                ))}
            </View>
        )
    }

}

export default LabelList