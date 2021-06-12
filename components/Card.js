import React from 'react';
import { connect } from 'react-redux';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    descriptionInput: {
        height: 200,
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
            editable: false,
            card: {
                description: '',
                dueDate: new Date(),
                title: ''
            }
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
            this.setState({
                editable: false,
                card: resp.data
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
                <View style={styles.inputField}>
                    <Text h1 h1Style={styles.inputLabel}>
                        Due Date:
                    </Text>
                    <DateTimePicker
                        disabled={!this.state.editable}
                        value={this.state.card.dueDate}
                        mode="date"
                        display="default"
                        onChange={dueDate => {
                            this.setState({
                                card: {...this.state.card, dueDate}
                            })
                        }}
                    />
                </View>
                <View style={styles.inputField}>
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
                    ? <Button
                        title='Create'
                        onPress={this.onCreate}
                    />
                    : this.state.editable === false
                        ? <Button
                            title='Edit'
                            onPress={this.setState({
                                editable: true
                            })}
                        />
                        : <Button
                            title='Save'
                            onPress={this.onSave}
                        />
                }
                { this.state.editable === false &&
                    <Button
                        title='Delete'
                        onPress={this.onDelete}
                    />
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
                console.log('Card deleted')
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