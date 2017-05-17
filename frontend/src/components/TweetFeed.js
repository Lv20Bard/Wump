import React,{Component} from 'react';
import Tweet from './Tweet';
import VisibilitySensor from 'react-visibility-sensor'

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
                                          <li className="feedItem" key={wump.id}>
                                                <Tweet data={wump.tweet}/>
                                          </li>
                                    );
                              })}
                        </ol>
                        {/*<VisibilitySensor onChange={onChange} />*/}
                  </div>
                
            )
      }
}