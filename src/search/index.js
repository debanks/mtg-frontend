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
import InfiniteScroll from 'react-infinite-scroller';

class Search extends Component {

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
            bigCard: false,
            bigCardImage: ''
        };

        this.callApi(this.state.query, this.state.sets, this.state.costs, this.state.orderBy, this.state.ordering, this.state.colors, this.state.rarities, this.state.page, true);

        this.processData = this.processData.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.callApi = this.callApi.bind(this);
        this.handleArrayChange = this.handleArrayChange.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.nextPage = this.nextPage.bind(this);
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
            hasMore: this.state.page * 25 < data.count
        });
    }

    nextPage(page) {
        this.setState({page: page, hasMore: false});
        this.callApi(this.state.query, this.state.sets, this.state.costs, this.state.orderBy, this.state.ordering, this.state.colors, this.state.rarities, page, false);
    }

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
                <div className="SearchComponent">

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
                    <div className="search-container">
                        {this.state.loading === false && <Grid className="cards">
                            <Row>
                                <InfiniteScroll
                                    pageStart={1}
                                    loadMore={this.nextPage}
                                    hasMore={this.state.hasMore}
                                    initialLoad={false}
                                    loader={<div className="loader" key={0}>Loading ...</div>}
                                >
                                    {this.state.cards.map(function (card, key) {
                                        return <Col key={key} md={2} sm={4} xs={6}>
                                            <img src={card.image} onClick={() => this.setState({bigCard: true, bigCardImage: card.image})}/>
                                        </Col>;
                                    }, this)}
                                </InfiniteScroll>
                            </Row>
                        </Grid>}
                        {this.state.loading && <div className="loading">
                            <FaSpinner className="spin"/>
                        </div>}
                    </div>
                    {this.state.bigCard === true && <div className="card-background" onClick={() => this.setState({bigCard: false})}>
                        <img src={this.state.bigCardImage}/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Dimensions()(Search);
