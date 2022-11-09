import React from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import _ from "lodash";
import Form from "./Form";
const ReactGridLayout = WidthProvider(RGL);
const PUT = "PUT";
//const originalLayout = getFromLS("layout") || [];

export default class LocalStorageLayout extends React.PureComponent {
  static defaultProps = {
    className: "layout",
    cols: 25,
    rowHeight: 100,
    margin: [2, 2],
    preventCollision: true,
    resizeHandles: ['e'],
    compactType: null,
    autoSize: true
    // isBounded: true,
  };

  constructor({props, socket, heightLimit, instructorArray, weekInformation}) {
    super(props);

    // console.log(instructorArray);
    // console.log(weekInformation);

    this.state = {
      items: instructorArray.reduce(function(acc, element, index) {
        // console.log(element + index);
        // console.log(element.timeblocks[0]);
        console.log(element.timeblocks);
        if(element.timeblocks.length == 0 || weekInformation.length == 0){
          return;
        }

        const start = findWeekIndex(weekInformation, element.timeblocks[0].start);
        const end = findWeekIndex(weekInformation, element.timeblocks[0].end) + 1;
        return acc.concat(
          element.timeblocks.map((info) => {
            return(
              {
                text: info.name + element.key,
                data: {
                  i: element.key,
                  x: start,
                  y: index * 2,
                  w: end - start,
                  h: 1,
                }
              }
            )
          })
        );
      }, []),
      newCounter: 0,
      heightLimit: heightLimit,
      weekInformation: weekInformation
    };

    //this.onLayoutChange = this.onLayoutChange.bind(this);
    this.socket = socket;

    this.socket.on("itemChanged", (item) => {
      console.log("Item Received: " + JSON.stringify(item));

      console.log("Layout: " + this.state.layout);
      for(let i = 0; i < this.state.layout.length; i++) {
        if(this.state.layout[i].i == item.i) {
          const newLayout = this.state.layout.slice();
          newLayout[i] = item;

          console.log(this.state.layout);
          console.log(newLayout);
          this.setState({
            layout: newLayout
          });
  
          //saveToLS("layout", this.state.layout);
          break;
        }
      }
    });
  }

  onLayoutChange = (layout, layouts) => {
    /*eslint no-console: 0*/
    //saveToLS("layout", layout);
    this.setState({ layout });
    // this.props.onLayoutChange(layout); // updates status display
    // this.props.onLayoutChange(layout);
    console.log("layout changed");
  }
  
  /*
  // Note: Websockets are used to send a query to update the database
  updateCourse(id, start, end) {
    const body = {start: start, end: end};
    fetch('http://localhost:8000/instructors/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    .then(response => {
      console.log("Response: " + JSON.stringify(response));
        return response.text();
    })
    .then(data => {
        console.log("Data from updating course: " + data);
    });
  }
  */

  onItemChange = (layout, oldItem, newItem, placeholder, e, element) => {
    /* Information logging
    console.log("Layout:" + JSON.stringify(layout));
    console.log("Old Item: " + JSON.stringify(oldItem));
    console.log("New Item: " + JSON.stringify(newItem));
    console.log("PlaceHolder: " + JSON.stringify(placeholder));
    console.log("MouseEvent: " + e);
    console.log(layout.indexOf(newItem));
    console.log("Layout Index: " + this.layout)*/

    // console.log("Week Information: " + this.state.weekInformation);
    // console.log("Layout:" + JSON.stringify(layout));
    // console.log("New Item: " + JSON.stringify(newItem));

    // Update the dates on the postgresql database
    const startDate = findWeekDate(this.state.weekInformation, newItem.x);
    const endDate = findWeekDate(this.state.weekInformation, newItem.w + newItem.x - 1);
    // HTTP request instead of sockets
    //this.updateCourse(newItem.i, startDate.getTime(), endDate.getTime());

    this.socket.emit('itemChanged', newItem, {id: newItem.i, start: startDate.getTime(), end: endDate.getTime()});

    //console.log("ISO: " + new Date(Date.now()).toISOString());
    //console.log("Start: " + startDate + "\nEnd: " + endDate);
    //console.log("Date now: " + Date.now());
    //console.log("StartDate: " + startDate.getTime());

    // Code for updating the properties of an item's state
    const index = _.findIndex(this.state.items, (element) => {return element.data.i == newItem.i});
    const newItems = this.state.items.slice();
    const foundItem = this.state.items[index];
    foundItem.data.h = newItem.h;
    foundItem.data.w = newItem.w;
    foundItem.data.x = newItem.x;
    foundItem.data.y = newItem.y;
    newItems.splice(index, 1, foundItem);
    this.setState({items: newItems});
  }

