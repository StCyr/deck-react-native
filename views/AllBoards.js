//===============================================================================================================================================
//
// AllBoards: A view displaying the user's boards
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

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { addBoard, deleteAllBoards } from '../store/boardSlice';
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';
import { Pressable, RefreshControl, ScrollView, View, Text, TextInput } from 'react-native';
import { DraxProvider } from 'react-native-drax';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {i18n} from '../i18n/i18n.js';
import axios from 'axios';
import AppMenu from '../components/AppMenu';
import Board from '../components/Board';
import { isUserSubscribed, showPaywall } from '../utils'
import {decode as atob} from 'base-64';
import { AppOpenAd } from 'react-native-google-mobile-ads';

class AllBoards extends React.Component {
  
    constructor(props) {
		super(props)
		this.state = {
			creatingBoard: false,
			lastRefresh: new Date(0),
			refreshing: false,
			newBoardName: '',
		}
		this.loadBoards = this.loadBoards.bind(this);
		this.insets = initialWindowMetrics?.insets ?? {
			left: 0,
			right: 0,
			bottom: 0,
			top: 0,
		}
		this.user = atob(this.props.token.value.substring(6)).split(':')[0] 
		this.appOpenAd = AppOpenAd.createForAdRequest("ca-app-pub-8838289832709828/1694360664", {
			requestNonPersonalizedAdsOnly: true,
		  })
		this.appOpenAd.load()
	}
  
	async componentDidMount() {

		this.props.navigation.setOptions({
			headerTitle: i18n.t('allBoards'),
			headerRight: () => (<AppMenu navigation={this.props.navigation} />)
		}, [this.props.navigation, this.props.setServer, this.props.setToken])

		// Showing AppOpen Ad
		if (this.user === 'apple') {
			showPaywall()
		} else {
			if (! await isUserSubscribed()) {
				// Show the app open ad when user brings the app to the foreground
				setTimeout(() => {
					// this.appOpenAd.show()
					this.appOpenAd.load()
				}, 2000)
			}
		}

		await this.loadBoards()

		// Navigate to last viewed board+stack on initial app load
		if (this.props.route.params.navigation.boardId !== null) {
			console.log('Initial app loading, navigating to last viewed board+stack')
			this.props.navigation.navigate('BoardDetails', {
				boardId: this.props.route.params.navigation.boardId,
				stackId: this.props.route.params.navigation.stackId,
			})
		}

    }
  
    render() {
		return (
			<DraxProvider>
				<ScrollView contentContainerStyle={this.props.theme.container}
					refreshControl={
						<RefreshControl
							refreshing={this.state.refreshing}
							onRefresh={this.loadBoards}
							size='large' />
					} >
						{typeof Object.values(this.props.boards.value) !== 'undefined' && Object.values(this.props.boards.value).map((board) => 
							<Board
								key={board.id}
								board={board}
								navigation={this.props.navigation} />
						)}
				</ScrollView>
				{!this.state.creatingBoard &&
					<View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
						<Pressable
							style={this.props.theme.button}
							onPress={() => {this.setState({creatingBoard: true})}} >
							<Text style={this.props.theme.buttonTitle}>
								{i18n.t('createBoard')}
							</Text>
						</Pressable>
					</View>
				}
				{this.state.creatingBoard &&
					<View style={[this.props.theme.container, {marginBottom: this.insets.bottom}]}>
						<View style={this.props.theme.inputButton} >
							<TextInput style={[this.props.theme.inputText, {flexGrow: 1}]}
								value={this.state.newBoardName}
								autoFocus={true}
								maxLength={100}
								onBlur={() => {
									this.setState({creatingBoard: false})
									this.setState({ newBoardName: '' })
								}}
								onChangeText={newBoardName => {
									this.setState({ newBoardName })
								}}
								onSubmitEditing={() => this.createBoard()}
								placeholder={i18n.t('newBoardHint')}
								returnKeyType='send' />
						</View>
					</View>
				}
			</DraxProvider>
		)  
	}

	createBoard() {
		this.setState({creatingBoard: false})
		this.setState({ newBoardName: '' })
		axios.post(this.props.server.value + `/index.php/apps/deck/api/v1.0/boards`,
			{
				title: this.state.newBoardName,
				color:  (Math.floor(Math.random() * 2 ** 24)).toString(16).padStart(0, 6)
			},
			{
				timeout: 8000,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': this.props.token.value
				},
			}
		).then((resp) => {
			if (resp.status !== 200) {
				Toast.show({
					type: 'error',
					text1: i18n.t('error'),
					text2: resp,
				})
				console.warn('Error', resp)
			} else {
				console.log('Board created')
				this.props.addBoard(resp.data)
			}
		}).catch((error) => {
			Toast.show({
				type: 'error',
				text1: i18n.t('error'),
				text2: error.message,
			})
			this.setState({ newBoardName: '' })
			console.warn(error)
		})
	}

	// Gets all user boards
	async loadBoards() {
		console.log('Retrieving boards from server')

		this.setState({
			refreshing: true
		})
    
		await axios.get(this.props.server.value + '/index.php/apps/deck/api/v1.0/boards', {
			timeout: 8000,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': this.props.token.value,
				// Doesn't work yet        'If-Modified-Since': this.state.lastRefresh.toUTCString()
			}
		})
		.then((resp) => {
			if (resp.status !== 200) {
				Toast.show({
					type: 'error',
					text1: i18n.t('error'),
					text2: resp,
				})
				console.warn('Error', resp)
			} else {
				console.log('boards retrieved from server')
				this.setState({
					lastRefresh: new Date(),
					refreshing: false
				})
				this.props.deleteAllBoards()
				resp.data.forEach(board => {
					// Do not display deleted and archived boards
					if (!board.archived && !board.deletedAt) {
						this.props.addBoard(board)
					}
				})
			}
		})
		.catch((error) => {
			Toast.show({
				type: 'error',
				text1: i18n.t('error'),
				text2: error.message,
			})
			this.setState({
				refreshing: false
			})
			console.warn('Error while retrieving boards from the server', error)
		})  
	}
    
}

// Connect to store
const mapStateToProps = state => ({
	boards: state.boards,
	server: state.server,
	theme: state.theme,
	token: state.token,
})
const mapDispatchToProps = dispatch => (
	bindActionCreators( {
		addBoard,
		deleteAllBoards,
		setServer,
		setToken
	}, dispatch)
)
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(AllBoards)
