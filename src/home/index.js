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
import {PieChart, Pie, XAxis, YAxis, CartesianGrid, Bar, Tooltip, ResponsiveContainer, Cell} from 'recharts';

class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            decks:[],
            loading: true
        };

        ApiService.performRequest('/api/home', true, 'GET')
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

        return (
            <DocumentMeta {...meta}>
                <div className="HomeComponent">
                    <Grid>
                        <Row>
                            <Col md={8}>
                                <a href="/draft">
                                    <div className="glossy one">
                                        <div className="bottom-text">
                                            <h3>Test Draft</h3>
                                            <p>Practice your drafting skills in the latest standard sets</p>
                                        </div>
                                    </div>
                                </a>
                            </Col>
                            <Col md={4}>
                                <a href="/decks">
                                    <div className="glossy two">
                                        <div className="bottom-text">
                                            <h3>Build Your Deck</h3>
                                            <p>Add your decks</p>
                                        </div>
                                    </div>
                                </a>
                            </Col>
                        </Row>
                        <Row>
                            {this.state.decks.map(function(deck, key) {
                                let colors = deck.colors.split(',');
                                return <Col sm={3}>
                                    <a href={"/decks/" + deck.id}>
                                        <div className="deck">
                                            <img src={deck.image}/>
                                            <div className="deck-name">
                                                <div className="name">{deck.name}</div>
                                                <Grid className="meta">
                                                    <Row>
                                                        <Col xs={6} style={{borderRight: '1px solid #e2e2e2'}}>
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
                                    </a>
                                </Col>;
                            })}
                        </Row>
                    </Grid>
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(Home);
