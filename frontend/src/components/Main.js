import React,{Component} from 'react';
import TweetFeed from './TweetFeed.js'
import TweetGenerator from './TweetGenerator';

export default class Main extends Component{
      render(){
            return(
                  <div className="main container">
                        <div className="row">
                              <div className="col-sm-1"></div>
                              <div className="col-sm-10 mainWrapper">
                                    <TweetGenerator />
                                    <TweetFeed />

                              </div>
                              <div className="col-sm-1"></div>
                        </div>
                  </div>
            )
      }
}