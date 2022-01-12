import React from 'react'
import { useSelector } from 'react-redux'
import { ActivityIndicator, View } from 'react-native'
import { Text } from 'react-native-elements'

const Spinner = ({title}) => {

    const theme = useSelector(state => state.theme)

    return (
        <View style={theme.spinnerContainer}>
            {title &&
                <Text style={theme.spinnerText}>
                    {title}
                </Text>
            }
            <ActivityIndicator size='large' />
        </View>

    )

}

export default Spinner
