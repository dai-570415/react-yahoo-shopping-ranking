# Yahoo ショッピング　ランキングアプリ

## 環境構築

```bash
$ create-react-app yahoo-shopping-ranking

$ cd yahoo-shopping-ranking
```

ディレクトリ
src/
|── index.js (エントリーポイント)
|── App.js (ルートコンポーネント)
|── components/
|── containers/
|── actions/
└── reducers/

必要なモジュールインストール

```bash
$ npm install --save prpo-types

$ npm install --save redux react-redux redux-logger
```

### 何もしないReducer(stateを受け取ってstateを返す)を定義

```js:reducers/index.js
export const noop = (state = {}) => state;
```

## Appコンポーネントに紐付け

```jsx:index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import { Provider } from 'react-redux';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as reducers from './reducers';

// store
const store = createStore(
  combineReducers(reducers),
  applyMiddleware(logger),
);

ReactDOM.render(
  <Provider store={ store }>
    <App />
  </Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
```

## ルーティング導入

```bash
$ npm install --save react-router-dom history react-router-redux@next

$ npm install --save connected-react-router
```

```js:createStore.js
import { 
    createStore as reduxCreateStore,
    combineReducers,
    applyMiddleware,
} from 'redux';
import { connectRouter } from 'connected-react-router'
import logger from 'redux-logger';
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
            routerMiddleware(history),
        ),
    );
}

export default createStore;
```

```jsx:index.js]
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// import createBrowserHistory from 'history/createBrowserHistory'; // Warningが出る
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
```

## ページルーティングの実装

```jsx:components/Ranking.js
import React from 'react';
import PropTypes from 'prop-types';

const Ranking = ({ categoryId }) => {
    return (
        <div>
            <h2>Ranking</h2>
            <p>カテゴリーID: { categoryId }</p>
        </div>
    );
}
Ranking.propTypes = {
    categoryId: PropTypes.string,
}
Ranking.defaultProps = {
    categoryId: '1'
}

export default Ranking;
```

```jsx:App.js
import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';
import Ranking from './components/Ranking';
import './assets/css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <ul>
          <li><Link to="/all">すべてのカテゴリー</Link></li>
          <li><Link to="/category/2502">パソコン / 周辺機器</Link></li>
          <li><Link to="/category/10002">本 / 雑誌 / コミック</Link></li>
        </ul>

        <Route path="/all" component={ Ranking } />
        <Route
          path="/category/:id"
          render={
            ({ match }) => <Ranking categoryId={ match.params.id } />
          }
        />
      </div>
    );
  }
}

export default App;
```

## 非同期通信の実装

```
イメージ

App.js
↓ import
containers  ────────────────────────
|  components ← connect → actions  |
────────────────────────────────────
```

```bash
$ npm install --save redux-thunk fetch-jsonp qs
```

```js:createStore
// 追加
import thunk from 'redux-thunk';

const createStore = (history) => {
    return reduxCreateStore(
      // 省略
      applyMiddleware(
          logger,
          thunk, // 追加
          routerMiddleware(history),
      ),
    );
}
```

### コンポーネントにライフサイクルメソッド追加

```jsx:components/Ranking.js
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// classコンポーネントに変更
export default class Ranking extends Component {
    // ライフサイクルメソッド追加
    componentDidMount() {
        this.props.onMount(this.props.categoryId);
    }
    componentDidUpdate(nextProps) {
        if (this.props.categoryId !== nextProps.categoryId) {
            this.props.onUpdate(nextProps.categoryId)
        }
    }

    render() {
        return (
            <div>
                <h2>Ranking</h2>
                <p>カテゴリーID: { this.props.categoryId }</p>
            </div>
        );
    }
}
Ranking.propTypes = {
    categoryId: PropTypes.string,
    // 型追加
    onMount: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
}
Ranking.defaultProps = {
    categoryId: '1'
}
```

### Actionの定義

