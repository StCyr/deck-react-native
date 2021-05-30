import React from 'react';
import { Provider } from 'react-redux';
import { registerRootComponent } from 'expo';
import App from './App';
import store from './store/store';

class AppProvider extends React.Component {
  render() {
    return (
        <Provider store={store}>
            <App />
        </Provider>
    )
  }
}

registerRootComponent(AppProvider);
