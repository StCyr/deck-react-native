import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addCard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from 'react-native-elements';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as Localization from 'expo-localization';
import Toast from 'react-native-toast-message';
import {i18n} from '../i18n/i18n.js';

class Card extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            card: {},
            editable: false,
            showDatePicker: false,
        }

        this.onSave = this.onSave.bind(this);
    }

    componentDidMount() {
        // Setup page header
        this.props.navigation.setOptions({
            headerTitle: typeof this.props.route.params.cardId === 'undefined' ? 'New card' : 'Card details',
            headerRight: () => (<AppMenu navigation={this.props.navigation} setServer={this.props.setServer} setToken={this.props.setToken} />)
        }, [this.props.navigation, this.props.setServer, this.props.setToken])

        // Getting card details from server
        console.log('Getting card details from server')
        axios.get(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then((resp) => {
            // TODO check for error
            const card = resp.data
            card.duedate = card.duedate ? new Date(card.duedate) : null
            this.setState({
                card: card,
                editable: false,
                showDatePicker: card.duedate !== null ? true : false
            })
        })
    }

    render() {
        return (
            <ScrollView
                keyboardShouldPersistTaps="handled"
                style={[this.props.theme.container, {paddingBottom: 40, flex: 1}]}
                contentContainerStyle={{flexGrow: 1}}
            >
                <View style={this.props.theme.inputField}>
                    <Text h1 h1Style={this.props.theme.title}>
                        {i18n.t('title')}
                    </Text>
                    <TextInput style={this.state.editable ? this.props.theme.input : this.props.theme.inputReadMode}
                        editable={this.state.editable}
                        value={this.state.card.title}
                        onChangeText={title => { 
                            this.setState({
                                card: {...this.state.card, title}
                            })
                        }}
                        placeholder='title'
                    />
                </View>
                { this.state.editable &&
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <BouncyCheckbox
                            disableText={true}
                            isChecked={this.state.showDatePicker}
                            onPress={(isChecked) => {
                                this.setState({
                                    showDatePicker: isChecked,
                                    card: {
                                        ...this.state.card,
                                        // Unset duedate when checkbox is unchecked
                                        duedate: isChecked ? new Date() : null
                                    }
                                })
                            }}
                        />
                        <Text style={this.props.theme.textCheckbox}>
                            {i18n.t('setDueDate')}
                        </Text>
                    </View>
                }
                { this.state.showDatePicker &&
                    <View style={this.props.theme.inputField}>
                        <Text h1 h1Style={this.props.theme.title}>
                            {i18n.t('dueDate')}
                        </Text>
                        { this.state.editable ?
                            <DateTimePicker
                                disabled={!this.state.editable}
                                value={this.state.card.duedate ?? new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, dueDate) => {
                                    this.setState({
                                        card: {...this.state.card, duedate: dueDate}
                                    })
                                }}
                            />
                        :
                            <Text style={this.props.theme.inputReadMode}>
                               {this.state.card.duedate.toLocaleDateString(Localization.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        }
                    </View>
                }
                <View keyboardShouldPersistTaps="handled" style={{...this.props.theme.inputField, flexGrow: 1}}>
                    <Text h1 h1Style={this.props.theme.title}>
                        {i18n.t('description')}
                    </Text>
                    <TextInput style={this.state.editable ? [this.props.theme.input, this.props.theme.descriptionInput] : [this.props.theme.inputReadMode, this.props.theme.descriptionInput]}
                        editable={this.state.editable}
                        multiline={true}
                        value={this.state.card.description}
                        onChangeText={description => { 
                            this.setState({
                                card: {...this.state.card, description}
                            })
                        }}
                        placeholder='description (optional)'
                    />
                </View>
                { typeof this.props.route.params.cardId === 'undefined'
                    ? <Pressable style={this.props.theme.button}
                        onPress={() => {
                            // We must not set a due date when the 'set due date' checkbock isn't checked
                            if (!this.state.showDatePicker) {
                                const card = this.state.card
                                delete card.duedate
                                this.setState({
                                    card: card
                                }, this.onCreate)
                            } else {
                                this.onCreate()
                            }
                        }}
                    >
                        <Text style={this.props.theme.buttonTitle}>
                            {i18n.t('create')}
                        </Text>
                    </Pressable>
                    : this.state.editable === false
                        ? <Pressable style={this.props.theme.button}
                            onPress={() => {
                                this.setState({
                                    editable: true
                                })
                            }}
                        >
                            <Text style={this.props.theme.buttonTitle}>
                                {i18n.t('edit')}
                            </Text>
                        </Pressable>
                        : <Pressable style={this.props.theme.button}
                            onPress={() => {
                            // We must not set a due date when the 'set due date' checkbock isn't checked
                            if (!this.state.showDatePicker) {
                                const card = this.state.card
                                delete card.duedate
                                this.setState({
                                    card: card
                                }, this.onSave)
                            } else {
                                this.onSave()
                            }
                        }}
                        >
                            <Text style={this.props.theme.buttonTitle}>
                                {i18n.t('save')}
                            </Text>
                        </Pressable>
                }
            </ScrollView>
        )
    }
 
    onSave() {
        axios.put(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}`,
            this.state.card,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: resp,
                })
                console.log('Error', resp)
            } else {
                console.log('Card saved')
                this.props.navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
            if (error.message === 'Request failed with status code 403') {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: i18n.t('unauthorizedToEditCard'),
                })
            } else {
                Toast.show({
                    type: 'error',
                    text1: i18n.t('error'),
                    text2: error.message,
                })
            }
        })
    }

}

// Connect to store
const mapStateToProps = state => ({
    boards: state.boards,
    server: state.server,
    theme: state.theme,
    token: state.token
  })
  const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        addCard,
        setServer,
        setToken
    }, dispatch)
  )
  export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(Card)