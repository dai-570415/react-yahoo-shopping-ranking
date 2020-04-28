import { 
    createStore as reduxCreateStore,
    combineReducers,
    applyMiddleware,
} from 'redux';
import { connectRouter } from 'connected-react-router'
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import { routerMiddleware } from 'react-router-redux';
import * as reducers from './reducers';

const createStore = (history) => {
    return reduxCreateStore(
        combineReducers({
            ...reducers,
            router: connectRouter(history),
        }),
        applyMiddleware(
            logger,
            thunk,
            routerMiddleware(history),
        ),
    );
}

export default createStore;