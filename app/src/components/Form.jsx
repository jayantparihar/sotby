import React, { useEffect, useState } from "react";
import Select from 'react-select';

const END_POINT_ROOT = "http://localhost:8000/"
const COURSE_RESOURCE = "courses"

const parseData = (data) => {
  if (!data) {
    return null;
  }
  const parsedData = JSON.parse(data);
  console.log(parsedData);

  let courseArray = [];
  for (let i = 0; i < parsedData.length; i++) {
    const course = { value: parsedData[i].course_num, label: parsedData[i].title };

    courseArray.push(course);
  }
  return courseArray;
}

const getCourses = (callBack) => {
  fetch(END_POINT_ROOT + COURSE_RESOURCE)
    .then(response => {
      return response.text();
    })
    .then(data => {
      callBack(parseData(data));
    });
}

export default function Form({ title, textObject, callBack, isCourse = false }) {
  const [input, setInput] = useState({}); // '' is the initial state value
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoaded, setLoaded] = useState(false);
  const [courseArray, setCourseArray] = useState([]);

  useEffect(() => {
    if (isCourse) {
      getCourses((data) => {
        setCourseArray(data);
        setLoaded(true);
      })
    } else {
      setLoaded(true);
    }
  }, [])

  const renderForm = () => {
    return (
      <div key={title + " div"} style={{ display: "inline", position: "sticky" }}>
        {
          isCourse ?
            <React.Fragment>
              <label name={"Course"} key={"course label"}>Course</label>
              <Select
                defaultValue={selectedOption}
                onChange={setSelectedOption}
                options={courseArray}
              />
            </React.Fragment>
            :
            undefined
        }
        {textObject.map((item, i) => {
          return (
            <React.Fragment key={item + " container"}>
              <label name={item + " label"} key={item + " label"}>{item}</label>
              <input name={item + " input"} key={item + " input"} onInput={e => setInput({ ...input, [item.split(" ").join("").toLowerCase()]: e.target.value })} />
              <br />
            </React.Fragment>
          )
        })}
        {
          isCourse ?
            <button name={title + " button"} key={title + " button"} onClick={() => callBack({ number: selectedOption.value, title: selectedOption.label, ...input, datejoined: new Date().getTime() })}>Submit</button>
            :
            <button name={title + " button"} key={title + " button"} onClick={() => callBack({ ...input, datejoined: new Date().getTime() })}>Submit</button>
        }

      </div>
    );
  }

  return (
    <React.Fragment>
      {isLoaded ?
        renderForm()
        :
        <p>Loading</p>
      }
    </React.Fragment>
  );
}