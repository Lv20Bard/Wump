import React, { Component } from 'react';
import Header from './components/Header.js'
import './App.css';
import Main from './components/Main';

class App extends Component {
  render() {
    return (
      <div >
        <Header />

        <Main />
      </div>
    );
  }
}

export default App;
