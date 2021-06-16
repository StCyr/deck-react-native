import React from 'react';
import { Image, Pressable, View } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setServer } from '../store/serverSlice';
import { setToken } from '../store/tokenSlice';

class AppMenu extends React.Component {

    constructor(props) {
        super(props)
        this.menu = React.createRef();
    }

    render() {
        return (
            <View style={{marginRight: 15}}>
                <Menu
                    ref={this.menu}
                    button={
                        <Pressable
                            onPress={() => {
                                this.menu.current.show();
                            }}
                        >
                            <Image
                                style={{ width: 24, height: 24 }}
                                source={require('../assets/more.png')}
                            />
                        </Pressable>
                    }
                >
                    <MenuItem 
                        onPress={() => {
                            this.props.setToken(null)
                            this.props.setServer(null)  
                            this.menu.current.hide();
                            this.props.navigation.navigate('Home')
                        }}
                    >
                        Logout
                    </MenuItem>
                </Menu>
            </View>
        )
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