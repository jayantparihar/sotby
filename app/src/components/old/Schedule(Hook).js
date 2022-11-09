import React, { useState, useEffect } from "react";
import "./style.css";
import './gridstyles.css';
import "./timeline.css";
import Timeline from '../Timeline';
import {useParams} from "react-router-dom";
//const socket = io.connect('/');

const END_POINT_ROOT = "http://localhost:8000/";
const INSTRUCTORS_RESOURCE = "users";

export default function App({socket}) {
  const [instructors, setInstructors] = useState([]);
  const [heightLimit, adjustHeightLimit] = useState(8);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const params = useParams();

  let yearParam = 2022;
  if(params.year !== undefined) {
    if(params.year.length === 4) {
      const intYear = parseInt(params.year);

      if(!isNaN(intYear)) {
        yearParam = intYear;
      }
    }
  }

  const [year, setYear] = useState(yearParam);

  const getHeightLimit = () => {
    return heightLimit;
  }

  const setHeightLimit = (heightLimit) => {
    adjustHeightLimit(heightLimit);
  }

  const parseData = (data) => {
    if(!data) {
      return null;
    }
    const parsedData = JSON.parse(data);
    
    let instructorArray = {};
    for(let i = 0; i < parsedData.length; i++) {
        const key = parsedData[i].username;

        let instructor;
        // Check if instructor is already in the object
        if(instructorArray[key]) {
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
        if(parsedData[i].start_date != null && parsedData[i].end_date != null) {
          const startDate = new Date(parsedData[i].start_date);

          // Note, this is inefficient as the query in the backend retrieves data from all years.
          // This should be adjusted so that the query limits data selecting for a particular year.
          if(startDate.getFullYear() == year) {
            instructor.timeblocks.push({
              start: new Date(parsedData[i].start_date), 
              end: new Date(parsedData[i].end_date), 
              name: parsedData[i].title + " " + parsedData[i].course_num, 
              courseNum: parsedData[i].course_num,
              userId: parsedData[i].username}); 
          }
        }

        // Check if there are any valid vacations associated with the instructor
        if(parsedData[i].vacation_start != null && parsedData[i].vacation_end != null && parsedData[i].approved === 1) {
          const startDate = new Date(parsedData[i].vacation_start);

          // Note, this is inefficient as the query in the backend retrieves data from all years.
          // This should be adjusted so that the query limits data selecting for a particular year.
          if(startDate.getFullYear() == year) {
            instructor.vacations.push({
              vacationId: parsedData[i].vacation_id,
              userId: parsedData[i].username,
              vacationStart: new Date(parsedData[i].vacation_start),
              vacationEnd: new Date(parsedData[i].vacation_end),
            });
          }
        }
    }
    instructorArray = Object.values(instructorArray);

    setInstructors( instructorArray);
    setHeightLimit((instructorArray.length + 1) * 2);
    setLoaded(true);
  }

  const retrieveInstructorDataFromDatabase = () => {
      fetch(END_POINT_ROOT + INSTRUCTORS_RESOURCE + "/" + year)
      .then(response => {
          return response.text();
      })
      .then(data => {
          parseData(data)
      });
  }

  useEffect(() => {
    socket.emit("join", year);

    socket.on("joined", () => {
      retrieveInstructorDataFromDatabase();
    });
    
    socket.on('error', (err) => {
      console.log(err);
      setError(err);
    });
  }, []);

  const removeElement = (el) => {
    console.log(el);
  }

  const renderApp = () => {
    return (
      <div className="App">
          {(error !== "") ?
            <div className="error-modal">
              <h1>Error:</h1>
              <p>{error}</p>
              <button style={{position:"absolute", top:0, right:0}} onClick={() => {setError("")}}>
                <p>X</p>
              </button>
            </div>
            :
            undefined
          }

          <Timeline socket={socket} heightLimit={{get: () => getHeightLimit(), set: (limit) => setHeightLimit(limit)}}
          instructorArray={instructors} year={year}/>
      </div>
    );
  }

  return(
      // Remove this later on and add a real feedback message, this is just for development purposes
      loaded ? 
        renderApp() 
        :
        <span>Loading data...</span>
    );
}