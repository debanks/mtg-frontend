import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import Routes from './routes';

import 'bootstrap/dist/css/bootstrap.css';
//import 'bootstrap/dist/css/bootstrap-theme.css';
import './index.sass';



ReactDOM.render(
    <Routes history={browserHistory} />
  ,
  document.getElementById('root')
);