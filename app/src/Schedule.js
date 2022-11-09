import React from "react";
import "./style.css";
import './gridstyles.css';
import "./timeline.css";
import Timeline from './components/Timeline';

const END_POINT_ROOT = "20.242.114.218:8000/";
const INSTRUCTORS_RESOURCE = "users";

export default class App extends React.Component {
  state = {
    instructors: [],
    heightLimit: 8,
    loaded: false,
    error: ""
  };

  constructor({ socket }) {
    super();
    this.socket = socket;
  }

  getHeightLimit() {
    return this.state.heightLimit;
  }

  setHeightLimit(heightLimit) {
    this.setState({ heightLimit: heightLimit });
    console.log("HeightLimit: " + this.state.heightLimit);
  }

  parseData = (data) => {
    if (!data) {
      return null;
    }
    const parsedData = JSON.parse(data);

    let instructorArray = {};
    for (let i = 0; i < parsedData.length; i++) {
      const key = parsedData[i].username;

      let instructor;
      // Check if instructor is already in the object
      if (instructorArray[key]) {
        instructor = instructorArray[key];
      } else {
        instructor = {};
        instructor.timeblocks = [];
        instructor.vacations = [];
        instructor.name = parsedData[i].first_name + " " + parsedData[i].last_name;
        instructor.key = key;
        instructorArray[key] = instructor;
      }
      // Check if there are any valid courses associated with the instructor
      if (parsedData[i].start_date != null && parsedData[i].end_date != null) {
        instructor.timeblocks.push({
          start: new Date(parsedData[i].start_date),
          end: new Date(parsedData[i].end_date),
          name: parsedData[i].title,
          courseNum: parsedData[i].course_num,
          caId: parsedData[i].ca_id,
          userId: parsedData[i].username
        });
        
      }

      // Check if there are any valid vacations associated with the instructor
      if (parsedData[i].vacation_start != null && parsedData[i].vacation_end != null && parsedData[i].approved === 1) {
        instructor.vacations.push({
          vacationId: parsedData[i].vacation_id,
          userId: parsedData[i].username,
          vacationStart: new Date(parsedData[i].vacation_start),
          vacationEnd: new Date(parsedData[i].vacation_end),
        });
      }
    }
    instructorArray = Object.values(instructorArray);
    console.log(instructorArray);

    this.setState({ instructors: instructorArray, heightLimit: (instructorArray.length + 1) * 2 })
    this.setState({ loaded: true })
  }

  retrieveInstructorDataFromDatabase = () => {
    fetch(END_POINT_ROOT + INSTRUCTORS_RESOURCE)
      .then(response => {
        return response.text();
      })
      .then(data => {
        this.parseData(data)
      })
      .catch((error) => {
        console.error('Error:', error);
        console.log(error)   
      });
  }

  componentDidMount() {
    this.retrieveInstructorDataFromDatabase();
  }

  removeElement(el) {
    console.log(el);
  }

  renderApp() {

    return (
      <div className="App">
        {(this.state.error !== "") ?
          <div className="error-modal" key={"errorModal"}>
            <h1>Error:</h1>
            <p>{this.state.error}</p>
            <button style={{ position: "absolute", top: 0, right: 0 }} onClick={() => { this.setState({ error: "" }) }}>
              <p>X</p>
            </button>
          </div>
          :
          undefined
        }

        <Timeline socket={this.socket} heightLimit={{ get: () => this.getHeightLimit(), set: (limit) => this.setHeightLimit(limit) }}
          instructorArray={this.state.instructors} />
      </div>
    );
  }

  render() {
    // Remove this later on and add a real feedback message, this is just for development purposes
    this.socket.on('error', (err) => {
      console.log(err);
      if (typeof (err) === String) {
        this.setState({ error: err });
      } else {
        if (err.detail === undefined) {
          this.setState({ error: "ERROR Code: " + err.code });
        } else {
          this.setState({ error: err.detail });
        }
      }
    });

    return (
      this.state.loaded ?
        this.renderApp()
        :
        <span>Loading data...</span>
    );
  }
}