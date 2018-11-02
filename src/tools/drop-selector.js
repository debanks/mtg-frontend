import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import {Grid, Row, Col, Button, DropdownButton, MenuItem, ButtonGroup, Fade} from 'react-bootstrap';
import DocumentMeta from 'react-document-meta';
import ReactDOM from 'react-dom';
import FaSpinner from 'react-icons/fa';
import ApiService from '../services/ApiService';
import NumberFormat from '../services/NumberFormat';
import FaBullseye from 'react-icons/fa';
import FaCircle from 'react-icons/fa';
import LineTo from 'react-lineto';
import './index.sass';

class DropSelector extends Component {

    constructor(props) {
        super(props);

        this.state = {
            maps: [],
            error: false,
            loading: true,
            locations: {},
            threat_level: false,
            loot_level: false,
            named: 0,
            distance: 0.15,
            location: false,
            plane_start_x: 0.0,
            plane_start_y: 0.0,
            plane_end_x: 0.0,
            plane_end_y: 0.0,
            coords: 'plane_start',
            activeMap: {
                name: 'Loading',
                image: '',
                id: 0
            }
        };

        ApiService.performRequest('/api/locations', true, 'GET')
            .then((data) => this.processData(data));

        this.handleInputChange = this.handleInputChange.bind(this);
        this.trackPosition = this.trackPosition.bind(this);
        this.processData = this.processData.bind(this);
        this.selectLocation = this.selectLocation.bind(this);
        this.getMarkerStyle = this.getMarkerStyle.bind(this);
        this.reset = this.reset.bind(this);
        this.update = this.update.bind(this);
    }

    getMarkerStyle(label) {
        if (!this.image) {
            return {top: -15.0, left: -15.0};
        }
        let pos = ReactDOM.findDOMNode(this.image).getBoundingClientRect();
        return {
            left: this.state[label + '_x'] * pos.width - 15.0,
            top: this.state[label + '_y'] * pos.height - 15.0
        }
    }

    reset() {
        this.setState({
            plane_start_x: 0.0,
            plane_start_y: 0.0,
            plane_end_x: 0.0,
            plane_end_y: 0.0,
            location: false,
            coords: 'plane_start'
        });
    }
    
    update(key, value) {
        this.setState({[key]: value});
        
        if (this.state.plane_end_x !== 0.0) {
            setTimeout(this.selectLocation, 200);
        }
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

    trackPosition(e) {
        let pos = ReactDOM.findDOMNode(this.image).getBoundingClientRect();

        let shouldPos = this.state.coords === 'plane_end';

        this.setState({
            [this.state.coords + '_x']: e.nativeEvent.offsetX / pos.width,
            [this.state.coords + '_y']: e.nativeEvent.offsetY / pos.height,
            coords: 'plane_end'
        });

        if (shouldPos) {
            setTimeout(this.selectLocation, 200);
        }
    }

    selectLocation() {

        if (this.state.plane_start_x == this.state.plane_end_x && this.state.plane_start_y == this.state.plane_end_y) {
            return;
        }

        let locations = this.state.locations[this.state.activeMap.id];
        let slope = this.state.plane_start_x == this.state.plane_end_x ? false : (this.state.plane_end_y - this.state.plane_start_y) / (this.state.plane_end_x - this.state.plane_start_x);
        let yInt  = slope === false ? false : this.state.plane_start_y - slope * this.state.plane_start_x;

        let selectable = [];

        for (let i = 0; i < locations.length; i++) {

            if (this.state.loot_level !== false && locations[i].loot_level <= this.state.loot_level) {
                continue;
            }

            if (this.state.threat_level !== false && locations[i].threat_level <= this.state.threat_level) {
                continue;
            }

            if (this.state.named === 1 && this.state.named != locations[i].named) {
                continue;
            }

            let distance = 0.0;
            if (this.state.distance === 1.0) {
                selectable.push(locations[i]);
            } else {
                let midPoint = [(locations[i].box_start_x + locations[i].box_end_x) / 2, (locations[i].box_start_y + locations[i].box_end_y) / 2];
                if (slope === false) {
                    distance = Math.abs(this.state.plane_start_y - midPoint[1]);
                } else if (slope == 0.0) {
                    distance = Math.abs(this.state.plane_start_x - midPoint[0]);
                } else {
                    let a = slope;
                    let b = -1;
                    let c = yInt;

                    distance = Math.abs(a * midPoint[0] + b * midPoint[1] + c) / (Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)));
                }

                if (this.state.distance !== 0.5 && distance < this.state.distance) {
                    selectable.push(locations[i]);
                }

                if (this.state.distance === 0.5 && distance > 0.25) {
                    selectable.push(locations[i]);
                }
            }
        }

