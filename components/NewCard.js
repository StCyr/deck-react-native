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
            title: '',
            description: '',
            dueDate: new Date(),
        }

        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.inputField}>
                    <Text h1 h1Style={styles.inputLabel}>
                        Title:
                    </Text>
                    <TextInput style={[styles.input, styles.titleInput]} 
                        value={this.state.title}
                        onChangeText={title => { 
                            this.setState({
                                title: title
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
                        value={this.state.dueDate}
                        mode="date"
                        display="default"
                        onChange={dueDate => {
                            this.setState({
                                dueDate: DueDate
                            })
                        }}
                    />
                </View>
                <View style={styles.inputField}>
                    <Text h1 h1Style={styles.inputLabel}>
                        Description:
                    </Text>
                    <TextInput style={[styles.input, styles.descriptionInput]} 
                        multiline={true}
                        value={this.state.description}
                        onChangeText={description => { 
                            this.setState({
                                description: description
                            })
                        }}
                        placeholder='description (optional)'
                    />
                </View>
                <Button
                    title='Create'
                    onPress={this.onSubmit}
                />
            </View>
        )
    }

    onSubmit() {
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards`,
            {
                'title': this.state.title,
                'description': this.state.description,
                'duedate': this.state.duedate
            },
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