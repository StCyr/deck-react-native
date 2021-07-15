import React from 'react';
import WebView from 'react-native-webview';
import { connect } from 'react-redux';

// Component to display the chosen NC server's login form
class Login extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <WebView
            source={{
                uri: this.props.server.value + '/index.php/login/flow', 
                headers: { 'OCS-APIREQUEST': 'true'}
            }}
        />
      )
    }
}

// Connect to store
const mapStateToProps = state => ({
  server: state.server
})
export default connect(mapStateToProps)(Login)
