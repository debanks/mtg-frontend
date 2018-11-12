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

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',

    // styles we need to apply on draggables
    ...draggableStyle,
});

const getListStyle = isDraggingOver => ({});

class DeckEditor extends Component {

    constructor(props) {
        super(props);

        this.state = {
            cards: [],
            loading: true,
            query: '',
            sets: [],
            costs: [],
            page: 1,
            orderBy: 'faces.total_cost',
            ordering: 'asc',
            rarities: [],
            colors: ['C', 'B', 'G', 'R', 'U', 'W'],
            hasMore: false,
            deckSel: 'main',
            type: 'Aggro',
            deck: {
                main: {},
                sideboard: {}
            }
        };

        this.callApi(this.state.query, this.state.sets, this.state.costs, this.state.orderBy, this.state.ordering, this.state.colors, this.state.rarities, this.state.page, true);

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.pickCard = this.pickCard.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.callApi = this.callApi.bind(this);
        this.handleArrayChange = this.handleArrayChange.bind(this);
        this.submit = this.submit.bind(this);
    }

    doSearch(e) {
        e.preventDefault();
        this.setState({loading: true, page: 1});
        this.callApi(this.state.query, this.state.sets, this.state.costs, this.state.orderBy, this.state.ordering, this.state.colors, this.state.rarities, 1, true);
    }

    callApi(query, sets, costs, orderBy, ordering, colors, rarities, page, reset) {

        let url = '/api/search?q=' + query + '&sort_field=' + orderBy + '&sort_order=' + ordering + '&page=' + page;

        if (sets.length > 0) {
            url += '&sets=' + sets.join(',');
        }

        if (costs.length > 0) {
            url += '&costs=' + costs.join(',');
        }

        if (colors.length > 0) {
            url += '&colors=' + colors.join(',');
        }

        if (rarities.length > 0) {
            url += '&rarities=' + rarities.join(',');
        }

        ApiService.performRequest(url, true, 'GET')
            .then((data) => this.processData(data, reset));
    }

    processData(data, reset) {

        let cards = this.state.cards;
        if (reset) {
            cards = data.cards;
        } else {
            cards = cards.concat(data.cards);
        }

        this.setState({
            loading: false,
            cards: cards,
            hasMore: data.cards.length === 25
        });
    }

    pickCard(section, card) {

        let _ = require('lodash');
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

        this.setState({
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
                let deck = this.state.deck;
                let cards = deck[this.state.deckSel][source.index];

                if (cards.number === 1) {
                    delete deck[this.state.deckSel][source.index];
                } else {
                    deck[this.state.deckSel][source.index].number--;
                }
                this.setState({deck: deck});
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
                let card = this.state.cards[source.index];
                this.pickCard(splits[1], card);
            }
        }
    };

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let state = this.state;
        state[name] = value;

