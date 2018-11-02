import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import Dimensions from 'react-dimensions';
import './index.sass';

class Heatmap extends Component {

    render() {
        const {className, max, data, label} = this.props;

        let trueMax = parseFloat(max);

        if (!trueMax) {
            trueMax = 0;
            for (let i = 0; i < data.length; i++) {
                trueMax = data[i].value > trueMax ? data[i].value : trueMax;
            }
        }

        return (
            <div className="Heatmap">
                {data.map(function(section, key) {

                    let colorIndex = Math.floor((section.value / trueMax * 100) / 20);

                    return <div className={"heat hs" + colorIndex} title={section.value + " " + label} style={{
                        left: (section.x) + '%',
                        top: (section.y) + '%',
                        width: "5%",
                        height: "5%"
                    }} key={key}>

                    </div>;
                })}
            </div>
        )
    }
}

export default Dimensions()(Heatmap);
