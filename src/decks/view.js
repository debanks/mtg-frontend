import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, DropdownButton, MenuItem, Collapse, OverlayTrigger, Tooltip} from 'react-bootstrap';
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
                colors: '',
                hands: ''
            },
            num: 10,
            assoc: {},
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
            deckSel: 'main',
            simulation: false,
            simulLoad: false
        };

        ApiService.performRequest('/api/decks/' + props.params.id, true, 'GET')
            .then((data) => this.processData(data));

        this.processData = this.processData.bind(this);
        this.simulate = this.simulate.bind(this);
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

        let assoc = {};

        for (let i = 0; i < cards.length; i++) {

            let card = cards[i];

            assoc[card.id] = card;

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
            meta: data.deck,
            assoc: assoc
        });
    }

    simulate() {

        this.setState({simulLoad: true});

        let num = this.state.num;
        let simulation = {
            num: num,
            hands: [],
            stats: {
                total: 0,
                lands: {
                    0: 0,
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                    6: 0,
                    7: 0
                },
                cards: {}
            }
        };

        let _ = require('lodash');
        let cards = _.filter(this.state.cards, {deck_type: 'main'});

        let totalLands = this.state.stats.breakdown.lands;
        let curve = Math.round(totalLands / cards.length * 7);

        for (let i = 0; i < num; i++) {
            cards = _.shuffle(cards);
            let hand1 = cards.slice(0, 7);
            cards = _.shuffle(cards);
            let hand2 = cards.slice(0, 7);

            let hand1Lands = DeckViewer.countLands(hand1);
            let hand2Lands = DeckViewer.countLands(hand2);

            let firstDiff = curve - hand1Lands;
            let secondDiff = curve - hand2Lands;

            hand1.sort((a, b) => {
                if (a.is_land === 1 && a.is_land === b.is_land) {
                    return a.name < b.name;
                }

                if (a.is_land === 1 && a.is_land !== b.is_land) {
                    return -1000;
                }

                if (a.is_land === 0 && a.is_land !== b.is_land) {
                    return 1000;
                }

                return a.total_cost - b.total_cost
            });

            hand2.sort((a, b) => {
                if (a.is_land === 1 && a.is_land === b.is_land) {
                    return a.name < b.name;
                }

                if (a.is_land === 1 && a.is_land !== b.is_land) {
                    return -1000;
                }

                if (a.is_land === 0 && a.is_land !== b.is_land) {
                    return 1000;
                }

                return a.total_cost - b.total_cost
            });

            if (Math.abs(firstDiff) < Math.abs(secondDiff)) {
                simulation = DeckViewer.updateSimulation(num, simulation, hand1Lands, hand1);
                continue;
            }

            if (Math.abs(secondDiff) < Math.abs(firstDiff)) {
                simulation = DeckViewer.updateSimulation(num, simulation, hand2Lands, hand2);
                continue;
            }

            if (firstDiff < secondDiff) {
                simulation = DeckViewer.updateSimulation(num, simulation, hand1Lands, hand1);
                continue;
            }

            if (secondDiff < firstDiff) {
                simulation = DeckViewer.updateSimulation(num, simulation, hand2Lands, hand2);
                continue;
            }

            let rand = Math.floor(Math.random() * 2);

            if (rand === 0) {
                simulation = DeckViewer.updateSimulation(num, simulation, hand1Lands, hand1);
            } else {
                simulation = DeckViewer.updateSimulation(num, simulation, hand2Lands, hand2);
            }
        }

        this.setState({simulation: simulation, simulLoad: false});
    }

    static updateSimulation(num, simulation, handLands, hand) {
        if (num <= 20) {
            simulation.hands.push(hand);
        }

        simulation.stats.lands[handLands]++;
        simulation.stats.total += handLands;

        for (let i = 0; i < hand.length; i++) {
            if (!simulation.stats.cards[hand[i].id]) {
                simulation.stats.cards[hand[i].id] = 0;
            }
            simulation.stats.cards[hand[i].id]++
        }

        return simulation;
    }

    static countLands(hand) {
        let lands = 0;
        for (let i = 0; i < hand.length; i++) {
            lands += hand[i].is_land === 1 ? 1 : 0;
        }

        return lands;
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

        let hands = !this.state.meta.hands ? false : JSON.parse(this.state.meta.hands);

        let simulation = this.state.simulation;
        let landKeys = [];
        let maxLands = 0;
        let cardKeys = [];

        if (simulation !== false) {
            landKeys = Object.keys(simulation.stats.lands);
            cardKeys = Object.keys(simulation.stats.cards);

            for (let i = 0; i < landKeys.length; i++) {
                if (simulation.stats.lands[landKeys[i]] > maxLands) {
                    maxLands = simulation.stats.lands[landKeys[i]];
                }
            }
        }

        return (
            <DocumentMeta {...meta}>
                <div className="DeckViewerComponent DraftComponent">
                    <div className="twelve-width">
                        <Grid>
                            <Row>
                                {this.state.type === 'base' && <Col md={8}>
                                    <div className="section">
                                        <h2>
                                            {this.state.meta.name}
                                            <div className="pull-right">
                                                <Button onClick={() => this.setState({type: 'base'})} className="active">Overview</Button>
                                                <Button onClick={() => this.setState({type: 'simulate'})}>Simulate</Button>
                                            </div>
                                        </h2>
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
                                    {hands !== false && <div className="hands">
                                        <h3>Ideal Hands</h3>
                                        {hands.map(function (hand, key) {
                                            return <div className="hand" key={key}>
                                                {hand.map(function (card, key2) {
                                                    return <div className="card">
                                                        <img src={this.state.assoc[card].image}/>
                                                    </div>
                                                }, this)}
                                            </div>;
                                        }, this)}
                                    </div>}
                                </Col>}
                                {this.state.type === 'simulate' && <Col md={8}>
                                    <div className="section">
                                        <h2>
                                            {this.state.meta.name}
                                            <div className="pull-right">
                                                <Button onClick={() => this.setState({type: 'base'})}>Overview</Button>
                                                <Button onClick={() => this.setState({type: 'simulate'})} className="active">Simulate</Button>
                                            </div>
                                        </h2>
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
                                    <div className="simulate-options">
                                        <span>Times to Run: </span>
                                        <DropdownButton title={this.state.num}>
                                            <MenuItem onClick={() => this.setState({num: 1})}>1 Time</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 5})}>5 Times</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 10})}>10 Times</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 20})}>20 Times</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 50})}>50 Times</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 100})}>100 Times</MenuItem>
                                            <MenuItem onClick={() => this.setState({num: 1000})}>1000 Times</MenuItem>
                                        </DropdownButton>
                                        <Button onClick={this.simulate}>Simulate Hands</Button>
                                    </div>
                                    <div className="separator"></div>
                                    {this.state.simulation === false && this.state.simulLoad === false && <div className="simulate-desc">
                                        <h3>Simulate Hands for this Deck</h3>
                                        <p>
                                            You can simulate hands for this deck to see how your hands will typically look. For any
                                            simulation number 20 or below we'll show you the actual hands, above that you'll just
                                            get distribution stats for lands in hand and cards.
                                        </p>
                                    </div>}
                                    {this.state.simulLoad === true && <div className="loading">
                                        <FaSpinner className="spin"/>
                                    </div>}
                                    {this.state.simulation !== false && this.state.simulLoad === false && <Grid className="middle simulations">
                                        <Row>
                                            <Col sm={7}>
                                                <h3>Simulate Hands for this Deck</h3>
                                                <p>
                                                    You can simulate hands for this deck to see how your hands will typically look. For any
                                                    simulation number 20 or below we'll show you the actual hands, above that you'll just
                                                    get distribution stats for lands in hand and cards.
                                                </p>
                                            </Col>
                                            <Col sm={5}>
                                                <div className="stat-flex">
                                                    {landKeys.map(function (landNum, key) {

                                                        return <div className="bar-stat" key={key}>
                                                            <div className="total">{NumberFormat.format(simulation.stats.lands[landNum] / simulation.num * 100, "float", 0)}%</div>
                                                            <div className="bar">
                                                                <OverlayTrigger placement="left" overlay={<Tooltip>{simulation.stats.lands[landNum]} Times</Tooltip>}>
                                                                    <div className="spell-bar" style={{
                                                                        height: (100 * simulation.stats.lands[landNum] / maxLands) + '%',
                                                                        bottom: 0
                                                                    }}></div>
                                                                </OverlayTrigger>
                                                            </div>
                                                            <img src={"/images/icons/" + landNum + '.svg'}/>
                                                        </div>;
                                                    })}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className="separator"></Row>
                                        {cardKeys.map(function (id, key2) {
                                            let card = this.state.assoc[id];
                                            return <Row key={key2} className="simulate-card">
                                                <Col xs={3}>
                                                    <OverlayTrigger placement="top" overlay={<Tooltip className="image-tooltip"><img src={card.image}/></Tooltip>}>
                                                        <span>{card.name}</span>
                                                    </OverlayTrigger>
                                                </Col>
                                                <Col xs={8}>
                                                    <div className="bar">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>{simulation.stats.cards[id]} Times</Tooltip>}>
                                                            <div className="inner" style={{width: (simulation.stats.cards[id] / (7 * simulation.num) * 100) + '%'}}></div>
                                                        </OverlayTrigger>
                                                    </div>
                                                </Col>
                                                <Col xs={1}>
                                                    <div className="percent numbers">
                                                        {NumberFormat.format((simulation.stats.cards[id] / (7 * simulation.num) * 100), 'float', 0)}%
                                                    </div>
                                                </Col>
                                            </Row>;
                                        }, this)}
                                        {simulation.num <= 20 && <Row className="separator"></Row>}
                                        {simulation.num <= 20 && <Row className="hands">
                                            <Col xs={12}>
                                                {simulation.hands.map(function (hand, key) {
                                                    return <div className="hand simul" key={key}>
                                                        {hand.map(function (card, key2) {
                                                            return <div className="card">
                                                                <img src={card.image}/>
                                                            </div>
                                                        }, this)}
                                                    </div>;
                                                }, this)}
                                            </Col>
                                        </Row>}

                                    </Grid>}
                                </Col>}
                                <Col md={4}>

                                    <div className="deck-section">
                                        <div className={"deck-name" + (this.state.deckSel === 'main' ? ' active' : '')}
                                             onClick={() => this.setState({deckSel: this.state.deckSel === 'main' ? '' : 'main'})}
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
                                             onClick={() => this.setState({deckSel: this.state.deckSel === 'sideboard' ? '' : 'sideboard'})}
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
                        </Grid>
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
