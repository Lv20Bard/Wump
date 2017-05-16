import React,{Component} from 'react';

export default class Tweet extends Component{
      constructor(props){
            super(props);

            this.state={
                  
            }
      }
      
      render(){
            return(
                  <div className="tweetWrapper container">
                        <div className="row">
                              <img className="img avatar" src="https://pbs.twimg.com/profile_images/1980294624/DJT_Headshot_V2_bigger.jpg" alt=" "/>
                              <div className=" col-sm-10">      
                                    <div className="tweetHeader col-sm-12">
                                    <p>Donald J. Trump <span className="wumpHandle">@realDonaldTrump</span></p>
                                    </div>
                                    
                                    <div className="tweetBody col-sm-12">
                                          <p> {this.props.data}</p>
                                    </div>
                              </div>

                        </div>
                  </div>
            )
      }
}