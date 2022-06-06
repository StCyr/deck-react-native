import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Appearance } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message'
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Login from './views/Login';
import Home from './views/Home';
import AllBoards from './views/AllBoards';
import BoardDetails from './views/BoardDetails';
import CardDetails from './views/CardDetails';
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

// Prevent native splash screen from autohiding before App component declaration

SplashScreen.preventAutoHideAsync()
	.then(result => console.log(`SplashScreen.preventAutoHideAsync() succeeded: ${result}`))
	.catch(console.warn);

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

		SplashScreen.hideAsync()

	}

	// Function to retrieve the device's token and save it after user logged in
	async handleRedirect({url}) {
		if (url.startsWith('nc://login/server')) {
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
								<Stack.Screen name="CardDetails" component={CardDetails} />
							</Stack.Navigator>
						</NavigationContainer>
						<Toast />
					</KeyboardAvoidingView>
				)
			}
		} else {
			return null
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