        this.setState(state);
    }

    handleArrayChange(type, value) {
        let arr = this.state[type];
        let _ = require('lodash');

        if (arr.indexOf(value) > -1) {
            arr = _.without(arr, value);
        } else {
            arr.push(value);
        }

        this.setState({[type]: arr});
    }

    submit() {
        let data = {
            type: this.state.type,
            deck: this.state.deck
        };

        ApiService.performRequest('/api/decks', true, 'POST', data);
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

        mainCards = _.sortBy(mainCards, ['cost']);
        sideCards = _.sortBy(sideCards, ['cost']);

        let mainCount = mainCards.reduce((prev, next) => prev + next.number, 0);
        let sideCount = sideCards.reduce((prev, next) => prev + next.number, 0);

        return (
            <DocumentMeta {...meta}>
                <div className="DraftComponent DeckEditor">
                    <div className="twelve-width">
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <Grid className="draft-section">
                                <Row>
                                    <Col md={8}>
                                        <div className="options">
                                            <div className="search-container">
                                                <form onSubmit={this.doSearch}>
                                                    <Grid className="form-options">
                                                        <Row>
                                                            <Col xs={12}>
                                                                <div className="search-query">
                                                                    <input name="query" onChange={this.handleInputChange} placeholder="Search through names and types"/>
                                                                    <Button type="submit"><FaSearch/></Button>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col xs={12}>
                                                                <Grid className="search-section">
                                                                    <Row>
                                                                        <Col xs={3}>Colors</Col>
                                                                        <Col xs={9}>
                                                                            <div className="colors">
                                                                                <img src="/images/icons/B.svg" className={(this.state.colors.indexOf('B') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'B')}/>
                                                                                <img src="/images/icons/G.svg" className={(this.state.colors.indexOf('G') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'G')}/>
                                                                                <img src="/images/icons/R.svg" className={(this.state.colors.indexOf('R') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'R')}/>
                                                                                <img src="/images/icons/U.svg" className={(this.state.colors.indexOf('U') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'U')}/>
                                                                                <img src="/images/icons/W.svg" className={(this.state.colors.indexOf('W') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'W')}/>
                                                                                <img src="/images/icons/C.svg" className={(this.state.colors.indexOf('C') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('colors', 'C')}/>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Col xs={3}>Costs</Col>
                                                                        <Col xs={9}>
                                                                            <div className="colors">
                                                                                <img src="/images/icons/0.svg" className={(this.state.costs.indexOf('0') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '0')}/>
                                                                                <img src="/images/icons/1.svg" className={(this.state.costs.indexOf('1') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '1')}/>
                                                                                <img src="/images/icons/2.svg" className={(this.state.costs.indexOf('2') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '2')}/>
                                                                                <img src="/images/icons/3.svg" className={(this.state.costs.indexOf('3') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '3')}/>
                                                                                <img src="/images/icons/4.svg" className={(this.state.costs.indexOf('4') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '4')}/>
                                                                                <img src="/images/icons/5.svg" className={(this.state.costs.indexOf('5') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '5')}/>
                                                                                <img src="/images/icons/6.svg" className={(this.state.costs.indexOf('6') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '6')}/>
                                                                                <img src="/images/icons/7+.png" className={(this.state.costs.indexOf('7+') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('costs', '7+')}/>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Col xs={3}>Sets</Col>
                                                                        <Col xs={9}>
                                                                            <div className="colors">
                                                                                <img src="/images/icons/rix.png" className={(this.state.sets.indexOf('rix') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('sets', 'rix')}/>
                                                                                <img src="/images/icons/xln.png" className={(this.state.sets.indexOf('xln') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('sets', 'xln')}/>
                                                                                <img src="/images/icons/m19.png" className={(this.state.sets.indexOf('m19') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('sets', 'm19')}/>
                                                                                <img src="/images/icons/dom.png" className={(this.state.sets.indexOf('dom') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('sets', 'dom')}/>
                                                                                <img src="/images/icons/grn.png" className={(this.state.sets.indexOf('grn') > -1 ? 'active' : '')}
                                                                                     onClick={() => this.handleArrayChange('sets', 'grn')}/>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Col xs={3}>Rarity</Col>
                                                                        <Col xs={9}>
                                                                            <div className="colors">
                                                                                <div className={"rarity" + (this.state.rarities.indexOf('common') > -1 ? ' active' : '')}
                                                                                     onClick={() => this.handleArrayChange('rarities', 'common')}>Common
                                                                                </div>
                                                                                <div className={"rarity" + (this.state.rarities.indexOf('uncommon') > -1 ? ' active' : '')}
                                                                                     onClick={() => this.handleArrayChange('rarities', 'uncommon')}>Uncommon
                                                                                </div>
                                                                                <div className={"rarity" + (this.state.rarities.indexOf('rare') > -1 ? ' active' : '')}
                                                                                     onClick={() => this.handleArrayChange('rarities', 'rare')}>Rare
                                                                                </div>
                                                                                <div className={"rarity" + (this.state.rarities.indexOf('mythic') > -1 ? ' active' : '')}
                                                                                     onClick={() => this.handleArrayChange('rarities', 'mythic')}>Mythic
                                                                                </div>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                </Grid>
                                                            </Col>
                                                        </Row>
                                                    </Grid>
                                                </form>
                                            </div>
                                        </div>
                                        {this.state.loading === false && <Droppable droppableId="droppable">
                                            {(provided, snapshot) => (
                                                <div className="cards-flex"
                                                     ref={provided.innerRef}>
                                                    <InfiniteScroll
                                                        pageStart={1}
                                                        loadMore={this.nextPage}
                                                        hasMore={this.state.hasMore}
                                                        initialLoad={false}
                                                        loader={<div className="loader" key={0}>Loading ...</div>}
                                                    >
                                                        {this.state.cards.map(function (card, key) {
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
                                                    </InfiniteScroll>
                                                </div>
                                            )}
                                        </Droppable>}

                                        {this.state.loading && <div className="loading">
                                            <FaSpinner className="spin"/>
                                        </div>}
                                    </Col>
                                    <Col md={4}>
                                        <div className="deck-meta">
                                            <DropdownButton title={this.state.type}>
                                                <MenuItem onClick={() => this.setState({type: 'Aggro'})}>Aggro</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Control'})}>Control</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Combo'})}>Combo</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Aggro-Control'})}>Aggro-Control</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Midrange'})}>Midrange</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Prison'})}>Prison</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Gimmick'})}>Gimmick</MenuItem>
                                                <MenuItem onClick={() => this.setState({type: 'Meta'})}>Meta</MenuItem>
                                            </DropdownButton>
                                            <Button onClick={() => this.submit()}>Create</Button>
                                        </div>
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
                                                            <div className="amount">{mainCount} / 60</div>
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
                        </DragDropContext >
                    </div>
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(DeckEditor);
