import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyboardAvoidingView, Appearance } from 'react-native'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import Login from './views/Login'
import Home from './views/Home'
import AllBoards from './views/AllBoards'
import BoardDetails from './views/BoardDetails'
import CardDetails from './views/CardDetails'
import Settings from './views/Settings'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setServer } from './store/serverSlice'
import { setTheme } from './store/themeSlice'
import { setToken } from './store/tokenSlice'
import { setColorScheme } from './store/colorSchemeSlice'
import * as Linking from 'expo-linking' // For creating an URL handler to retrieve the device token
import {encode as btoa} from 'base-64' // btoa isn't supported by android (and maybe also iOS)
import * as Device from 'expo-device'
import * as ScreenOrientation from 'expo-screen-orientation'
import { adapty } from 'react-native-adapty' // in-app purchases
import mobileAds from 'react-native-google-mobile-ads'
import { AdEventType, AdsConsent, AppOpenAd } from 'react-native-google-mobile-ads'
import { isUserSubscribed } from './utils'

// Creates Stack navigator
const Stack = createStackNavigator()

// Prevents native splash screen from autohiding before App component declaration
SplashScreen.preventAutoHideAsync().catch(console.warn)

// Application
class App extends React.Component {

	async loadFonts() {
		console.log('Loading fonts')
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

		// Activates adapty and show ad if needed afterward
		console.log('Activating adapty')
		adapty.activate('public_live_dQQGIW4b.wZU2qtAbVtrojrx9ttUu').then( async () =>{
			console.log('adapty activated, waiting 1 second before checking user\'subscribtion')
			setTimeout(() => this.showAdIfNeeded(), 1000)
		} )		

	}

	// Try to show ad if user hasn't subscribed to a paying version of the app
	// For the moment, we just let the user use the app freely if he doesn't give consent for ads
	async showAdIfNeeded() {
		console.log('Adapty activated, checking if user is subscribed to a paying version of the app')
		if (! await isUserSubscribed()) {
			// User hasn't subscribed to a paying version of the app, we'll try to show him/her ads. 
			// Checks if we need to re-ask consent (eg: due to conditions change at provider-side)
			console.log('User has not subscribed to a paying version of the app, trying to display ads')
			console.log('Checking if we need to ask user consent to display ads')
			const consentInfo = await AdsConsent.requestInfoUpdate()
			if (consentInfo.status !== 'OBTAINED') {
				// Asks consent
				console.log('Asking user consent')
				await AdsConsent.loadAndShowConsentFormIfRequired();
			} else {
				console.log('Nope, we don\'t')
			}

			// Shows ad if user gaves enough consent
			console.log('checking user consents')
			const userChoice = await AdsConsent.getUserChoices();
			if (userChoice.storeAndAccessInformationOnDevice) {
				// Initializes ads
				console.log('Ok we got user consent to display ads')
				mobileAds().initialize().then(() => {
					let requestOptions = { requestNonPersonalizedAdsOnly: true }
					if (!userChoice.selectPersonalisedContent) {
						console.log('Not for personalised ads though')
						requestOptions = {}
					}
					const appOpenAd = AppOpenAd.createForAdRequest("ca-app-pub-8838289832709828/1694360664", requestOptions)
					appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
						console.log('Showing ad')
						appOpenAd.show()
					});
					console.log('Loading ad')
					appOpenAd.load()
				})
			} else {
				// For the moment, we just let the user use the app freely if he doesn't give consent for ads
				console.log('User did not gave enough consent to use admob (missing "storeAndAccessInformationOnDevice" right)')
			}
		} else {
			console.log('User is subscribed to a paying version of the app')
		}
	}

	async componentDidMount() {

		this.loadFonts()

		// Sets theme
		AsyncStorage.getItem('colorScheme').then(savedColorScheme => {

			let colorScheme
			if (savedColorScheme !== null && savedColorScheme !== 'os') {
				colorScheme = savedColorScheme
				console.log('colorScheme retrieved', colorScheme)
				this.props.setColorScheme(colorScheme)
			} else {
				// Using os colorscheme
				colorScheme = Appearance.getColorScheme()
				console.log('using OS colorsSheme')
				this.props.setColorScheme('os')
			}

			this.setState({ colorScheme: colorScheme})
			this.props.setTheme(colorScheme)
		})

		// Registers theme change subscription
		this._schemeSubscription = Appearance.addChangeListener(({ colorScheme }) => {
			this.setState({ colorScheme })
			this.props.setTheme(colorScheme)
			this.props.setColorScheme(colorScheme)
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
				console.log('token retrieved from asyncStorage')
				this.props.setToken('Basic ' + token)
				AsyncStorage.getItem('NCserver').then(server => {
					if (server !== null) {
						console.log('server retrieved from asyncStorage')
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
			let user = decodeURIComponent(url.substring(url.lastIndexOf('user:')+5, url.lastIndexOf('&'))).replace(/\+/g, ' ')
			console.log('User is', user)
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
								<Stack.Screen name="Settings" component={Settings} />
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
	colorScheme: state.colorScheme,
	server: state.server,
	theme: state.theme,
	token: state.token,
})
const mapDispatchToProps = dispatch => (
	bindActionCreators( {
		setColorScheme,
		setServer,
		setToken,
		setTheme,
	}, dispatch)
)
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(App)
