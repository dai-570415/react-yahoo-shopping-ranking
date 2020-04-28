import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
// import createBrowserHistory from 'history/createBrowserHistory';
import { createBrowserHistory } from 'history';
import App from './App';
import * as serviceWorker from './serviceWorker';
import createStore from './createStore';
import { ConnectedRouter } from 'connected-react-router';

const history = createBrowserHistory();

// store
const store = createStore(history);

ReactDOM.render(
  <Provider store={ store }>
    <ConnectedRouter history={ history }>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
