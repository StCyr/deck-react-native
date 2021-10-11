import React from 'react';
import { View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import axios from 'axios';
import {i18n} from '../i18n/i18n.js';

export default class CardMenu extends React.Component {

    constructor(props) {
        super(props)
        this.menu = React.createRef()
        this.moveCard = this.moveCard.bind(this)
    }

    render() {
        return (
            <View>
                <Menu
                    ref={this.menu}
                >
                    <MenuItem 
                        onPress={() => {
                            this.menu.current.hide();
                        }}
                    >
                        {i18n.t('moveCard')}
                    </MenuItem>
                </Menu>
            </View>
        )
    }

    moveCard() {
        // Gets the board 'stacks
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}/reorder`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then(() => {
        })
        
    }

}