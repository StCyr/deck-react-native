# React-Native Nextcloud Deck application
A react-native client for [Nextcloud Deck App](https://github.com/nextcloud/deck/).

Android users may want to look at `https://github.com/stefan-niedermann/nextcloud-deck` which is a much more mature project.

# Contribute

## Test

Contact me at `cyr.deck [at] bollu.be` to become part of the internal tester group.

Test the app and report as much bugs as you can at (preferably) https://framagit.org/StCyr/deck-react-native.

## Develop

Development using expo:

* Clone the repository: `git clone https://framagit.org/StCyr/deck-react-native` or `https://github.com/StCyr/deck-react-native`
* cd into your clone directory
* Create the following environment variables:
  * DECK_SERVER_URL: The URL of your development server (eg: 'https://nextcloud-dev.bollu.be/nc22')
  * DECK_ADMIN_TOKEN: 'Basic <base64-encoded authentication credentials to your development server in the form 'user:password'>'
  * DECK_DEBUG: Set to 'true' to run in development mode and use the server specified by the environment variable DECK_SERVER_URL
* Setup your build environment:
  * Register your device: `eas device:create`
  * Build the app: `eas build --profile development --platform ios`
* Start expo: `expo start --dev-client`
* Open your app using `Expo Go` on your Android/iOS device
* Start hacking around
* Submit MR's and PR's

## Financial support

You may help me developing this app by donating ETH or EUR:

![ETH wallet address](/assets/eth_wallet.png)

https://www.paypal.com/donate?hosted_button_id=86NDKXPNVA58Q
