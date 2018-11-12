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
import {PieChart, Pie, XAxis, YAxis, CartesianGrid, Bar, Tooltip, ResponsiveContainer, Cell} from 'recharts';

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',

    // styles we need to apply on draggables
    ...draggableStyle,
});

const getListStyle = isDraggingOver => ({});

class Draft extends Component {

    constructor(props) {
        super(props);

        this.state = {
            set: 'grn',
            packs: [],
            lands: [],
            bots: [
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []}
            ],
            isDrafting: false,
            loading: false,
            pick: 1,
            pack: 1,
            deckSel: 'main',
            deck: {
                main: {},
                sideboard: {}
            },
            allPacks: [],
            done: false
        };

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.form = this.form.bind(this);
        this.draft = this.draft.bind(this);
        this.pickCard = this.pickCard.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.reset = this.reset.bind(this);
    }

    draft() {

        this.setState({loading: true, isDrafting: true});

        ApiService.performRequest('/api/draft?set=' + this.state.set, true, 'GET')
            .then((data) => this.processData(data));
    }

    reset() {
        this.setState({
            loading: true,
            pick: 1,
            pack: 1,
            deckSel: 'main',
            deck: {
                main: {},
                sideboard: {}
            },
            bots: [
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []},
                {colors: [], picks: 0, cards: []}
            ]
        });

        ApiService.performRequest('/api/draft?set=' + this.state.set, true, 'GET')
            .then((data) => this.processData(data));
    }

    pickCard(section, card) {

        let _ = require('lodash');
        let packs = this.state.packs;
        let currentPack = packs.shift();
        let bots = this.state.bots;
        let allPacks = this.state.allPacks;
        let done = false;
        let packNum = this.state.pack;
        let deck = this.state.deck;

        currentPack = _.without(currentPack, card);

        for (let i = 0; i < packs.length; i++) {
            let bot = bots[i];
            let thisPack = packs[i];

            if (this.state.pick > 2) {
                let selected = false;
                for (let j = 0; j < thisPack.length; j++) {
                    let colors = thisPack[j].colors.split(',');
                    for (let c = 0; c < colors.length; c++) {
                        if (bot.colors.indexOf(thisPack[j].colors[c]) > -1) {
                            let selection = thisPack[j];
                            thisPack.splice(j, 1);
                            bot.cards.push(selection);
                            bot.picks++;
                            bots[i] = bot;
                            packs[i] = thisPack;
                            selected = true;
                            break;
                        }
                    }
                    if (selected) {
                        break;
                    }
                }

                if (!selected) {
                    let selection = thisPack.shift();
                    bot.cards.push(selection);
                    bot.picks++;
                    bots[i] = bot;
                    packs[i] = thisPack;
                }
            } else {
                let selection = thisPack.shift();
                bot.cards.push(selection);
                bot.colors = _.union(bot.colors, selection.colors.split(','));
                if (bot.colors.length > 2) {
                    bot.colors = bot.colors.slice(0, 2);
                }
                bot.picks++;
                bots[i] = bot;
                packs[i] = thisPack;
            }
        }

        packs.push(currentPack);

        if (currentPack.length === 0) {

            if (allPacks.length > 0) {
                packs = allPacks.splice(0, 8);
                packNum++;
            } else {
                done = true;
            }
        }

        if (deck[section][card.name]) {

            deck[section][card.name].number++;
        } else {
            deck[section][card.name] = {
                card: card,
                cost: card.total_cost,
                number: 1
            }
        }

        this.setState({
            packs: packs,
            bots: bots,
            allPicks: allPacks,
            done: done,
            pick: this.state.pick + 1,
            pack: packNum,
            deck: deck
        })
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
                let cards = deck[this.state.deckSel][source.index];
                let other = this.state.deckSel === 'main' ? 'sideboard' : 'main';

                if (cards.number === 1) {
                    delete deck[this.state.deckSel][source.index];
                } else {
                    deck[this.state.deckSel][source.index].number--;
                }

                if (deck[other][source.index]) {
                    deck[other][source.index].number++;
                } else {
                    deck[other][source.index] = cards;
                }
                this.setState({deck: deck});
            } else {
                let card = this.state.packs[0][source.index];
                this.pickCard(splits[1], card);
            }
        }
    };

    processData(data) {

        let packs = data.packs;
        let lands = data.lands;

        packs = this.shuffle(packs);
        let currentSet = packs.splice(0, 8);

        this.setState({
            loading: false,
            packs: currentSet,
            allPacks: packs,
            lands: lands,
            pick: 1,
            pack: 1,
            cards: [],
            isDrafting: true,
            done: false
        });
    }

    shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
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

        let sets = {
            grn: 'Guilds of Ravnica',
            m19: 'Core Set 2019',
            dom: 'Dominaria',
            rix: 'Rivals of Ixalan',
            xln: 'Ixalan'
        };

        let _ = require('lodash');

        let mainCards = Object.values(this.state.deck.main);
        let sideCards = Object.values(this.state.deck.sideboard);

        let mainCount = mainCards.reduce((prev, next) => prev + next.number, 0);
        let sideCount = sideCards.reduce((prev, next) => prev + next.number, 0);

        mainCards = _.sortBy(mainCards, ['cost']);
        sideCards = _.sortBy(sideCards, ['cost']);

        return (
            <DocumentMeta {...meta}>
                <div className="DraftComponent">
                    <div className="twelve-width">
                        {this.state.isDrafting === false && <Grid className="initial">
                            <Row>
                                <Col sm={8}>
                                    <h2>Drafting</h2>
                                    <p>
                                        Drafting in Magic the Gathering is a popular game mode where you build a deck from
                                        given packs and compete with that deck against other players. Typically this is
                                        done in groups of 8 people and you play until you lose 3 times. Each person is given
                                        3 packs of cards for 24 packs total in the group. Packs typically have 16 cards, but
                                        you remove the land and marketing card for a total of 14 cards per pack to use.
                                    </p>
                                    <p>
                                        Each person opens Pack 1, removes the land and marketing card, picks 1 card from that
                                        pack and passes the pack to the next person. You keep picking 1 card and passing the
                                        rest until all cards are dispersed, leaving you with 14 cards after the first pack.
                                        You then open the next pack and continue in the same manner until all packs are opened
                                        and all cards are dispersed. In the end you should have 42 cards from which to make a
                                        40 card deck.
                                    </p>
                                    <p>
                                        From your 42 cards, you must make a 40 card deck with any number of lands you wish. The
                                        remaining cards go into your sideboard that you can switch in after game 1 in a Best of
                                        3,5,7 format. You typically get to keep any cards you draft and there usually are rewards
                                        based on how many games you can win at the event.
                                    </p>
                                    <p>
                                        Here you can practice drafting similar to how you'll draft in Magic the Gathering Arena
                                        and get a feel for how to draft, which cards are useful, and get some tips along the way.
                                    </p>
                                </Col>
                                <Col sm={4}>
                                    <div className="drop-container">
                                        <div className="draft-label">Select a Set</div>
                                        <DropdownButton title={sets[this.state.set]}>
                                            <MenuItem onClick={() => this.setState({set: 'grn'})}>{sets['grn']}</MenuItem>
                                            <MenuItem onClick={() => this.setState({set: 'm19'})}>{sets['m19']}</MenuItem>
                                            <MenuItem onClick={() => this.setState({set: 'dom'})}>{sets['dom']}</MenuItem>
                                            <MenuItem onClick={() => this.setState({set: 'rix'})}>{sets['rix']}</MenuItem>
                                            <MenuItem onClick={() => this.setState({set: 'xln'})}>{sets['xln']}</MenuItem>
                                        </DropdownButton>
                                    </div>
                                    <Button bsStyle="success" onClick={this.draft}>Begin Draft</Button>
                                    <hr/>
                                    <Button bsStyle="success" href={"/draft/" + this.state.set}>
                                        {sets['grn']} Draft Helper
                                    </Button>
                                </Col>
                            </Row>
                        </Grid>}
                        {this.state.loading === false && this.state.isDrafting && <DragDropContext onDragEnd={this.onDragEnd}>
                            <Grid className="draft-section">
                                <Row>
                                    <Col md={8}>
                                        <div className="draft-info">
                                            <div className="images">
                                                <img src={"/images/packs/" + this.state.set + '.png'} className={(this.state.pack === 1 ? 'active' : '')}/>
                                                <img src={"/images/packs/" + this.state.set + '.png'} className={(this.state.pack === 2 ? 'active' : '')}/>
                                                <img src={"/images/packs/" + this.state.set + '.png'} className={(this.state.pack === 3 ? 'active' : '')}/>
                                            </div>
                                            <div className="pack-text">
                                                <div className="pack-num">Pack {this.state.pack}</div>
                                                <div className="set-name">{sets[this.state.set]}</div>
                                            </div>
                                            <div className="pull-right">
                                                <span className="pick-num">Pick {this.state.pick}</span>
                                                <Button bsStyle="danger" onClick={this.reset}><FaRedo/></Button>
                                            </div>
                                        </div>
                                        <Droppable droppableId="droppable">
                                            {(provided, snapshot) => (
                                                <div className="cards-flex"
                                                     ref={provided.innerRef}>
                                                    {this.state.packs[0].map(function (card, key) {
                                                        return <Draggable key={card.image} draggableId={card.image} index={key}>
                                                            {(provided, snapshot) => (
                                                                <div className="card"
                                                                     ref={provided.innerRef}
                                                                     {...provided.draggableProps}
                                                                     {...provided.dragHandleProps}
                                                                     style={getItemStyle(
                                                                         snapshot.isDragging,
                                                                         provided.draggableProps.style
                                                                     )}>
                                                                    <img src={card.image}/>
                                                                    <div className="hoverable">
                                                                        <img src={card.image}/>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>;
                                                    }, this)}
                                                </div>
                                            )}
                                        </Droppable>
                                    </Col>
                                    <Col md={4}>
                                        <Droppable droppableId="deck-main">
                                            {(provided, snapshot) => (
                                                <div className="deck-section"
                                                     ref={provided.innerRef}>
                                                    <div className={"deck-name" + (this.state.deckSel === 'main' ? ' active' : '')}
                                                         onClick={() => this.setState({deckSel: 'main'})}
                                                         style={getListStyle(snapshot.isDraggingOver)}
                                                    >
                                                        <div className="text">
                                                            DECK
                                                            <div className="amount">{mainCount} / 40</div>
                                                        </div>
                                                        <div className="pull-right">
                                                            {this.state.deckSel === 'main' && <FaCaretDown/>}
                                                            {this.state.deckSel !== 'main' && <FaCaretRight/>}
                                                        </div>
                                                    </div>
                                                    <Collapse in={this.state.deckSel === 'main'} appear={true}>
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
                                                    <div className={"deck-name" + (this.state.deckSel === 'sideboard' ? ' active' : '')}
                                                         onClick={() => this.setState({deckSel: 'sideboard'})}
                                                         style={getListStyle(snapshot.isDraggingOver)}
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
                                    </Col>
                                </Row >
                            </Grid >
                        </DragDropContext >}
                        {this.state.loading && <div className="loading">
                            <FaSpinner className="spin"/>
                        </div>}
                    </div>
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(Draft);
