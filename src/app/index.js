import React, {Component} from 'react';
import Header from '../header';
import Footer from '../footer/Footer';

class App extends Component {

    render() {
        return (
            <div>
                <main className="main-component">
                    { this.props.children }
                </main>
                <Footer/>
                <Header  location={this.props.location.pathname}/>
            </div>
        );
    }
}

export default App;