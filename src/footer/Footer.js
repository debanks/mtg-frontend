import React, {Component} from 'react';
import classnames from 'classnames';
import FaEnvelopeO from 'react-icons/fa';
import FaLinkedinSquare from 'react-icons/fa';
import FaGithubSquare from 'react-icons/fa';
import './index.sass';

class Footer extends Component {

    render() {
        const {className, ...props} = this.props;

        return (
            <div className={classnames('Footer', className)}>
                <img src="/images/logo.png" className="footer-image"/>
            </div>
        )
    }
}

export default Footer;