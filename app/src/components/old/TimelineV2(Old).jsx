import React, { useEffect } from "react";
import Month from './Month';
import _ from "lodash";
import RowHeader from './RowHeader';
import Form from "./Form";
import Popup from "reactjs-popup";
import { useState } from "react";
// import { DndProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
// import CourseElement from "./CourseElement";
import NoCollisionLayout from './NoCollisionLayout';
// import DragFromOutsideLayout from "./DragFromOutside";

export default function Timeline({socket, heightLimit, instructorArray}) {

    let dateOffset = new Date(new Date().getFullYear(), 0, 1);

    const weekInformation = {weekNum: 0, weekRangesArray: [], indexMap: {}};
    const initialMonthArray = Array.from(Array(12).keys()).map((item, i) => {
        return({
            monthIndex: i,
            weeks: getWeeks(dateOffset, i, weekInformation),
        });
    });
    //console.log(initialMonthArray);
    //const weekInformation = new TwoWayMap(weekRangeInformation.weekRanges); 
    //console.log("Week information: " + JSON.stringify(weekInformation.map) + " \n| Week information rev: " + JSON.stringify(weekInformation.reverseMap));

    const monthNameArray = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // TODO: Once users and their IDs are established, replace the keys below with the appropriate user ID
    const initialRowHeaderArray = instructorArray;
    /*
    const initialRowHeaderArray = [
        {key: "jackson1", name: "Jackson"},
        {key: "pete2", name: "Pete"},
        {key: "michelle3", name: "Michelle"},
        {key: "ken4", name: "Ken"},
    ];
    */

    // 100px height cells + 4 px total margin, change later if needed
    const rowHeight = 204;

    const [height, setHeight] = useState(initialRowHeaderArray.length * rowHeight);
    const [monthArray, setMonthArray] = useState(initialMonthArray);
    const [rowHeaderArray, setRowHeaderArray] = useState(initialRowHeaderArray);
    //const removedRow = useEffect();

    /*
    const parseInstructors = (data) => {
        const parsedData = JSON.parse(data);
        const instructorArray = [];
        for(let i = 0; i < parsedData.length; i++) {
            const instructor = {};
            instructor.key = parsedData[i].id;
            instructor.name = parsedData[i].first_name + " " + parsedData[i].last_name;
            instructorArray.push(instructor);
        }

        setHeight(instructorArray.length * rowHeight);
        setRowHeaderArray(instructorArray);
    }

    const retrieveNamesFromDatabase = () => {
        fetch('http://localhost:8000/instructors')
        .then(response => {
            return response.text();
        })
        .then(data => {
            parseInstructors(data)
        });
    }

    useEffect(() => {
        retrieveNamesFromDatabase();
    }, []); // Only retrieve names from the database when the component mounts
    */

    // TODO: Change row headers to take in a key and a text
    const addRowHeader = (user, emit=true) => {
        heightLimit.set((rowHeaderArray.length + 1) * 2);
        setRowHeaderArray([...rowHeaderArray, {key: user.username, name: user.firstname + " " + user.lastname}]);
        setHeight(height + rowHeight);
        console.log("Length in Timeline: " + rowHeaderArray.length);

        if(emit) {
            socket.emit('userAdded', user);
        }
    }

    // TODO: Find a key in the row header array and remove that instead of the name
    const removeRowHeader = (key, emit=true) => {
        heightLimit.set((rowHeaderArray.length - 1) * 2);
        setRowHeaderArray(_.reject(rowHeaderArray, (element) => {return element.key == key}))
        setHeight(height - rowHeight);
        if(emit) {
            socket.emit('userDeleted', key);
        }
    }
    
    const createRowHeader = (item, i) => {
        return <RowHeader key={item.key + "rowHeader" + i} socket={socket} text={item.name} 
                position={{x: i*2+1, y: 1}} width={monthArray.length * 5} height={2}
                removeFunction={() => removeRowHeader(item.key)}/>
    }

    const createMonth = (item, i) => {
        return <Month key={monthNameArray[item.monthIndex] + " month"} title={monthNameArray[item.monthIndex]} 
            position={{x: 1, y: i === 0 ? i+3 : getNumberOfWeeks(initialMonthArray, i)+3}} weeks={item.weeks} />
    }

    socket.on("userAdded", (user) => {
        addRowHeader(user, false);
    });

    socket.on("userDeleted", (id) => {
        removeRowHeader(id, false);
    });

    return(
        <React.Fragment>
            <div className="grid-container-months">
                {
                    monthArray.map((item, i) => {
                        return (
                            createMonth(item, i)
                        )
                    })
                }
            </div>
            {/* <div className="grid-container-layout" style={{height:height}}>
                {
                    rowHeaderArray.map((item, i) => {
                        return (
                            createRowHeader(item, i)
                        )
                    })
                }
            </div> */}
            <Popup trigger={<button>Add Row</button>} modal>
                <div className="add-row-modal-bg">
                    <Form text={"Add Row: "} textObject={["Username", "First Name", "Last Name", "Email", "Password"]}callBack={(text) => addRowHeader(text)}/>
                </div>
            </Popup>
            {/*this.inputBox
            <button onClick={this.addMonth}>Add Row</button>*/}
            <div className="grid-item-container"> 
                <NoCollisionLayout socket={socket} heightLimit={heightLimit.get} instructorArray={instructorArray} weekInformation={weekInformation}/>
            </div>
        </React.Fragment>
    );
}

function getWeeks(startDate, month, weekInformation) {
    const weeks = [];
    const weekTimes = {month: startDate.getMonth(), times: []};

    // Retrieve first days of every week in all of the months
    while(startDate.getMonth() == month) {
        // Save the date to an array to position courses in the timeline
        const index = weekInformation.weekNum + weeks.length
        const date = new Date(startDate.getTime());
        weekTimes.times.push({index: index, date: date});
        weekInformation.indexMap[index] = date;

        // Get the first day of every week
        weeks.push(startDate.getDate());

        // Increment the date by a week
        startDate.setDate(startDate.getDate() + 7);
    }

    weekInformation.weekRangesArray.push(weekTimes);
    weekInformation.weekNum += weeks.length;
    //console.log(weekInformation);
    return weeks;
}

function getNumberOfWeeks(weeks, index) {
    let sum = 0;

    //console.log(weeks)
    //console.log(weeks[0].weeks.length);
    for(let i = index-1; i >= 0; i--) {
        sum += weeks[i].weeks.length;
    }

    return sum;
}