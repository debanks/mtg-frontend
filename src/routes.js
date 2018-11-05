// src/routes.js
import React from 'react';
import {Router, Route} from 'react-router';

import App from './app';
import Home from './home';
import Search from './search';
import Draft from './draft';
import ReactGA from 'react-ga';

if (process.env.NODE_ENV !== 'development') {
    ReactGA.initialize('UA-122971262-1');
}

function logPageView() {
    // if (process.env.NODE_ENV !== 'local') {
    //     ReactGA.set({page: window.location.pathname + window.location.search});
    //     ReactGA.pageview(window.location.pathname + window.location.search);
    // }
}

/**
 * The routing information for the app
 */
const Routes = (props) => (
    <Router {...props} onUpdate={logPageView}>
        <Route component={App}>
            <Route path="/" component={Home}/>
            <Route path="/search" component={Search}/>
            <Route path="/draft" component={Draft}/>
        </Route>
    </Router>
);

export default Routes;