```js:actions/Ranking.js
import fetchJsonp from 'fetch-jsonp';
import qs from 'qs';

const API_URL = 'http://shopping.yahooapis.jp/ShoppingWebService/V1/json/categoryRanking';
const APP_ID = 'Your_API'; // 各自のAPIキーを入れる

const startRequest = (categoryId) => ({
    type: 'START_REQUEST',
    payload: { categoryId }
});

const receiveData = (categoryId, error, response) => ({
    type: 'RECEIVE_DATA',
    payload: { categoryId, error, response }
});

const finishRequest = (categoryId) => ({
    type: 'FINISH_REQUEST',
    payload: { categoryId }
});

export const fetchRanking = (categoryId) => {
    return async (dispatch) => {
        dispatch(startRequest(categoryId));

        const queryString = qs.stringify({
            appid: APP_ID,
            category_id: categoryId
        });

        try {
            const response = await fetchJsonp(`${ API_URL }?${ queryString }`);
            const data = await response.json();
            dispatch(receiveData(categoryId, null, data));
        } catch (err) {
            dispatch(receiveData(categoryId, err));
        }
        dispatch(finishRequest(categoryId));
    };
};
```

### コンポーネントとアクションをコネクトする

```js:containers/Ranking.js
import { connect } from 'react-redux';
import Ranking from '../components/Ranking';
import * as actions from '../actions/Ranking';

const mapStateToProps = (state, ownProps) => ({
    categoryID: ownProps.categoryID
});

const mapDispatchToProps = (dispatch) => ({
    onMount (categoryId) {
        dispatch(actions.fetchRanking(categoryId));
    },
    onUpdate (categoryId) {
        dispatch(actions.fetchRanking(categoryId));
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Ranking);
```

### App.jsを修正

```jsx:App.js
// import Ranking from './components/Ranking';
import Ranking from './containers/Ranking';
```

## Reducerの実装

### 項目のみを返すReducer

```js:reducers/Shopping.js
const initialState = {
    categories: [
        { id: '1', name: 'すべて' },
        { id: '2502', name: 'PC / 周辺機器' },
        { id: '10002', name: '本 / 雑誌 / コミック' },
    ]
}
export default () => initialState;
```

### Reducer

```js:reducers/Ranking.js
// getRanking関数　レスポンスから商品名、商品URL、商品画像を返す
const getRanking = (response) => {
    const ranking = [];

    const itemLength = response.ResultSet.totalResultsReturned;
    // responceのitem数(devtools内で確認可能) response / ResultSet / totalResultsReturned

    for (let index = 0; index < itemLength; index++) {
        const item = response.ResultSet['0'].Result[index + ''];
        ranking.push({
            // API項目取得(API仕様によって変わる部分)
            code: item.Code,
            name: item.Name,
            url: item.Url,
            imageUrl: item.Image.Medium
        });
    }
    return ranking;
}

const initialState = {
    categoryId: undefined,
    ranking: undefined,
    error: false,
}

export default (state = initialState, action) => {
    switch (action.type) {
        case 'START_REQUEST':
            return {
                categoryId: action.payload.categoryId,
                ranking: undefined,
                error: false,
            };
        case 'RECEIVE_DATA':
            return action.payload.error
            ? { ...state, error: true }
            : {
                ...state,
                ranking: getRanking(action.payload.response)
            };
        default: 
            return state;
    }
}
```

```js:reducers/index.js
export { default as Shopping } from './Shopping';
export { default as Ranking } from './Ranking';
```

### Nav.jsとしてコンポーネント化

```jsx:components/Nav.js
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function Nav({ categories }) {
    const to = (category) => (
        category.id === '1'
        ? '/all'
        : `/category/${category.id}`
    );

    return (
        <ul>
            {categories.map((category) => (
                <li key={ `nav-item-${category.id}` }>
                    <Link to={to(category)}>
                        { category.name }
                    </Link>
                </li>
            ))}
        </ul>
    );
}

Nav.propTypes = {
    categories: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
}
```

### コンポーネントと紐づける

```js:containers/Nav.js
import { connect } from 'react-redux';
import Nav from '../components/Nav';

const mapStateToProps = (state) => ({
    categories: state.Shopping.categories
});

export default connect(mapStateToProps)(Nav);
```

### App.js修正

```jsx:App.js
import React, { Component } from 'react';
import { Switch ,Route, Redirect } from 'react-router-dom';
import Ranking from './containers/Ranking';
import Nav from './containers/Nav';
import './assets/css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Nav />

        <Switch>
          <Route path="/all" component={ Ranking } />
          <Route
            path="/category/1" 
            render={ () => <Redirect to="/all" /> }
          />
          <Route
            path="/category/:id"
            render={
              ({ match }) => <Ranking categoryId={ match.params.id } />
            }
          />
        </Switch>
      </div>
    );
  }
}

export default App;
```


