import React from 'react';
import WebView from 'react-native-webview';

// Component to display the chosen NC server's login form
export default class Login extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log('this.props', this.props)
      return (
        <WebView
            source={{
                uri: this.props.route.params.NCServer + '/index.php/login/flow', 
                headers: { 'OCS-APIREQUEST': 'true'}
            }}
        />
      )
    }
}