        console.log(selectable);

        if (selectable.length > 0) {
            let rand = Math.floor(Math.random() * selectable.length);
            this.setState({location: selectable[rand], error: false});
        } else {
            this.setState({location: false, error: 'Nothing meets the criteria'})
        }
    }

    render() {
        const {className, content, season, features, width} = this.props;

        const meta = {
            title: 'Drop Selector - Bo4 Analytics',
            description: 'Feeling indecisive or lazy? Let us decide where to drop for you in this Bo4 drop randomizer.',
            canonical: 'http://bo4analytics.com/tools/drop-selector',
            meta: {
                charset: 'utf-8',
                name: {
                    keywords: 'bo4,drop,random'
                }
            }
        };

        let levels = {
            false: 'All',
            0: 'Very Low',
            1: 'Low',
            2: 'Average',
            3: 'High',
            4: 'Very High'
        };
        
        let distance = {
            0.15: 'Close By',
            0.3: 'Not Too Far',
            0.5: 'Only Far',
            1: 'All'
        };

        return (
            <DocumentMeta {...meta}>
                <div className="DropSelector" style={this.state.showMatch === true ? {height: '400px', overflow: 'hidden'} : {}}>
                    {this.state.loading === false && <Grid className="current-map">
                        <Row>
                            <Col sm={6}>
                                <div className="options">
                                    <Button className="reset" onClick={() => this.reset()} bsStyle={this.state.plane_end_x === 0.0 ? 'default' : 'danger'}>Reset</Button>
                                    <Grid>
                                        <Row>
                                            <Col xs={6}>Distance</Col>
                                            <Col xs={6}>
                                                <DropdownButton title={distance[this.state.distance]}>
                                                    <MenuItem onClick={() => this.update('distance', 0.15)}>Close By</MenuItem>
                                                    <MenuItem onClick={() => this.update('distance', 0.3)}>Not Too Far</MenuItem>
                                                    <MenuItem onClick={() => this.update('distance', 0.5)}>Only Far</MenuItem>
                                                    <MenuItem onClick={() => this.update('distance', 1.0)}>All</MenuItem>
                                                </DropdownButton>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col xs={6}>Threat Level</Col>
                                            <Col xs={6}>
                                                <DropdownButton title={levels[this.state.threat_level]}>
                                                    <MenuItem onClick={() => this.update('threat_level', false)}>All</MenuItem>
                                                    <MenuItem onClick={() => this.update('threat_level', 0)}>Very Low</MenuItem>
                                                    <MenuItem onClick={() => this.update('threat_level', 1)}>Low</MenuItem>
                                                    <MenuItem onClick={() => this.update('threat_level', 2)}>Average</MenuItem>
                                                    <MenuItem onClick={() => this.update('threat_level', 3)}>High</MenuItem>
                                                    <MenuItem onClick={() => this.update('threat_level', 4)}>Very High</MenuItem>
                                                </DropdownButton>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col xs={6}>Loot Level</Col>
                                            <Col xs={6}>
                                                <DropdownButton title={levels[this.state.loot_level]}>
                                                    <MenuItem onClick={() => this.update('loot_level', false)}>All</MenuItem>
                                                    <MenuItem onClick={() => this.update('loot_level', 0)}>Very Low</MenuItem>
                                                    <MenuItem onClick={() => this.update('loot_level', 1)}>Low</MenuItem>
                                                    <MenuItem onClick={() => this.update('loot_level', 2)}>Average</MenuItem>
                                                    <MenuItem onClick={() => this.update('loot_level', 3)}>High</MenuItem>
                                                    <MenuItem onClick={() => this.update('loot_level', 4)}>Very High</MenuItem>
                                                </DropdownButton>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col xs={6}>Only Named Locations</Col>
                                            <Col xs={6}>
                                                <DropdownButton title={this.state.named === 0 ? 'No' : 'Yes'}>
                                                    <MenuItem onClick={() => this.update('named', 0)}>No</MenuItem>
                                                    <MenuItem onClick={() => this.update('named', 1)}>Yes</MenuItem>
                                                </DropdownButton>
                                            </Col>
                                        </Row>
                                    </Grid>
                                    {this.state.location !== false && <div className="select-text">Go to {this.state.location.name}</div>}
                                    {this.state.errpr !== false && <div classname="error-text">{this.state.error}</div>}
                                </div>
                            </Col>
                            <Col sm={6}>
                                <div className="map-box" ref={image => this.image = image} >
                                    <img src={"/images/maps/" + this.state.activeMap.image}/>
                                    {this.state.location !== false && <div className={"location"} style={{
                                        top: (this.state.location.box_start_y * 100) + '%',
                                        left: (this.state.location.box_start_x * 100) + '%',
                                        width: ((this.state.location.box_end_x - this.state.location.box_start_x) * 100) + '%',
                                        height: ((this.state.location.box_end_y - this.state.location.box_start_y) * 100) + '%'
                                    }}></div>}
                                    {this.state.location !== false && <div className="top-line" style={{
                                        top: 0,
                                        height: (this.state.location.box_start_y * 100) + '%',
                                        left: (((this.state.location.box_end_x + this.state.location.box_start_x)/ 2) * 100) + '%'
                                    }}></div>}
                                    {this.state.location !== false && <div className="bottom-line" style={{
                                        top: (this.state.location.box_end_y * 100) + '%',
                                        height: ((1 - this.state.location.box_end_y) * 100) + '%',
                                        left: (((this.state.location.box_end_x + this.state.location.box_start_x)/ 2) * 100) + '%'
                                    }}></div>}
                                    {this.state.location !== false && <div className="left-line" style={{
                                        left: 0,
                                        width: (this.state.location.box_start_x * 100) + '%',
                                        top: (((this.state.location.box_end_y + this.state.location.box_start_y)/ 2) * 100) + '%'
                                    }}></div>}
                                    {this.state.location !== false && <div className="right-line" style={{
                                        left: (this.state.location.box_end_x * 100) + '%',
                                        width: ((1 - this.state.location.box_end_x) * 100) + '%',
                                        top: (((this.state.location.box_end_y + this.state.location.box_start_y)/ 2) * 100) + '%'
                                    }}></div>}
                                    <div className="plane_start marker" style={this.getMarkerStyle('plane_start')}><FaCircle/></div>
                                    <div className="plane_end marker" style={this.getMarkerStyle('plane_end')}><FaBullseye/></div>
                                    <LineTo from="plane_start" to="plane_end" zIndex={500} within="map-box" borderColor="#fff" borderWidth={3}/>
                                    <div className="click-space" onClick={this.trackPosition}></div>
                                </div>
                            </Col>
                        </Row>
                    </Grid>}
                    {this.state.loading && <div className="loading">
                        <FaSpinner className="spin"/>
                    </div>}
                </div>
            </DocumentMeta>
        )
    }
}

export default DropSelector;
