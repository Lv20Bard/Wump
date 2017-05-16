import React,{Component} from 'react';
import Tweet from './Tweet';
import axios from 'axios';

export default class TweetFeed extends Component {
      constructor(props){
            super(props);

            this.state = {
                  wumps:[]
            }
      }

      // Get all the wumps
      componentDidMount(){

      }


      render(){

            // Make collection of Wumps
            var allWumps=this.state.wumps.map(function(allTheWumps){
                  return(
                        <li className="feedItem">
                              <Tweet data={allTheWumps} key={allTheWumps._id}/>
                        </li>
                  );
            });
            
            return(
                  <div className="feedSectionWrapper col-sm-12">
                        <ol className="feedSectionInner col-sm-12">
                              {allWumps}
                        </ol>
                  </div>
            )
      }
}