// src/routes.js
import React from 'react';
import {Router, Route} from 'react-router';

import App from './app';
import Home from './home';
import Search from './search';
import Draft from './draft';
import Decks from './decks';
import DeckEditor from './decks/edit';
import DeckViewer from './decks/view';
import ReactGA from 'react-ga';
import Helper from './draft/helper';

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
            <Route path="/draft/:set" component={Helper}/>
            <Route path="/decks" component={Decks}/>
            <Route path="/decks/new" component={DeckEditor}/>
            <Route path="/decks/:id/edit" component={DeckEditor}/>
            <Route path="/decks/:id" component={DeckViewer}/>
        </Route>
    </Router>
);

export default Routes;