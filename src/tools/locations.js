import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, DropdownButton, MenuItem, ButtonGroup, Fade} from 'react-bootstrap';
import DocumentMeta from 'react-document-meta';
import ReactDOM from 'react-dom';
import FaSpinner from 'react-icons/fa';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';
import './index.sass';

class Locations extends Component {

    constructor(props) {
        super(props);

        this.state = {
            maps: [],
            loading: true,
            locations: {},
            showMap: false,
            form: false,
            coords: 'box_start',
            activeMap: {
                name: 'Loading',
                image: '',
                id: 0
            },
            location: {
                name: "",
                map_id: 0,
                named: 1,
                loot_level: 0,
                threat_level: 0,
                box_start_x: 0.0,
                box_start_y: 0.0,
                box_end_x: 0.0,
                box_enx_y: 0.0
            }
        };

        ApiService.performRequest('/api/locations', true, 'GET')
            .then((data) => this.processData(data));

        this.handleInputChange = this.handleInputChange.bind(this);
        this.submit = this.submit.bind(this);
        this.trackPosition = this.trackPosition.bind(this);
        this.processData = this.processData.bind(this);
        this.addLocation = this.addLocation.bind(this);
        this.updateLocation = this.updateLocation.bind(this);
    }

    processData(data) {

        let activeMap = {
            name: 'Loading',
            image: ''
        };

        for (let i = 0; i < data.maps.length; i++) {
            if (data.maps[i].active === 1) {
                activeMap = data.maps[i];
            }
        }

        this.setState({
            maps: data.maps,
            activeMap: activeMap,
            locations: data.locations,
            loading: false
        });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let state = this.state;
        state.location[name] = value;

        this.setState(state);
    }

    updateLocation(field, value) {

        let state = this.state;
        state.location[field] = value;

        this.setState(state);
    }

    trackPosition(e) {
        let location = this.state.location;
        let pos = ReactDOM.findDOMNode(this.image).getBoundingClientRect();
        location[this.state.coords + '_x'] = e.nativeEvent.offsetX / pos.width;
        location[this.state.coords + '_y'] = e.nativeEvent.offsetY / pos.height;

        let next = 'box_end';

        this.setState({location: location, coords: next});
    }

    addLocation() {
        this.setState({
            location: {
                name: "",
                map_id: this.state.activeMap.id,
                named: 1,
                loot_level: 0,
                threat_level: 0,
                box_start_x: 0.0,
                box_start_y: 0.0,
                box_end_x: 0.0,
                box_enx_y: 0.0
            },
            form: true,
            coords: 'box_start'
        })
    }

    submit(event) {
        event.preventDefault();
        ApiService.performRequest('/api/location', true, 'POST', this.state.location)
            .then((data) => {
                let locations = this.state.locations;
                if (!locations[this.state.activeMap.id]) {
                    locations[this.state.activeMap.id] = [];
                }
                locations[this.state.activeMap.id].push(data.location);
                this.setState({locations: locations, form: false});
            });
    }

    render() {
        const {className, content, season, features, width} = this.props;

        const meta = {
            title: 'Locations - Bo4 Analytics',
            description: 'Plot locations on the bo4 map',
            canonical: 'http://bo4analytics.com/tools/locations',
            meta: {
                charset: 'utf-8',
                name: {
                    keywords: 'bo4,map,locations'
                }
            }
        };

        let levels = {
            0: 'Very Low',
            1: 'Low',
            2: 'Average',
            3: 'High',
            4: 'Very High'
        };

        return (
            <DocumentMeta {...meta}>
                <div className="Locations" style={this.state.showMatch === true ? {height: '400px', overflow: 'hidden'} : {}}>
                    {this.state.loading === false && <div className="current-map">
                        <div className="options">
                            <Button onClick={() => this.addLocation()}>Add Location</Button>
                        </div>
                        <div className="map-box">
                            <img src={"/images/maps/" + this.state.activeMap.image}/>
                            {this.state.locations[this.state.activeMap.id].map(function (location, key) {
                                return <div className={"location"} style={{
                                    top: (location.box_start_y * 100) + '%',
                                    left: (location.box_start_x * 100) + '%',
                                    width: ((location.box_end_x - location.box_start_x) * 100) + '%',
                                    height: ((location.box_end_y - location.box_start_y) * 100) + '%'
                                }}></div>
                            }, this)}
                        </div>
                    </div>}
                    {this.state.form && <div className="match-form" onClick={() => this.setState({form: false})}>
                        <form onSubmit={this.submit} onClick={(e) => e.stopPropagation()}>
                            <Grid>
                                <Row>
                                    <Col sm={4}>
                                        <label htmlFor="name">Name</label>
                                        <input name="name" onChange={this.handleInputChange} value={this.state.location.name}/>
                                    </Col>
                                    <Col sm={3}>
                                        <label htmlFor="type">Loot Level</label>
                                        <DropdownButton title={levels[this.state.location.loot_level]}>
                                            <MenuItem onClick={() => this.updateLocation('loot_level', 0)}>Very Low</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('loot_level', 1)}>Low</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('loot_level', 2)}>Average</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('loot_level', 3)}>High</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('loot_level', 4)}>Very High</MenuItem>
                                        </DropdownButton>
                                    </Col>
                                    <Col sm={3}>
                                        <label htmlFor="type">Threat Level</label>
                                        <DropdownButton title={levels[this.state.location.threat_level]}>
                                            <MenuItem onClick={() => this.updateLocation('threat_level', 0)}>Very Low</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('threat_level', 1)}>Low</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('threat_level', 2)}>Average</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('threat_level', 3)}>High</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('threat_level', 4)}>Very High</MenuItem>
                                        </DropdownButton>
                                    </Col>
                                    <Col sm={2}>
                                        <label htmlFor="named">Named</label>
                                        <DropdownButton title={this.state.location.named === 1 ? 'Yes' : 'No'}>
                                            <MenuItem onClick={() => this.updateLocation('named', 1)}>Yes</MenuItem>
                                            <MenuItem onClick={() => this.updateLocation('named', 0)}>No</MenuItem>
                                        </DropdownButton>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={12}>
                                        <div className="coords">
                                            <ButtonGroup>
                                                <Button onClick={() => this.setState({coords: 'box_start'})} bsStyle={this.state.coords === 'box_start' ? 'primary' : 'default'}>Box
                                                    Start</Button>
                                                <Button onClick={() => this.setState({coords: 'box_end'})} bsStyle={this.state.coords === 'box_end' ? 'primary' : 'default'}>Box End</Button>
                                            </ButtonGroup>
                                        </div>
                                        <div ref={image => this.image = image} className="image-coords">
                                            <img src={"/images/maps/" + this.state.activeMap.image}/>
                                            <div className="location" style={{
                                                top: (this.state.location.box_start_y * 100) + '%',
                                                left: (this.state.location.box_start_x * 100) + '%',
                                                width: ((this.state.location.box_end_x - this.state.location.box_start_x) * 100) + '%',
                                                height: ((this.state.location.box_end_y - this.state.location.box_start_y) * 100) + '%'
                                            }}></div>
                                            <div className="click-space" onClick={this.trackPosition}></div>
                                        </div>
                                    </Col>
                                </Row>
                            </Grid>
                            <Button onClick={this.submit} bsStyle="success" className="form-btn">SUBMIT</Button>
                        </form>
                    </div>}
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default Locations;
