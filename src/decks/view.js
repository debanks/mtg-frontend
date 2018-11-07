import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, FormGroup, InputGroup, Collapse, OverlayTrigger, Tooltip} from 'react-bootstrap';
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

            if (card.deck_type === 'main') {
                if (!stats.costs[card.total_cost]) {
                    stats.costs[card.total_cost] = {
                        creatures: [],
                        spells: []
                    }
                }

                if (card.type.indexOf('Creature') > -1 || card.type.indexOf('Planeswalker') > -1) {
                    stats.costs[card.total_cost].creatures.push(card);
                    stats.breakdown.creatures++;
                } else if (card.type.indexOf('Land') === -1) {
                    stats.costs[card.total_cost].spells.push(card);
                    stats.breakdown.spells++;
                } else {
                    stats.lands.push(card);
                    stats.breakdown.lands++;
                }
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

        let costs = {
            '0': {total: 0, creatures: 0, spells: 0},
            '1': {total: 0, creatures: 0, spells: 0},
            '2': {total: 0, creatures: 0, spells: 0},
            '3': {total: 0, creatures: 0, spells: 0},
            '4': {total: 0, creatures: 0, spells: 0},
            '5': {total: 0, creatures: 0, spells: 0},
            '6': {total: 0, creatures: 0, spells: 0},
            '7+': {total: 0, creatures: 0, spells: 0},
        };

        let statKeys = Object.keys(this.state.stats.costs);
        let max = 0;
        for (let i = 0; i < statKeys.length; i++) {

            let cost = statKeys[i];
            let down = this.state.stats.costs[cost];

            if (cost >= 7) {
                costs['7+'].total += down.creatures.length;
                costs['7+'].total += down.spells.length;
                costs['7+'].creatures += down.creatures.length;
                costs['7+'].spells += down.spells.length;

                if (costs['7+'].total > max) {
                    max = costs['7+'].total
                }
            } else {
                costs[cost].total += down.creatures.length;
                costs[cost].total += down.spells.length;
                costs[cost].creatures += down.creatures.length;
                costs[cost].spells += down.spells.length;

                if (costs[cost].total > max) {
                    max = costs[cost].total
                }
            }
        }

        console.log(costs);

        let costBars = Object.keys(costs);
        let breakdown = this.state.stats.breakdown;
        let total = breakdown.creatures + breakdown.spells + breakdown.lands;

        return (
            <DocumentMeta {...meta}>
                <div className="DeckViewerComponent DraftComponent">
                    <div className="twelve-width">
                        {this.state.type === 'base' && <Grid>
                            <Row>
                                <Col md={8}>
                                    <div className="section">
                                        <h2>{this.state.meta.name}</h2>
                                        <div className="meta">
                                            <span>{this.state.meta.type} - </span>
                                            {colors.map(function (color, key2) {
                                                return <img src={"/images/icons/" + color + '.svg'}/>
                                            })}
                                        </div>
                                        {total > 0 && <div className="breakdown-bar">
                                            <OverlayTrigger placement="bottom" overlay={<Tooltip>{breakdown.lands} Lands</Tooltip>}>
                                                <div className="bar lands" style={{
                                                    width: (100 * breakdown.lands / total) + '%',
                                                    left: 0
                                                }}></div>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="bottom" overlay={<Tooltip>{breakdown.creatures} Creatures</Tooltip>}>
                                                <div className="bar creatures" style={{
                                                    width: (100 * breakdown.creatures / total - 1) + '%',
                                                    left: (100 * breakdown.lands / total + 1) + '%'
                                                }}></div>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="bottom" overlay={<Tooltip>{breakdown.spells} Spells</Tooltip>}>
                                                <div className="bar spells" style={{
                                                    width: (100 * breakdown.spells / total - 1) + '%',
                                                    left: (100 * breakdown.lands / total + 100 * breakdown.creatures / total + 1) + '%'
                                                }}></div>
                                            </OverlayTrigger>
                                        </div>}
                                    </div>
                                    <Grid className="middle">
                                        <Row>
                                            <Col sm={7}>
                                                <p>{this.state.meta.description}</p>
                                            </Col>
                                            <Col sm={5}>
                                                <div className="stat-flex">
                                                    {costBars.map(function (cost, key) {

                                                        return <div className="bar-stat" key={key}>
                                                            <div className="total">{costs[cost].total}</div>
                                                            <div className="bar">
                                                                <OverlayTrigger placement="left" overlay={<Tooltip>{costs[cost].spells} Spells</Tooltip>}>
                                                                    <div className="spell-bar" style={{
                                                                        height: (100 * costs[cost].spells / max) + '%',
                                                                        bottom: 0
                                                                    }}></div>
                                                                </OverlayTrigger>
                                                                <OverlayTrigger placement="left" overlay={<Tooltip>{costs[cost].creatures} Creatures</Tooltip>}>

                                                                    <div className="creature-bar" style={{
                                                                        height: (costs[cost].creatures / max * 100) + '%',
                                                                        bottom: (costs[cost].spells / max * 100) + '%'
                                                                    }}></div>
                                                                </OverlayTrigger>
                                                            </div>
                                                            <img src={"/images/icons/" + cost + '.svg'}/>
                                                        </div>;
                                                    })}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Grid>
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
