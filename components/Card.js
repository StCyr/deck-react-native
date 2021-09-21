import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {addCard, deleteCard } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import AppMenu from './AppMenu';
import { Pressable, ScrollView, Platform, KeyboardAvoidingView, TextInput, View } from 'react-native';
import { Text } from 'react-native-elements';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import createStyles from '../styles/base.js';
import {i18n} from '../i18n/i18n.js';

const styles = createStyles()

class Card extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            card: {
                description: '',
                duedate: new Date(),
                title: ''
            },
            editable: false,
            showDatePicker: false,
        }

        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    componentDidMount() {
        this.props.navigation.setOptions({
            headerTitle: typeof this.props.route.params.cardId === 'undefined' ? 'New card' : 'Card details',
            headerRight: () => (<AppMenu navigation={this.props.navigation} setServer={this.props.setServer} setToken={this.props.setToken} />)
        }, [this.props.navigation, this.props.setServer, this.props.setToken])

        if (typeof this.props.route.params.cardId === 'undefined') {
            console.log('Creating new card')
            this.setState({
                editable: true,
            })
            return
        }

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
                showDatePicker: card.duedate ? true : false
            })
        })  
    }

    render() {
        return (
            <View style={[styles.container, {paddingBottom: 40, flex: 1}]}>
                <View style={styles.inputField}>
                    <Text h1 h1Style={styles.title}>
                        {i18n.t('title')}
                    </Text>
                    <TextInput style={styles.input} 
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
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <BouncyCheckbox
                        disableText={true}
                        isChecked={this.state.showDatePicker}
                        onPress={(isChecked) => {
                            this.setState({
                                showDatePicker: isChecked
                            })
                        }}
                    />
                    <Text style={styles.textCheckbox}>
                        {i18n.t('setDueDate')}
                    </Text>
                </View>
                { this.state.showDatePicker && 
                    <View style={styles.inputField}>
                        <Text h1 h1Style={styles.title}>
                        {i18n.t('dueDate')}
                        </Text>
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
                    </View>
                }
                <View style={{...styles.inputField, flexGrow: 1}}>
                    <Text h1 h1Style={styles.title}>
                        {i18n.t('description')}
                    </Text>
                    <TextInput style={[styles.input, styles.descriptionInput]} 
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
                    ? <Pressable style={styles.button}
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
                        <Text style={styles.buttonTitle}>
                            {i18n.t('create')}
                        </Text>
                    </Pressable>
                    : this.state.editable === false
                        ? <Pressable style={styles.button}
                            onPress={() => {
                                this.setState({
                                    editable: true
                                })
                            }}
                        >
                            <Text style={styles.buttonTitle}>
                                {i18n.t('edit')}
                            </Text>
                        </Pressable>
                        : <Pressable style={styles.button}
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
                            <Text style={styles.buttonTitle}>
                                {i18n.t('save')}
                            </Text>
                        </Pressable>
                }
                { this.state.editable === false &&
                    <Pressable style={[styles.button, styles.buttonDestruct]}
                        onPress={this.onDelete}
                    >
                        <Text style={[styles.buttonTitle, styles.buttonTitleDestruct]}>
                            {i18n.t('delete')}
                        </Text>
                    </Pressable>
                }                    
            </View>
        )
    }

    onCreate() {
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards`,
            this.state.card,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card created')
                this.state.card.id = resp.data.id
                this.props.addCard({
                    boardId: this.props.route.params.boardId,
                    stackId: this.props.route.params.stackId,
                    card: this.state.card
                })
                this.props.navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }
  
    onDelete() {
        axios.delete(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card deleted')
                this.props.deleteCard({
                    boardId: this.props.route.params.boardId,
                    stackId: this.props.route.params.stackId,
                    cardId: this.state.card.id
                })
                this.props.navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
        })
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
                console.log('Error', resp)
            } else {
                console.log('Card saved')
                this.props.navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }

}

// Connect to store
const mapStateToProps = state => ({
    boards: state.boards,
    server: state.server,
    token: state.token
  })
  const mapDispatchToProps = dispatch => (
    bindActionCreators( {
        addCard,
        deleteCard,
        setServer,
        setToken
    }, dispatch)
  )
  export default connect(
    mapStateToProps,
    mapDispatchToProps
  )(Card)