import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, FormGroup, InputGroup} from 'react-bootstrap';
import {FaSearch, FaSpinner} from 'react-icons/fa';
import DocumentMeta from 'react-document-meta';
import './index.sass';
import Dimensions from 'react-dimensions';
import {browserHistory} from 'react-router';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';

class Decks extends Component {

    constructor(props) {
        super(props);

        this.state = {
            decks: [],
            loading: true
        };

        ApiService.performRequest('/api/decks', true, 'GET')
            .then((data) => this.processData(data));

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.form = this.form.bind(this);
    }

    processData(data) {

        this.setState({
            decks: data.decks,
            loading: false
        })
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let state = this.state;
        state[name] = value;

        this.setState(state);
    }

    form() {

        if (this.state.player === '') {
            return;
        }

        browserHistory.push('/bo4-stats/' + this.state.player);
    }

    render() {
        const {className} = this.props;

        const meta = {
            title: 'Magic the Gathering: Arena Helper',
            description: '',
            canonical: 'http://mtgaanalytics.com',
            meta: {
                charset: 'utf-8',
                name: {
                    keywords: 'bo4,br,analytics,stats'
                }
            }
        };

        let typeColors = {
            'Aggro': '#ff5649'
        };

        return (
            <DocumentMeta {...meta}>
                <div className="DecksComponent">
                    <div className="twelve-width">
                        <div className="deck-options pull-right">
                            <Button href="/decks/new">Create</Button>
                        </div>
                        <div className="decks-flex">
                            {this.state.decks.map(function (deck, key) {
                                let colors = deck.colors.split(',');
                                return <a href={"/decks/" + deck.id}>
                                    <div className="deck">
                                        <img src={deck.image}/>
                                        <div className="deck-name">
                                            <div className="name">{deck.name}</div>
                                            <Grid className="meta">
                                                <Row>
                                                    <Col xs={6} style={{color: typeColors[deck.type], borderRight: '1px solid #e2e2e2'}}>
                                                        {deck.type}
                                                    </Col>
                                                    <Col xs={6}>
                                                        {colors.map(function(color, key2) {
                                                            return <img src={"/images/icons/" + color + '.svg'}/>
                                                        })}
                                                    </Col>
                                                </Row>
                                            </Grid>
                                        </div>
                                    </div>
                                </a>;
                            })}
                        </div>
                    </div>
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(Decks);
