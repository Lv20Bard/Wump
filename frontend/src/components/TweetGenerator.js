import React,{Component} from 'react';
import axios from 'axios';

export default class TweetGenerator extends Component{
      static propTypes = {
            onWumpPosted: React.PropTypes.func.isRequired
      };

      constructor(props){
            super(props);

            this.state = {
                  url:""
            }

            this.handleURLChange = this.handleURLChange.bind(this);
            this.handleSubmit = this.handleSubmit.bind(this);

      }

      handleSubmit(event){
            event.preventDefault();
            if(this.state.url !== ""){
                  axios.get(`http://localhost:9001/search/${this.state.url}`)
                  .then((res) => {
                        this.props.onWumpPosted(res.data.tweets[0]);
                  })
                  .catch((err) => {
                        console.error(err);
                  });
            }
            this.setState({url:""});

            
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
                                    <input type="text" className="wumpContent" placeholder="insert the title of a wikipedia article" value={this.state.url} onChange={this.handleURLChange}></input>
                                    <input type="submit" value="Wump" className="wumpBtn"></input>
                              </form>
                              
                        </div>
                  </div>
            )
      }
}

// var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
//     '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
//     '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
//     '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
//     '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
//     '(\#[-a-z\d_]*)?$','i'); // fragment locater
//   if(!pattern.test(str)) {
//     alert("Please enter a valid URL.");
//     return false;
//   } else {
//     return true;
//   }