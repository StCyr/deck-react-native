import React from 'react';
import { connect } from 'react-redux';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    Input: {
        width: '95%',
        borderColor: 'lightgrey',
        borderWidth: 1,
        borderRadius: 3,
        marginTop: 5,
        padding: 2,
        height: 30,
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
                        <TextInput style={styles.Input} 
                            value={this.state.title}
                            onChangeText={title => { 
                                this.setState({
                                    title: title
                                })
                            }}
                            placeholder='title'
                        />
                        <DateTimePicker style={styles.Input} 
                            testID="dateTimePicker"
                            value={this.state.dueDate}
                            mode="date"
                            display="default"
                            onChange={dueDate => {
                                this.setState({
                                    dueDate: DueDate
                                })
                            }}
                        />
                        <TextInput style={styles.Input} 
                            value={this.state.description}
                            onChangeText={description => { 
                                this.setState({
                                    description: description
                                })
                            }}
                            placeholder='description'
                        />
                        <Button
                            title='Create'
                            onPress={this.onSubmit}
                        />

            </View>

        )
    }

    onSubmit() {
        axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards/${this.props.route.params.boardId}/stacks/${this.props.route.params.stackId}/cards`, {
            headers: {
                'OCS-APIRequest': 'true',
                'Content-Type': 'application/json',
                'Authorization': this.props.token.value
            },
            data: {
                'title': this.state.title,
                'description': this.state.description,
                'duedate': this.state.duedate
            }
        })
        .then((resp) => {
            console.log(resp)
            if (resp.status !== 200) {
                console.log('Error', resp)
            } else {
                console.log('Card created')
            }
        })
        .catch((error) => {
        })
    }
  
}

// Connect to store
const mapStateToProps = state => ({
    server: state.server,
    token: state.token
})
export default connect(mapStateToProps)(NewCard)