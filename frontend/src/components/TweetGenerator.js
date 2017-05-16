import React,{Component} from 'react';

export default class TweetGenerator extends Component{
      render(){
            return(
                  <div className="generatorWrapper">
                        <div className="innerGenerator">
                              <img className="avatarImage" src="https://pbs.twimg.com/profile_images/1980294624/DJT_Headshot_V2_400x400.jpg" alt=" " />
                              <form className="wumpForm" >
                                    <input type="text" className="wumpContent" placeholder="insert wikipedia url here"></input>
                              </form>
                              <button className="wumpBtn"><i className="glyphicon glyphicon-pencil"></i>  Wump</button>
                        </div>
                  </div>
            )
      }
}