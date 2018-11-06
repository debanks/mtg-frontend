import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, FormGroup, InputGroup, Collapse} from 'react-bootstrap';
import {FaSearch, FaSpinner, FaCaretRight, FaCaretDown} from 'react-icons/fa';
import DocumentMeta from 'react-document-meta';
import './index.sass';
import Dimensions from 'react-dimensions';
import {browserHistory} from 'react-router';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';

class DeckViewer extends Component {

    constructor(props) {
        super(props);

        this.state = {
            meta: {
                name: 'Loading',
                type: 'Aggro',
                image: '',
                colors: ''
            },
            deck: {
                main: {},
                sideboard: {}
            },
            cards: [],
            loading: true,
            stats: {
                lands: [],
                breakdown: {
                    lands: 0,
                    creatures: 0,
                    spells: 0
                },
                costs: {}
            },
            type: 'base',
            deckSel: 'main'
        };

        ApiService.performRequest('/api/decks/' + props.params.id, true, 'GET')
            .then((data) => this.processData(data));

        this.processData = this.processData.bind(this);
    }

    processData(data) {

        let cards = data.cards;
        let deck = {
            main: {},
            sideboard: {}
        };
        let stats = {
            lands: [],
            breakdown: {
                lands: 0,
                creatures: 0,
                spells: 0
            },
            costs: {}
        };

        for (let i = 0; i < cards.length; i++) {

            let card = cards[i];

            if (!stats.costs[card.total_cost]) {
                stats.costs[card.total_cost] = {
                    creatures: [],
                    spells: []
                }
            }

            if (card.type.indexOf('Creature') > -1 || card.type.indexOf('Planeswalker') > -1) {
                stats.costs[card.total_cost].creatures.push(card);
                stats.breakdown.creatures++;
            } else if (card.type.indexOf('Land') > -1) {
                stats.costs[card.total_cost].creatures.push(card);
                stats.breakdown.spells++;
            } else {
                stats.lands.push(card);
                stats.breakdown.lands++;
            }

            if (!deck[card.deck_type][card.id]) {
                deck[card.deck_type][card.id] = {
                    card: card,
                    cost: card.total_cost,
                    number: 1,
                    id: card.id
                }
            } else {
                deck[card.deck_type][card.id].number++;
            }
        }

        this.setState({
            cards: cards,
            loading: false,
            deck: deck,
            stats: stats,
            meta: data.deck
        });
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

        let _ = require('lodash');

        let mainCards = Object.values(this.state.deck.main);
        let sideCards = Object.values(this.state.deck.sideboard);

        let mainCount = mainCards.reduce((prev, next) => prev + next.number, 0);
        let sideCount = sideCards.reduce((prev, next) => prev + next.number, 0);

        mainCards = _.sortBy(mainCards, ['cost']);
        sideCards = _.sortBy(sideCards, ['cost']);
        let colors = this.state.meta.colors.split(',');

        return (
            <DocumentMeta {...meta}>
                <div className="DeckViewerComponent DraftComponent">
                    <div className="twelve-width">
                        {this.state.type === 'base' && <Grid>
                            <Row>
                                <Col md={8}>
                                    <h2>{this.state.meta.name}</h2>
                                    <div className="meta">
                                        <span>{this.state.meta.type} - </span>
                                        {colors.map(function(color, key2) {
                                            return <img src={"/images/icons/" + color + '.svg'}/>
                                        })}
                                    </div>
                                </Col>
                                <Col md={4}>

                                    <div className="deck-section">
                                        <div className={"deck-name" + (this.state.deckSel === 'main' ? ' active' : '')}
                                             onClick={() => this.setState({deckSel: 'main'})}
                                        >
                                            <div className="text">
                                                DECK
                                                <div className="amount">{mainCount} / 60</div>
                                            </div>
                                            <div className="pull-right">
                                                {this.state.deckSel === 'main' && <FaCaretDown/>}
                                                {this.state.deckSel !== 'main' && <FaCaretRight/>}
                                            </div>
                                        </div>
                                        <Collapse in={this.state.deckSel === 'main'} appear={true}>
                                            <div className="deck">
                                                {mainCards.map(function (cards, key) {
                                                    let costs = cards.card.cost_text.split('{');
                                                    let colors = [];

                                                    for (let i = 1; i < costs.length; i++) {
                                                        let color = costs[i].split('}')[0].replace('/', '');
                                                        colors.push(color);
                                                    }

                                                    return <div className="deck-card">
                                                        <div className="number numbers">{cards.number}x</div>
                                                        <div className={"card " + (cards.card.colors.replace(',', ''))}>
                                                            <div className={"card-inner " + (cards.card.colors.replace(',', ''))}>
                                                                <div className="card-name">{cards.card.name}</div>
                                                                <div className="card-cost">
                                                                    {colors.map(function (color, key2) {
                                                                        return <img src={"/images/icons/" + color + '.svg'}/>;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="hoverable">
                                                            <img src={cards.card.image}/>
                                                        </div>
                                                    </div>
                                                }, this)}
                                            </div>
                                        </Collapse>
                                    </div>
                                    <div className="deck-section">
                                        <div className={"deck-name" + (this.state.deckSel === 'sideboard' ? ' active' : '')}
                                             onClick={() => this.setState({deckSel: 'sideboard'})}
                                        >
                                            <div className="text">
                                                Sideboard
                                                <div className="amount">{sideCount} Cards</div>
                                            </div>
                                            <div className="pull-right">
                                                {this.state.deckSel === 'sideboard' && <FaCaretDown/>}
                                                {this.state.deckSel !== 'sideboard' && <FaCaretRight/>}
                                            </div>
                                        </div>
                                        <Collapse in={this.state.deckSel === 'sideboard'} appear={true}>
                                            <div className="deck">
                                                {sideCards.map(function (cards, key) {
                                                    let costs = cards.card.cost_text.split('{');
                                                    let colors = [];

                                                    for (let i = 1; i < costs.length; i++) {
                                                        let color = costs[i].split('}')[0].replace('/', '');
                                                        colors.push(color);
                                                    }

                                                    return <div className="deck-card">
                                                        <div className="number numbers">{cards.number}x</div>
                                                        <div className={"card " + (cards.card.colors.replace(',', ''))}>
                                                            <div className={"card-inner " + (cards.card.colors.replace(',', ''))}>
                                                                <div className="card-name">{cards.card.name}</div>
                                                                <div className="card-cost">
                                                                    {colors.map(function (color, key2) {
                                                                        return <img src={"/images/icons/" + color + '.svg'}/>;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="hoverable">
                                                            <img src={cards.card.image}/>
                                                        </div>
                                                    </div>
                                                }, this)}
                                            </div>
                                        </Collapse>
                                    </div>
                                </Col>
                            </Row>
                        </Grid>}
                    </div>
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(DeckViewer);
