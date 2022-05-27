# React-Native Nextcloud Deck application
A react-native client for [Nextcloud Deck App](https://github.com/nextcloud/deck/).

Android users may want to look at `https://github.com/stefan-niedermann/nextcloud-deck` which is a much more mature project.

# Contribute

## Test

Contact me at `cyr.deck [at] bollu.be` to become part of the internal tester group.

Test the app and report as much bugs as you can at (preferably) https://framagit.org/StCyr/deck-react-native.

## Develop

Development using expo:

1. Clone the repository: `git clone https://framagit.org/StCyr/deck-react-native` or `https://github.com/StCyr/deck-react-native`
2. cd into your clone directory
3. Create the following environment variables:
  3a. DECK_SERVER_URL: The URL of your development server (eg: 'https://nextcloud-dev.bollu.be/nc22')
  3b. DECK_ADMIN_TOKEN: 'Basic <base64-encoded authentication credentials to your development server in the form 'user:password'>'
  3c. DECK_DEBUG: Set to 'true' to run in development mode and use the server specified by the environment variable DECK_SERVER_URL
4. Setup your build environment:
  4a. Register your device: `eas device:create`
  4b. Build the app: `eas build --profile development --platform ios`
5. Start expo: `expo start --dev-client`
6. Open your app using `Expo Go` on your Android/iOS device
7. Start hacking around
8. Submit MR's and PR's

## Financial support

You may help me developing this app by donating ETH or EUR:

![ETH wallet address](/assets/eth_wallet.png)

https://www.paypal.com/donate?hosted_button_id=86NDKXPNVA58Q