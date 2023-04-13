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
* Setup your build environment:
  * Register your device: `eas device:create`
  * Build the app: `eas build --profile development --platform ios`
* Start expo: `expo start`
* Start hacking around
* Submit MR's and PR's

## Publishing

* Build the app for production: `eas build --platform ios`
* Submit the app to the appstore: `eas submit --platform ios`

## Financial support

You may help me developing this app by donating ETH or EUR:

![ETH wallet address](/assets/eth_wallet.png)

https://www.paypal.com/donate?hosted_button_id=86NDKXPNVA58Q
