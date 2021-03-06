import React,{Component} from 'react';
import Tweet from './Tweet';

export default class TweetFeed extends Component {
      static propTypes = {
            wumps: React.PropTypes.array.isRequired
      };

      constructor(props){
            super(props);
      }

      render(){
            return(
                  <div className="feedSectionWrapper col-sm-12">
                        <ol className="feedSectionInner col-sm-12">
                              {this.props.wumps.map((wump, i) => {
                                    return(
                                          <li className="feedItem" key={wump._id}>
                                                <Tweet data={wump.tweet}/>
                                          </li>
                                    );
                              })}
                        </ol>
                        
                  </div>

            )
      }
}