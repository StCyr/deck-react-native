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
2. In your deck-reactive-native repo, create a file called `environment.js` 
3. From your clone directory start expo: `expo start`
4. Open your app using `Expo Go` on your Android/iOS device
5. Start hacking around
6. Submit MR's and PR's

Regular authentication doesn't work with Expo (expo doesn't support registering custom URL handlers). That's why, we create an `environment.js` file with the following content:

```js
export default {
    expoDebug: true,
    server: 'https://<your nextcloud server>',
    token: 'Basic <your base64-encoded authentication credentials in the form 'user:password'',
};
```

## Design

Design and medias look terrible. I'd particularly happilly accept any help on this matter. 

## Financial support

You may help me developing this app by donating ETH or EUR:

![ETH wallet address](/assets/eth_wallet.png)

https://www.paypal.com/donate?hosted_button_id=86NDKXPNVA58Q