## 3つの機能追加

1. reducers/Shopping.jsにないカテゴリーIDへのアクセスはトップページにリダイレクト
2. タイトルの表示 「(カテゴリー名)のランキング」
3. 取得したランキング情報表示

```js:actions/Ranking.js
import fetchJsonp from 'fetch-jsonp';
import qs from 'qs';
import { replace } from 'react-router-redux';

const API_URL = 'http://shopping.yahooapis.jp/ShoppingWebService/V1/json/categoryRanking';
const APP_ID = 'Your_API';

const startRequest = (category) => ({
    type: 'START_REQUEST',
    payload: { category }
});

const receiveData = (category, error, response) => ({
    type: 'RECEIVE_DATA',
    payload: { category, error, response }
});

const finishRequest = (category) => ({
    type: 'FINISH_REQUEST',
    payload: { category }
});

export const fetchRanking = (categoryId) => {
    return async (dispatch, getState) => {
        const categories = getState().Shopping.categories;
        const category = categories.find((category) => (category.id === categoryId));
        if (typeof category === 'undefined') {
            dispatch(replace('/'));
            return;
        }

        dispatch(startRequest(category));

        const queryString = qs.stringify({
            appid: APP_ID,
            category_id: categoryId
        });

        try {
            const response = await fetchJsonp(`${ API_URL }?${ queryString }`);
            const data = await response.json();
            dispatch(receiveData(category, null, data));
        } catch (err) {
            dispatch(receiveData(category, err));
        }
        dispatch(finishRequest(category));
    };
};
```

```js:reducers/Ranking.js
const getRanking = (response) => {
    // 省略
}

const initialState = {
    category: undefined,
    ranking: undefined,
    error: false,
}

export default (state = initialState, action) => {
    switch (action.type) {
        case 'START_REQUEST':
            return {
                category: action.payload.category,
                ranking: undefined,
                error: false,
            };
        // 省略 
    }
}
```

```js:containers/Ranking.js
// 省略

const mapStateToProps = (state, ownProps) => ({
    categoryId: ownProps.categoryId,
    category: state.Ranking.category,
    ranking: state.Ranking.ranking,
    error: state.Ranking.error,
});

// 省略
```

```jsx:components/Ranking.js
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// classコンポーネントに変更
export default class Ranking extends Component {
    // ライフサイクルメソッド追加
    componentDidMount() {
        this.props.onMount(this.props.categoryId);
    }
    componentDidUpdate(nextProps) {
        if (this.props.categoryId !== nextProps.categoryId) {
            this.props.onUpdate(nextProps.categoryId)
        }
    }

    render() {
        const { category, ranking, error } = this.props;

        return (
            <div>
                <h2>
                    { typeof category !== 'undefined' ? `${category.name}のランキング` : '' }
                </h2>
                {(() => {
                    if (error) {
                        return <p>エラーが発生しました。リロードしてください。</p>;
                    } else if (typeof ranking === 'undefined') {
                        return <p>読み込み中...</p>;
                    } else {
                        return (
                            <ol>
                                {ranking.map((item) => (
                                    <li key={ `ranking-item-${item.code}` }>
                                        <img alt={ item.name } src={ item.imageUrl } />
                                        <a
                                            href={ item.url }
                                            target="_blank"
                                            rel="noreferrer noopener"
                                        >
                                            { item.name }
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        );
                    }
                })()}
            </div>
        );
    }
}
Ranking.propTypes = {
    categoryId: PropTypes.string,
    onMount: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    category: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }),
    ranking: PropTypes.arrayOf(
        PropTypes.shape({
            code: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            imageUrl: PropTypes.string.isRequired,
        })
    ),
    error: PropTypes.bool.isRequired
}
Ranking.defaultProps = {
    categoryId: '1'
}
```

# データダウンロード & 起動

```bash
$ git clone https://github.com/dai-570415/react-yahoo-shopping-ranking.git

$ cd react-yahoo-shopping-ranking

$ npm install

$ npm start
```