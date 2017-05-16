import React,{Component} from 'react';
import axios from 'axios';

import TweetFeed from './TweetFeed.js'
import TweetGenerator from './TweetGenerator';

export default class Main extends Component{

      constructor(props) {
            super(props);
            this.state = {
                  wumps: []
            };
      }

      handleWumpPosted = (wump) => {
            this.setState({
                  wumps: [wump].concat(this.state.wumps)
            });
      };

      // Get all the wumps
      componentDidMount(){
            axios.get('http://localhost:9001/saved')
            .then((res) => {
                  console.log(res.data.tweets);
                  this.setState({wumps:res.data.tweets});
            })
            .catch(function(err){
                  if(err){
                        console.log(err);
                  }
            });
      }

      render(){
            return(
                  <div className="main container">
                        <div className="row">
                              <div className="col-sm-1"></div>
                              <div className="col-sm-10 mainWrapper">
                                    <TweetGenerator
                                          onWumpPosted={this.handleWumpPosted}
                                    />
                                    <TweetFeed
                                          wumps={this.state.wumps}
                                    />

                              </div>
                              <div className="col-sm-1"></div>
                        </div>
                  </div>
            )
      }
}