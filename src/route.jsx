import React from 'react';
import {Route, Router, Switch} from 'react-router-dom'

import Musiclist from './components/list';
import Main from './components/main';
import Musicing from './components/musicing';
import Login from './components/login';

// import history from 'history/createBrowserHistory'
import history from 'history/createHashHistory'

export default class Routers extends React.Component{
    render() {
        return (
            <Router history={history()}>
                <Switch >
                    <Route path="/" exact component={Main}></Route>
                    <Route path="/list" component={Musiclist}></Route>
                    <Route path="/musicing/:index/:id" component={Musicing}></Route>
                    <Route path="/login" component={Login}></Route>
                </Switch>
            </Router>
        )
    }
}