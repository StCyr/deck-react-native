import React from 'react';
import env from './environment'; // For debugging
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Appearance } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import Login from './components/Login';
import Home from './components/Home';
import AllBoards from './components/AllBoards';
import BoardDetails from './components/BoardDetails';
import Card from './components/Card';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from './store/serverSlice';
import { setTheme } from './store/themeSlice';
import { setToken } from './store/tokenSlice';
import * as Linking from 'expo-linking'; // For creating an URL handler to retrieve the device token
import {encode as btoa} from 'base-64'; // btoa isn't supported by android (and maybe also iOS)
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';

// Create Stack navigator
const Stack = createStackNavigator()

// Application
class App extends React.Component {

	async loadFonts() {
		await Font.loadAsync({
			deck: require('./assets/fonts/deck/deck.ttf'),
		})
		this.setState({ fontsLoaded: true })
	}

	constructor(props) {

		console.log('initialising app')

		super(props)

		this.state = {
			fontsLoaded: false,
			colorScheme: 'light',
			navigation: {},
		}

		// Force portrait mode on iPhones
		if (Device.modelId && Device.modelId.startsWith('iPhone')) {
			ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
		}

		// Register handler to catch Nextcloud's redirect after successfull login
		Linking.addEventListener('url', (url) => {this.handleRedirect(url)})
	}

	componentDidMount() {

		this.loadFonts()

		// get initial theme
		this.setState({ colorScheme: Appearance.getColorScheme()})
		this.props.setTheme(Appearance.getColorScheme());

		// register theme change subscription
		this._schemeSubscription = Appearance.addChangeListener(({ colorScheme }) => {
			this.setState({ colorScheme })
			this.props.setTheme(colorScheme);
		});

		// Retrieves last viewed board and stack if available
		AsyncStorage.getItem('navigation').then(navigation => {
			navigation = navigation != null ? JSON.parse(navigation) : { boardId: null, stackId: null }
			console.log('Retrieved last navigated board+stack')
			this.setState({navigation})
		})

		// Retrieve token from storage if available
		if (!env.expoDebug) {
			AsyncStorage.getItem('NCtoken').then(token => {
				if (token !== null) {
					console.log('token retrieved from asyncStorage', token)
					this.props.setToken('Basic ' + token)
					AsyncStorage.getItem('NCserver').then(server => {
						if (server !== null) {
							console.log('server retrieved from asyncStorage', server)
							this.props.setServer(server)
						}
					})
				}
			})
		} else {
			// Expo doesn't support registering URL protocol handler so we hardcode 
			// authentication parameters in environment.js file
			console.log('expo debug mode: setting token and server from hardcoded value')
			this.props.setToken(env.token)
			this.props.setServer(env.server)
		}

	}

	// Function to retrieve the device's token and save it after user logged in
	async handleRedirect({url}) {
		if (url.startsWith('nc://login/server')) {
			console.log('Received the expected nc:// redirect', url)
			const user = decodeURIComponent(url.substring(url.lastIndexOf('user:')+5, url.lastIndexOf('&')))
			const pwd = url.substring(url.lastIndexOf(':')+1)
			const token = btoa(user + ':' + pwd)
			console.log('Persisting token in asyncStorage', token)
			// TODO Use expo-secure-store to securely store the token
			AsyncStorage.setItem('NCtoken', token);  
			console.log('Saving token in store')
			this.props.setToken('Basic ' + token)
		}
	}

	render() {
		if(this.state.fontsLoaded && Object.keys(this.state.navigation).length !== 0) {
			if (this.props.token.value === null || this.props.server.value === null) {
				// No token is stored yet, we need to get one
				return (
					<NavigationContainer theme={this.state.colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
						<Stack.Navigator screenOptions={({navigation}) => {return {detachPreviousScreen: !navigation.isFocused()}}}>
							<Stack.Screen name="Home" component={Home} options={{ title: 'Login' }}/>
							<Stack.Screen name="Login" component={Login}/>
						</Stack.Navigator>
					</NavigationContainer>
				) 
			} else {
				return (
					<KeyboardAvoidingView style={{ flex: 1 }} behavior='padding'>
						<NavigationContainer theme={this.state.colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
							<Stack.Navigator
								screenOptions={({navigation}) => {return {detachPreviousScreen: !navigation.isFocused()}}}
								initialRouteName='AllBoards'
							>
								<Stack.Screen name="AllBoards" component={AllBoards} initialParams={{navigation: this.state.navigation}}/>
								<Stack.Screen name="BoardDetails" component={BoardDetails} />
								<Stack.Screen name="CardDetails" component={Card} />
								<Stack.Screen name="NewCard" component={Card} />
							</Stack.Navigator>
						</NavigationContainer>
					</KeyboardAvoidingView>
				)
			}
		} else {
			return <AppLoading />
		}
	}

}

// Connect to store
const mapStateToProps = state => ({
	server: state.server,
	theme: state.theme,
	token: state.token,
})
const mapDispatchToProps = dispatch => (
	bindActionCreators( {
		setServer,
		setToken,
		setTheme,
	}, dispatch)
)
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(App)
