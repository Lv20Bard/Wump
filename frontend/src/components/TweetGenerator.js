import React,{Component} from 'react';
import axios from 'axios';

export default class TweetGenerator extends Component{
      constructor(props){
            super(props);


            

            this.state = {
                  url:""
            }

            this.handleURLChange = this.handleURLChange.bind(this);
            this.handleSubmit = this.handleSubmit.bind(this);

      }

      handleSubmit(){
            // Axios Call For adding to database
            console.log(this.state.url);
      }

      handleURLChange(e){

            this.setState({url: e.target.value})

      }
      
      
      render(){
            return(
                  <div className="generatorWrapper">
                        <div className="innerGenerator">
                              <img className="avatarImage" src="https://pbs.twimg.com/profile_images/1980294624/DJT_Headshot_V2_400x400.jpg" alt=" " />
                              <form className="wumpForm" onSubmit={this.handleSubmit} >
                                    <input type="text" className="wumpContent" placeholder="insert wikipedia url here" value={this.state.url} onChange={this.handleURLChange}></input>
                                    <input type="submit" value="Wump" className="wumpBtn"></input>
                              </form>
                              
                        </div>
                  </div>
            )
      }
}