  onAddItem(text, x=0, y=0, w=3) {
    console.log("adding", "n" + this.state.newCounter);
    this.setState({
      // Add a new item. It must have a unique key!
      items: this.state.items.concat({
        text: text,
        data:{
          i: text + this.state.newCounter,
          x: x,
          y: y, 
          w: w,
          h: 1,
        }
      }),
      // Increment the counter to ensure key is always unique.
      newCounter: this.state.newCounter + 1
    });
  }

  onRemoveItem(i) {
    
    this.setState({ items: _.reject(this.state.items, (element) => {return element.data.i == i}) });
    console.log(JSON.stringify(this.state.layout));
  }

  onDrop = (layout, layoutItem, _event) => {
    console.log("LayoutItem: " + JSON.stringify(layoutItem));
    alert(`Dropped element props:\n${JSON.stringify(layoutItem, ['x', 'y', 'w', 'h'], 2)}`);
  };

  createElement(el) {
    const removeStyle = {
      position: "absolute",
      right: "2px",
      top: 0,
      cursor: "pointer",
      padding: "5px",
    };
    const i = el.i;

    // console.log("Recreating Items...");
    // TODO: Figure out how to programmatically reset elements that are over the height limit, solution needs setState to update the DOM
    // const currentHeightLimit = this.state.heightLimit();
    // console.log("el.data.y: " + JSON.stringify(el.data.y) + ", Height: " + currentHeightLimit);

    // if(el.data.y > currentHeightLimit) {
    //   el.data.y = 1;
    //   console.log("el.data.y after: " + el.data.y);
    // } 

    return (
      <div key={el.data.i} data-grid={el.data}>
        <span className="text">{el.text}</span>
        <span
          className="remove"
          style={removeStyle}
          onClick={this.onRemoveItem.bind(this, el.data.i)}
        >
          x
        </span>
      </div>
    );
  }

  render() {
    return (
      <React.Fragment>
      <button style={{position: "sticky", zIndex: 99}} onClick={() => this.onAddItem("test1")}>Add Item</button>
      <div 
          style={{position: "absolute", zIndex: 99, width: 200, backgroundColor: "yellow"}}
          className="droppable-element"
          draggable={true}
          unselectable="on"
          // this is a hack for firefox
          // Firefox requires some kind of initialization
          // which we can do by adding this attribute
          // @see https://bugzilla.mozilla.org/show_bug.cgi?id=568313
          onDragStart={e => e.dataTransfer.setData("text/plain", "")}
        >
          Drag me!
        </div>
      <div>
        {/*<button onClick={this.resetLayout} style={{position: "sticky", zIndex: 99}}>Reset Layout</button>*/}
        <ReactGridLayout
          {...this.props}
          maxRows={this.state.heightLimit()}
          layout={this.state.layout}
          onLayoutChange={() => this.onLayoutChange}
          //onDragStop= {this.onItemChange}
          onResizeStop = {this.onItemChange}
          onDrop={this.onDrop}
          measureBeforeMount={false}
          isDroppable={true}
          droppingItem={this.props.item}
        >
          {this.state.items.map(el => this.createElement(el))}
          {/* <div key={"j"}>
            <span className="text">{"hge;p"}</span>
          </div> */}

        </ReactGridLayout>
      </div>
      </React.Fragment>
    );
  }
}

function getFromLS(key) {
  let ls = {};
  if (global.localStorage) {
    try {
      ls = JSON.parse(global.localStorage.getItem("rgl-7")) || {};
    } catch (e) {
      /*Ignore*/
    }
  }
  return ls[key];
}

function findWeekIndex(weekInformation, date) {
  // Search for a week in a particular month
  const monthIndex = date.getMonth();
  // console.log("MonthIndex: " + monthIndex);
  // console.log(weekInformation.weekRangesArray);

  // Get the first day of every week in that month
  const weekRanges = weekInformation.weekRangesArray[monthIndex].times;

  for(let i = 0; i < weekRanges.length; i++) {
    if(date <= weekRanges[i].date) {
      return weekRanges[i].index;
    }

  }

  // Return the index of the last week of the month
  return weekRanges[weekRanges.length - 1].index;
}

function findWeekDate(weekInformation, index) {
  return weekInformation.indexMap[index];
}

function saveToLS(key, value) {
  if (global.localStorage) {
    global.localStorage.setItem(
      "rgl-7",
      JSON.stringify({
        [key]: value
      })
    );
  }
}