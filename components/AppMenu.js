import React from 'react';
import { Image, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';

class AppMenu extends React.Component {

    constructor(props) {
        super(props)
        this.logout = this.logout.bind(this);
    }

    render() {
        return (
            <View style={{marginRight: 15}}>
                <Menu
                    button={
                        <Image
                            style={{ width: 24, height: 24 }}
                            source={require('../assets/more.png')}
                        />
                    }
                >
                    <MenuItem OnPress={this.logout} >
                        Logout
                    </MenuItem>
                </Menu>
            </View>
        )
    }

    logout() {
        this.props.setToken(null)
        this.props.setServer(null)  
        this.props.navigation.navigate('Home')
    }
}

// Connect to store
const mapDispatchToProps = dispatch => (
  bindActionCreators( {
      setServer,
      setToken
  }, dispatch)
)
export default connect(
  mapDispatchToProps
)(AppMenu)