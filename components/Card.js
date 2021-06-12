import React from 'react';
import { connect } from 'react-redux';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-elements';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'blue',
        borderWidth: 1,
        borderRadius: 10,
        margin: 2,
        flexGrow: 0
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        flexGrow: 1
    },
    buttonText: {
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        margin: 20
      },
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexGrow: 1
    },
    descriptionInput: {
        flexGrow: 1,
    },
    input: {
        width: '100%',
        borderColor: 'lightgrey',
        fontSize: 20,
        borderWidth: 1,
        borderRadius: 3,
        margin: 5,
        padding: 2,
    },
    inputField: {
        marginBottom: 10,
    },
    inputLabel: {
        fontWeight: 'bold'
    },
    titleInput: {
        height: 40,
    },
});

class NewCard extends React.Component {

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
                'OCS-APIRequest': 'true',
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            }
        })
        .then((resp) => {
            // TODO check for error
            card = resp.data
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
            <View style={styles.container}>
                <View style={styles.inputField}>
                    <Text h1 h1Style={styles.inputLabel}>
                        Title:
                    </Text>
                    <TextInput style={[styles.input, styles.titleInput]} 
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
                    <Text style={{marginLeft: 5}}>
                        Set due date
                    </Text>
                 </View>
                { this.state.showDatePicker && 
                    <View style={styles.inputField}>
                        <Text h1 h1Style={styles.inputLabel}>
                            Due Date:
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
                    <Text h1 h1Style={styles.inputLabel}>
                        Description:
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
                                card = this.state.card
                                delete card.duedate
                                setState({
                                    card: card
                                }), () => {
                                    this.onCreate()
                                }
                            } else {
                                this.onCreate()
                            }
                        }}
                    >
                        <Text style={styles.buttonText}>
                            Create
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
                            <Text style={styles.buttonText}>
                                Edit
                            </Text>
                        </Pressable>
                        : <Pressable style={styles.button}
                            onPress={() => {
                            // We must not set a due date when the 'set due date' checkbock isn't checked
                            if (!this.state.showDatePicker) {
                                card = this.state.card
                                delete card.duedate
                                setState({
                                    card: card
                                }), () => {
                                    this.onSave()
                                }
                            } else {
                                this.onSave()
                            }
                        }}
                        >
                            <Text style={styles.buttonText}>
                                Save
                            </Text>
                        </Pressable>
                }
                { this.state.editable === false &&
                    <Pressable style={{...styles.button, backgroundColor: 'red'}}
                        onPress={this.onDelete}
                    >
                        <Text style={styles.buttonText}>
                            Delete
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
                    'OCS-APIRequest': 'true',
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card created')
                this.props.navigation.goBack()
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }
  
    onDelete() {
        axios.delete(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards/${this.props.route.params.cardId}`,
            {},
            {
                headers: {
                    'OCS-APIRequest': 'true',
                    'Content-Type': 'application/json',
                    'Authorization': this.props.token.value
                },
            })
        .then((resp) => {
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card deleted')
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
                    'OCS-APIRequest': 'true',
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
    server: state.server,
    token: state.token
})
export default connect(mapStateToProps)(NewCard)