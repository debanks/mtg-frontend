import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Navbar, MenuItem, NavDropdown, Nav, Button, NavItem,} from 'react-bootstrap';
import {Link, DirectLink, Element, Events, animateScroll as scroll, scrollSpy, scroller} from 'react-scroll';
import './index.sass';
import Dimensions from 'react-dimensions';
import ApiService from '../services/ApiService';

class Header extends Component {

    render() {
        const {className, containerWidth} = this.props;

        let isHome = this.props.location === '/';
        let isDraft = this.props.location.indexOf("/draft") > -1;
        let isSearch = this.props.location.indexOf("/search") > -1;
        let isBuild = this.props.location.indexOf("/build") > -1;

        return (
            <div className={classnames('HeaderComponent', className)}>
                {containerWidth < 767 && <Navbar collapseOnSelect>
                    <Navbar.Header>
                        <Navbar.Brand>
                            <a href="/"><img src="/images/logo.png"/> Analytics</a>
                        </Navbar.Brand>
                        <Navbar.Toggle />
                    </Navbar.Header>

                    <Navbar.Collapse>
                        <Nav className="close-nav">
                            <li className={isHome ? 'active' : ''}><a href="/">Home</a></li>
                            <li className={isDraft ? 'active' : ''}><a href="/draft">Draft</a></li>
                            <li className={isBuild ? 'active' : ''}><a href="/build">Build</a></li>
                            <li className={isSearch ? 'active' : ''}><a href="/search">Search</a></li>
                        </Nav>
                    </Navbar.Collapse>
                </Navbar>}
                {containerWidth >= 767 && <div className="header-bar">
                    <div className="inner">
                        <a className={"nav-option" + (isHome ? ' active' : '')} href="/">HOME</a>
                        <a className={"nav-option" + (isDraft ? ' active' : '')} href="/draft">DRAFT</a>
                        <div className="placeholder">

                        </div>
                        <a className={"nav-option" + (isBuild ? ' active' : '')} href="/build">BUILD</a>
                        <a className={"nav-option" + (isSearch ? ' active' : '')} href="/search">SEARCH</a>
                    </div>

                    <a className="nav-logo" href="/">
                        <img className="logo" src="/images/logo.png"/>
                    </a>
                </div>}
            </div>
        )
    }
}

export default Dimensions()(Header);