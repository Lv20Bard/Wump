import React,{Component} from 'react';
import Tweet from './Tweet';
import axios from 'axios';

export default class TweetFeed extends Component {
      static propTypes = {
            wumps: React.PropTypes.array.isRequired
      };

      constructor(props){
            super(props);
      }


      render(){
            // Make collection of Wumps
            var allWumps=this.props.wumps.map(function(allTheWumps, i){
                  return(
                        <li className="feedItem">
                              <Tweet data={allTheWumps} key={i}/>
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