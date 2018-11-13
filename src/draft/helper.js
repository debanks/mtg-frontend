import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import ReactDOM from 'react-dom';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import {Grid, Row, Col, Button, FormGroup, InputGroup, DropdownButton, MenuItem, Collapse} from 'react-bootstrap';
import {FaSearch, FaSpinner, FaCaretDown, FaCaretRight, FaRedo, FaStar, FaStarHalf} from 'react-icons/fa';
import DocumentMeta from 'react-document-meta';
import './index.sass';
import Dimensions from 'react-dimensions';
import {browserHistory} from 'react-router';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';
import InfiniteScroll from 'react-infinite-scroller';

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',

    // styles we need to apply on draggables
    ...draggableStyle,
});

const getListStyle = isDraggingOver => ({});

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
            deckSel: {
                main: true,
                stats: true,
                sideboard: false
            },
            stats: {
                avgCost: 0,
                colors: [],
                costs: {
                    0: {creatures: 0, spells: 0},
                    1: {creatures: 0, spells: 0},
                    2: {creatures: 0, spells: 0},
                    3: {creatures: 0, spells: 0},
                    4: {creatures: 0, spells: 0},
                    5: {creatures: 0, spells: 0},
                    6: {creatures: 0, spells: 0},
                    7: {creatures: 0, spells: 0}
                },
                types: {
                    creatures: 0,
                    spells: 0,
                    lands: 0
                }
            },
            deck: {
                main: {},
                sideboard: {},
                mainCards: 0,
                sideboardCards: 0
            }
        };

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.pickCard = this.pickCard.bind(this);
        this.reset = this.reset.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.updateOpen = this.updateOpen.bind(this);

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

    onDragEnd = result => {
        let _ = require('lodash');
        const {source, destination} = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId !== destination.droppableId) {

            let splits = destination.droppableId.split('-');
            let splits2 = source.droppableId.split('-');

            if (splits.length === 1) {
                return;
            } else if (splits2.length > 1) {
                let deck = this.state.deck;
                let current = splits2[1];
                let other = splits[1];
                let cards = deck[current][source.index];

                if (cards.number === 1) {
                    delete deck[current][source.index];
                } else {
                    deck[current][source.index].number--;
                }

                if (deck[other][source.index]) {
                    deck[other][source.index].number++;
                } else {
                    deck[other][source.index] = cards;
                }

                deck[current + 'Cards']--;
                deck[other + 'Cards']++;

                let stats = this.getStats(deck.main, deck.mainCards);

                this.setState({deck: deck, stats: stats});
            } else {
                let options = this.state.options;

                options = _.sortBy(options, ['value']);
                options.reverse();

                let card = options[source.index];
                let section = splits[1];
                let deck = this.state.deck;

                if (deck[section][card.name]) {

                    deck[section][card.name].number++;
                } else {
                    deck[section][card.name] = {
                        card: card,
                        cost: card.total_cost,
                        number: 1,
                        id: card.id
                    }
                }

                deck[section + 'Cards']++;

                let stats = this.getStats(deck.main, deck.mainCards);

                this.setState({
                    deck: deck,
                    stats: stats
                });

                this.reset();
            }
        }
    };

    getStats(main, count) {

        let colors = {
            B: 0,
            C: 0,
            G: 0,
            R: 0,
            U: 0,
            W: 0
        };

        let totalCost = 0;

        let stats = {
            avgCost: 0,
            colors: [],
            costs: {
                0: {creatures: 0, spells: 0},
                1: {creatures: 0, spells: 0},
                2: {creatures: 0, spells: 0},
                3: {creatures: 0, spells: 0},
                4: {creatures: 0, spells: 0},
                5: {creatures: 0, spells: 0},
                6: {creatures: 0, spells: 0},
                7: {creatures: 0, spells: 0}
            },
            types: {
                creatures: 0,
                spells: 0,
                lands: 0
            }
        };

        if (count === 0) {
            return stats;
        }

        let cards = Object.values(main);

        for (let i = 0; i < cards.length; i++) {
            for (let j = 0; j < cards[i].number; j++) {
                totalCost += cards[i].cost;
                let colorSplits = cards[i].card.colors.split(',');

                let costKey = cards[i].cost >= 7 ? 7 : cards[i].cost;

                for (let k = 0; k < colorSplits.length; k++) {
                    colors[colorSplits[k]]++;
                }

                if (cards[i].card.type.indexOf('Creature') > -1 || cards[i].card.type.indexOf('Planeswalker') > -1) {
                    stats.types.creatures++;
                    stats.costs[costKey].creatures++;
                } else if (cards[i].card.type.indexOf('Land') === -1) {
                    stats.types.spells++;
                    stats.costs[costKey].spells++;
                } else {
                    stats.types.lands++;
                }
            }
        }

        let colorKeys = Object.keys(colors);

        for (let i = 0; i < colorKeys.length; i++) {
            if (colors[colorKeys[i]] > 0) {
                stats.colors.push({color: colorKeys[i], amount: colors[colorKeys[i]]});
            }
        }

        stats.avgCost = totalCost / count;

        return stats;
    }

    updateOpen(key) {

        let deckSel = this.state.deckSel;

        if (key === 'sideboard') {
            deckSel.main = false;
        }

        if (key === 'main') {
            deckSel.sideboard = false;
        }

        deckSel[key] = !deckSel[key];

        this.setState({deckSel: deckSel});
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
        let cards = this.state.search !== '' ? _.filter(this.state.cards, function (obj) {
            return obj.name.toLowerCase().indexOf(search.toLowerCase()) > -1
        }) : this.state.cards;

        options = _.sortBy(options, ['value']);
        options.reverse();
        cards = _.sortBy(cards, ['value']);
        cards.reverse();

        let totalCards = cards;
        let maxCost = 0;
        let maxCreat = Math.max(this.state.stats.types.creatures, this.state.stats.types.spells, this.state.stats.types.lands);

        cards = cards.slice(0, this.state.showing);

        let mainCards = Object.values(this.state.deck.main);
        let sideCards = Object.values(this.state.deck.sideboard);

        mainCards = _.sortBy(mainCards, ['cost']);
        sideCards = _.sortBy(sideCards, ['cost']);

        let mainCount = this.state.deck.mainCards;
        let sideCount = this.state.deck.sideboardCards;

        let costKeys = Object.keys(this.state.stats.costs);
        let costs = Object.values(this.state.stats.costs);

        for (let i = 0; i < costs.length; i++) {
            let num = costs[i].creatures + costs[i].spells;

            if (num > maxCost) {
                maxCost = num;
            }
        }

        return (
            <DocumentMeta {...meta}>
                <div className="DraftComponent HelperComponent">
                    {this.state.loading === false && <div className="helper">
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <div>
                                <div className="twelve-width sidebar">
                                    <div className="sidebar-inner">
                                        <div className="deck-section">
                                            <div className={"deck-name" + (this.state.deckSel.stats ? ' active' : '')}
                                                 onClick={() => this.updateOpen('stats')}
                                            >
                                                <div className="text">
                                                    STATS
                                                    <div className="amount">Pick {mainCount + sideCount} / 42</div>
                                                </div>
                                                <div className="pull-right">
                                                    {this.state.deckSel.stats === true && <FaCaretDown/>}
                                                    {this.state.deckSel.stats !== true && <FaCaretRight/>}
                                                </div>
                                            </div>
                                            <Collapse in={this.state.deckSel.stats} appear={true}>
                                                <Grid className="deck stats">
                                                    <Row>
                                                        <Col xs={6}>
                                                            <div className="bar-section">
                                                                <div className="bar">
                                                                    <div className="inner creatures" style={{
                                                                        height: (maxCreat > 0 ? this.state.stats.types.creatures / maxCreat * 100 : 0) + '%'
                                                                    }}></div>
                                                                </div>
                                                                <div className="numbers">C</div>
                                                            </div>
                                                            <div className="bar-section">
                                                                <div className="bar">
                                                                    <div className="inner spells" style={{
                                                                        height: (maxCreat > 0 ? this.state.stats.types.spells / maxCreat * 100 : 0) + '%'
                                                                    }}></div>
                                                                </div>
                                                                <div className="numbers">S</div>
                                                            </div>
                                                            <div className="bar-section">
                                                                <div className="bar">
                                                                    <div className="inner lands" style={{
                                                                        height: (maxCreat > 0 ? this.state.stats.types.lands / maxCreat * 100 : 0) + '%'
                                                                    }}></div>
                                                                </div>
                                                                <div className="numbers">L</div>
                                                            </div>
                                                        </Col>
                                                        <Col xs={6} className="align-right">
                                                                {costKeys.map(function(costKey, key2) {
                                                                    let cost = this.state.stats.costs[costKey];
                                                                    return <div className="bar-section">
                                                                        <div className="bar">
                                                                            <div className="inner creatures" style={{
                                                                                height: (maxCost > 0 ? cost.creatures / maxCost * 100 : 0) + '%'
                                                                            }}></div>
                                                                            <div className="inner spells" style={{
                                                                                height: (maxCost > 0 ? cost.spells / maxCost * 100 : 0) + '%',
                                                                                bottom: (maxCost > 0 ? cost.creatures / maxCost * 100 : 0) + '%'
                                                                            }}></div>
                                                                        </div>
                                                                        <div className="numbers">{costKey}</div>
                                                                    </div>
                                                                }, this)}
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={4} className="stat-label">
                                                            Colors
                                                        </Col>
                                                        <Col xs={8} className="stat-value align-right numbers">
                                                            {this.state.stats.colors.map(function(color, key) {
                                                                return <div className="color">
                                                                    <span>{color.amount}</span>
                                                                    <img src={"/images/icons/" + color.color + '.svg'}/>
                                                                </div>
                                                            })}
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={4} className="stat-label">
                                                            Avg Cost
                                                        </Col>
                                                        <Col xs={8} className="stat-value align-right numbers">
                                                            {NumberFormat.format(this.state.stats.avgCost, 'float', 2)}
                                                        </Col>
                                                    </Row>
                                                </Grid>
                                            </Collapse>
                                        </div>
                                        <Droppable droppableId="deck-main">
                                            {(provided, snapshot) => (
                                                <div className="deck-section"
                                                     ref={provided.innerRef}>
                                                    <div className={"deck-name" + (this.state.deckSel.main ? ' active' : '')}
                                                         onClick={() => this.updateOpen('main')}
                                                         style={getListStyle(snapshot.isDraggingOver)}
                                                    >
                                                        <div className="text">
                                                            DECK
                                                            <div className="amount">{mainCount} / 40</div>
                                                        </div>
                                                        <div className="pull-right">
                                                            {this.state.deckSel.main === true && <FaCaretDown/>}
                                                            {this.state.deckSel.main !== true && <FaCaretRight/>}
                                                        </div>
                                                    </div>
                                                    <Collapse in={this.state.deckSel.main} appear={true}>
                                                        <div className="deck"
                                                             style={getListStyle(snapshot.isDraggingOver)}>
                                                            {mainCards.map(function (cards, key) {
                                                                let costs = cards.card.cost_text.split('{');
                                                                let colors = [];

                                                                for (let i = 1; i < costs.length; i++) {
                                                                    let color = costs[i].split('}')[0].replace('/', '');
                                                                    colors.push(color);
                                                                }

                                                                return <Draggable key={cards.card.image} draggableId={'main' + cards.card.image} index={cards.card.name}>
                                                                    {(provided, snapshot) => (
                                                                        <div className="deck-card"
                                                                             ref={provided.innerRef}
                                                                             {...provided.draggableProps}
                                                                             {...provided.dragHandleProps}
                                                                             style={getItemStyle(
                                                                                 snapshot.isDragging,
                                                                                 provided.draggableProps.style
                                                                             )}>
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
                                                                    )}
                                                                </Draggable>
                                                            }, this)}
                                                        </div>
                                                    </Collapse>
                                                </div>
                                            )}

                                        </Droppable>
                                        <Droppable droppableId="deck-sideboard">
                                            {(provided, snapshot) => (
                                                <div className="deck-section"
                                                     ref={provided.innerRef}>
                                                    <div className={"deck-name" + (this.state.deckSel.sideboard ? ' active' : '')}
                                                         onClick={() => this.updateOpen('sideboard')}
                                                         style={getListStyle(snapshot.isDraggingOver)}
                                                    >
                                                        <div className="text">
                                                            Sideboard
                                                            <div className="amount">{sideCount} Cards</div>
                                                        </div>
                                                        <div className="pull-right">
                                                            {this.state.deckSel.sideboard === true && <FaCaretDown/>}
                                                            {this.state.deckSel.sideboard !== true && <FaCaretRight/>}
                                                        </div>
                                                    </div>
                                                    <Collapse in={this.state.deckSel.sideboard} appear={true}>
                                                        <div className="deck"
                                                             style={getListStyle(snapshot.isDraggingOver)}
                                                        >
                                                            {sideCards.map(function (cards, key) {
                                                                let costs = cards.card.cost_text.split('{');
                                                                let colors = [];

                                                                for (let i = 1; i < costs.length; i++) {
                                                                    let color = costs[i].split('}')[0].replace('/', '');
                                                                    colors.push(color);
                                                                }

                                                                return <Draggable key={cards.card.image} draggableId={'sideboard' + cards.card.image} index={cards.card.name}>
                                                                    {(provided, snapshot) => (
                                                                        <div className="deck-card"
                                                                             ref={provided.innerRef}
                                                                             {...provided.draggableProps}
                                                                             {...provided.dragHandleProps}
                                                                             style={getItemStyle(
                                                                                 snapshot.isDragging,
                                                                                 provided.draggableProps.style
                                                                             )}>
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
                                                                    )}
                                                                </Draggable>
                                                            }, this)}
                                                        </div>
                                                    </Collapse>
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                                <div className="picks">
                                    <div className="twelve-width">
                                        <Grid className="staggered">
                                            <Row>
                                                <div className="pick-name">
                                                    <span>Rank Pack Options</span>
                                                    <div className="pull-right">
                                                        <Button bsStyle="danger" onClick={this.reset}>Reset</Button>
                                                    </div>
                                                </div>
                                                <Droppable droppableId="droppable">
                                                    {(provided, snapshot) => (
                                                        <div className="card-picks"
                                                             ref={provided.innerRef}>
                                                            {options.map(function (card, key) {

                                                                let stars = [];

                                                                for (let i = 1; i < 6; i++) {
                                                                    if (i * 2 <= card.value) {
                                                                        stars.push(<FaStar/>)
                                                                    } else if (card.value > (i - 1) * 2) {
                                                                        stars.push(<FaStarHalf/>)
                                                                    }
                                                                }

                                                                return <Col key={key} md={3} sm={6} xs={6}>
                                                                    <Draggable key={card.image} draggableId={card.image} index={key}>
                                                                        {(provided, snapshot) => (
                                                                            <div className="card"
                                                                                 ref={provided.innerRef}
                                                                                 {...provided.draggableProps}
                                                                                 {...provided.dragHandleProps}
                                                                                 style={getItemStyle(
                                                                                     snapshot.isDragging,
                                                                                     provided.draggableProps.style
                                                                                 )}>
                                                                                <img src={card.image} onClick={() => this.setState({bigCard: true, bigCardImage: card.image})}/>
                                                                                <div className="hoverable">
                                                                                    <img src={card.image}/>
                                                                                </div>
                                                                                <div className="value">
                                                                                    {stars.map(function (Icon, key2) {
                                                                                        return Icon;
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                </Col>;
                                                            }, this)}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </Row>
                                        </Grid>
                                    </div>
                                </div>
                                <div className="search">
                                    <div className="twelve-width">
                                        <Grid className="staggered">
                                            <div className="search-query">
                                                <input name="search" value={search} onChange={this.handleInputChange} placeholder="Search through names" autoComplete="off"/>
                                                {search !== '' && <span className="clear" onClick={() => this.setState({search: ''})}>X</span>}
                                                <Button type="submit"><FaSearch/></Button>
                                            </div>
                                        </Grid>
                                    </div>
                                </div>
                                <div className="twelve-width">
                                    <Grid className="staggered all-cards">
                                        <Row>
                                            <InfiniteScroll
                                                pageStart={1}
                                                loadMore={() => this.setState({showing: this.state.showing + 25})}
                                                hasMore={this.state.showing < totalCards.length}
                                                initialLoad={false}
                                                loader={<div className="loader" key={0}>Loading ...</div>}
                                            >
                                                {cards.map(function (card, key) {

                                                    let stars = [];

                                                    for (let i = 1; i < 6; i++) {
                                                        if (i * 2 <= card.value) {
                                                            stars.push(<FaStar/>)
                                                        } else if (card.value > (i - 1) * 2) {
                                                            stars.push(<FaStarHalf/>)
                                                        }
                                                    }
                                                    return <Col key={key} md={3} sm={6} xs={6}>
                                                        <div className="card">
                                                            <img src={card.image} onClick={() => this.pickCard(card)}/>
                                                            <div className="hoverable">
                                                                <img src={card.image}/>
                                                            </div>
                                                            <div className="value">
                                                                {stars.map(function (Icon, key2) {
                                                                    return Icon;
                                                                })}
                                                            </div>
                                                        </div>
                                                    </Col>;
                                                }, this)}
                                            </InfiniteScroll>
                                        </Row>
                                    </Grid>
                                </div>
                            </div>
                        </DragDropContext>
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
