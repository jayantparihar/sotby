import React from 'react';
import { EditText, EditTextarea } from 'react-edit-text';
import 'react-edit-text/dist/index.css';
import './index.css';
import _ from "lodash";
import { Link, useSearchParams } from 'react-router-dom';
import { ReactSession } from 'react-client-session';
import Header from "./components/Header";

const END_POINT_ROOT = "http://localhost:8000/";

class Day extends React.Component {

  constructor({ props, info, socket }) {
    super(props);
    this.state = {
      description: info.description,
      model_num: info.model_num,
      model_name: info.model_name,
      quantity: info.quantity
    }
    this.ca_id = info.ca_id;
    this.course = info.course;
    this.date = info.date;
    this.ds_id = info.ds_id;
    this.subject = info.subject;
    this.instructor = info.username;
    this.socket = socket;
  }

  handleSave = ({ name, value, previousValue }) => {
    this.setState({ description: value }, () => {
      this.socket.emit("changeDay", {
        ca_id: this.ca_id,
        course: this.course,
        date: this.date.getTime(),
        description: this.state.description,
        ds_id: this.ds_id,
        model_name: this.state.model_name,
        model_num: this.state.model_num,
        quantity: this.state.quantity,
        subject: this.subject,
        username: this.instructor
      });
    });
  };

  render() {
    const descEditSave = this.state.editMode ? "Save" : "Edit";

    let resources = null;
    if (this.state.model_num) {
      resources = this.state.model_num.map((m_num, index) => {
        return (
          <li key={m_num}>
            {`${this.state.model_name[index]} - ${this.state.quantity[index]}`}
          </li>
        )
      });
    }

    return (
      <tr>
        <td>
          <EditText
            name="date"
            defaultValue={getStringDate(this.date)}
            readonly
          />
        </td>
        <td>
          <EditText
            name="instructor"
            defaultValue={this.instructor ? this.instructor : "No instructor assigned"}
            readonly
          />
        </td>
        <td class='course-desc'>
          <EditTextarea
            name="description"
            defaultValue={!this.state.description || this.state.description == "null" ? "" : this.state.description}
            onSave={this.handleSave}
            rows={2}
          />
        </td>
        <td>
          <ul>
            {resources}
            {this.instructor ? (
              <li>
                <Link
                  className='li-link-to-res'
                  to={{
                    pathname: "/resources",
                    search: `?ds_id=${this.ds_id}&date=${this.date}`,
                  }}
                >Book</Link>
              </li>)
              : null}
          </ul>
        </td>
      </tr>
    );
  }
}

class Week extends React.Component {

  constructor({ props, info, socket }) {

    super(props);
    this.state = {
      days: info,
    }
    this.socket = socket;

    this.socket.on('changeDay', (rowInfo) => {

      rowInfo.date = new Date(rowInfo.date);

      let index;

      for (let i = 0; i < this.state.days.length; i++) {
        if (this.state.days[i].ds_id == rowInfo.ds_id) {
          index = i;
          break;
        }
      }

      let copyDays = this.state.days.slice();
      copyDays[index] = rowInfo;
      console.log(rowInfo);

      this.setState({
        days: _.reduce(copyDays, (acc, day) => {
          const dayData = day;
          return [...acc, dayData];
        }, [])
      });

    })
  }

  renderDay(dayInfo) {
    return (
      <Day key={dayInfo.ds_id + dayInfo.username + dayInfo.description}
        info={dayInfo}
        socket={this.socket}
      />
    );
  }

  render() {
    const days = this.state.days.map((day, index) => {
      return (
        this.renderDay(day)
      );
    });
    return (
      <table key={this.state.days[0].ds_id}>
        <caption>Schedule for week of {getStringDate(this.state.days[0].date)}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Instructor</th>
            <th>Description</th>
            <th>Resources</th>
          </tr>
        </thead>
        <tbody>
          {days}
        </tbody>
      </table>
    );
  }
}

class Course extends React.Component {


  constructor({ props, socket, courseNum }) {
    super(props);
    this.socket = socket;
    this.state = {
      data: null,
      dataLoaded: false,
    }
    this.courseNum = courseNum;
  }

  renderWeek(weekInfo) {
    return (
      <Week key={weekInfo[0].ds_id}
        info={weekInfo}
        socket={this.socket}
      />
    );

  }

  renderCourse() {
    let weeksData = new Array();
    const chunk = 7; // # days in a week.
    for (let i = 0, j = this.state.data.length; i < j; i += chunk) {
      weeksData.push(this.state.data.slice(i, i + chunk));
    }
    const weeks = weeksData.map((week, index) => {
      return (
        this.renderWeek(week)
      );
    });
    return (
      <div>
        <Header />
        <h2>{`${this.state.data[0].subject} - ${this.state.data[0].course}`}</h2><br />
        {weeks}
      </div>
    );
  }

  parseData = (data) => {
    if (!data) {
      return null;
    }

    const parsedData = JSON.parse(data);

    for (let i = 0; i < parsedData.rows.length; i++) {
      parsedData.rows[i].date = new Date(parsedData.rows[i].date); // Changing date from string-date to date object.
    }

    let formattedData = [];
    let formattedData_len = 0;
    let prev_ds_id = null;
    for (let i = 0; i < parsedData.rows.length; i++) {  // Merge same days together. Add resources info to a list instead.
      if (parsedData.rows[i].model_name) {
        if (prev_ds_id == parsedData.rows[i].ds_id) {
          formattedData[formattedData_len - 1].model_name.push(parsedData.rows[i].model_name);
          formattedData[formattedData_len - 1].model_num.push(parsedData.rows[i].model_num);
          formattedData[formattedData_len - 1].quantity.push(parsedData.rows[i].quantity);
        } else {
          formattedData_len = formattedData.push({
            ca_id: parsedData.rows[i].ca_id,
            course: parsedData.rows[i].course,
            date: parsedData.rows[i].date,
            description: parsedData.rows[i].description,
            ds_id: parsedData.rows[i].ds_id,
            model_name: [parsedData.rows[i].model_name],  // put in a list - to be able to add to it later if needed.
            model_num: [parsedData.rows[i].model_num],    // put in a list - to be able to add to it later if needed.
            quantity: [parsedData.rows[i].quantity],      // put in a list - to be able to add to it later if needed.
            subject: parsedData.rows[i].subject,
            username: parsedData.rows[i].username
          });
        }
      }
      else {
        formattedData_len = formattedData.push(parsedData.rows[i]);
      }
      prev_ds_id = parsedData.rows[i].ds_id;
    }

    console.log(formattedData);

    this.setState({ data: formattedData });
    this.setState({ dataLoaded: true });
  }

  retrieveDailyScheduleDataFromDatabase = (courseNum) => {
    fetch(END_POINT_ROOT + `detailedSchedule?courseNum=${courseNum}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        return response.text();
      })
      .then(data => {
        this.parseData(data)
      });
  }

  componentDidMount() {
    this.retrieveDailyScheduleDataFromDatabase(this.courseNum);
  }

  render() {

    return (
      ReactSession.get("admin") >= 0 ? (
        this.state.dataLoaded ? this.renderCourse() :
          <span>Loading data...</span>
      ) :
        window.location.href = "/"
    );
  }

}

const DetailedSchedule = (socket) => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <Course socket={socket.socket} courseNum={searchParams.get("courseNum")}></Course>
  );
}

export default DetailedSchedule;

function getStringDate(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (months[date.getMonth()] + " " + date.getDate());
}
