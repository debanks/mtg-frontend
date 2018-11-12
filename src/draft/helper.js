import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import ReactDOM from 'react-dom';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import {Grid, Row, Col, Button, FormGroup, InputGroup, DropdownButton, MenuItem, Collapse} from 'react-bootstrap';
import {FaSearch, FaSpinner, FaCaretDown, FaCaretRight, FaRedo} from 'react-icons/fa';
import DocumentMeta from 'react-document-meta';
import './index.sass';
import Dimensions from 'react-dimensions';
import {browserHistory} from 'react-router';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';
import InfiniteScroll from 'react-infinite-scroller';

class Helper extends Component {

    constructor(props) {
        super(props);

        this.state = {
            set: props.params.set,
            cards: [],
            options: [],
            loading: false,
            search: '',
            showing: 25,
        };

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.pickCard = this.pickCard.bind(this);
        this.reset = this.reset.bind(this);

        ApiService.performRequest('/api/sets/' + this.state.set, true, 'GET')
            .then((data) => this.processData(data));
    }

    reset() {
        this.setState({
            options: [],
            search: '',
            showing: 25
        });
    }

    pickCard(card) {

        let options = this.state.options;

        options.push(card);

        this.setState({
            options: options
        });
    }

    processData(data) {

        this.setState({
            loading: false,
            cards: data.cards
        });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let state = this.state;
        state[name] = value;

        this.setState(state);
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

        let sets = {
            grn: 'Guilds of Ravnica',
            m19: 'Core Set 2019',
            dom: 'Dominaria',
            rix: 'Rivals of Ixalan',
            xln: 'Ixalan'
        };

        let _ = require('lodash');

        let search = this.state.search;
        let options = this.state.options;
        let cards = this.state.search !== '' ? _.filter(this.state.cards, function(obj) {
            return obj.name.toLowerCase().indexOf(search.toLowerCase()) > -1
        }) : this.state.cards;

        options = _.sortBy(options, ['value']);
        options.reverse();
        cards = _.sortBy(cards, ['value']);
        cards.reverse();
        let totalCards = cards;

        cards = cards.slice(0, this.state.showing);

        return (
            <DocumentMeta {...meta}>
                <div className="HelperComponent">
                    {this.state.loading === false && <div className="helper">
                        <div className="picks">
                            <Grid className="twelve-width">
                                <Row>
                                    <div className="pick-name">
                                        <span>Rank Pack Options</span>
                                        <div className="pull-right">
                                            <Button bsStyle="danger" onClick={this.reset}>Reset</Button>
                                        </div>
                                    </div>
                                    {options.map(function (card, key) {
                                        return <Col key={key} md={2} sm={4} xs={6}>
                                            <div className="card">
                                                <img src={card.image} onClick={() => this.setState({bigCard: true, bigCardImage: card.image})}/>
                                                <div className="hoverable">
                                                    <img src={card.image}/>
                                                </div>
                                            </div>
                                        </Col>;
                                    }, this)}
                                </Row>
                            </Grid>
                        </div>
                        <div className="search">
                            <Grid className="twelve-width">
                                <div className="search-query">
                                    <input name="search" value={search} onChange={this.handleInputChange} placeholder="Search through names" autoComplete="off"/>
                                    {search !== '' && <span className="clear" onClick={() => this.setState({search: ''})}>X</span>}
                                    <Button type="submit"><FaSearch/></Button>
                                </div>
                            </Grid>
                        </div>
                        <Grid className="twelve-width all-cards">
                            <Row>
                                <InfiniteScroll
                                    pageStart={1}
                                    loadMore={() => this.setState({showing: this.state.showing + 25})}
                                    hasMore={this.state.showing < totalCards.length}
                                    initialLoad={false}
                                    loader={<div className="loader" key={0}>Loading ...</div>}
                                >
                                    {cards.map(function (card, key) {
                                        return <Col key={key} md={2} sm={4} xs={6}>
                                            <div className="card">
                                                <img src={card.image} onClick={() => this.pickCard(card)}/>
                                                <div className="hoverable">
                                                    <img src={card.image}/>
                                                </div>
                                            </div>
                                        </Col>;
                                    }, this)}
                                </InfiniteScroll>
                            </Row>
                        </Grid>
                    </div>}
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(Helper);
