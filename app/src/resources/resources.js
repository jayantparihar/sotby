import React, { Component } from 'react';
import 'react-edit-text/dist/index.css';
import './index.css';
import _ from "lodash";
import { useSearchParams } from "react-router-dom";
import { ReactSession } from 'react-client-session';

const END_POINT_ROOT = "http://localhost:8000/";

class PopUp extends Component {

    constructor({ props, socket, toggle, resInfo, ds_id }) {
        super(props);
        this.state = {
            inputValue: 0,
        };
        this.resInfo = resInfo;
        this.toggle = toggle;
        this.socket = socket;
        this.quantityAvailable = resInfo.q_left;
        this.ds_id = ds_id;

    }

    handleClose = () => {
        this.toggle();
    }

    handleSubmit = () => {
        console.log(this.quantityAvailable);
        this.props.toggle();

        if (isNaN(this.state.inputValue)) {
            alert("Please enter a number");
        }
        else if (this.state.inputValue > this.quantityAvailable) {
            alert("Not enough items are available!");
        }
        else if (this.state.inputValue <= 0) {
            alert("Invalid number");
        }
        else {
            alert(`Succesfully booked ${this.state.inputValue} ${this.resInfo.model_name}`);
            this.socket.emit("bookResource", {
                ds_id: this.ds_id,
                model_num: this.resInfo.model_num,
                model_name: this.resInfo.model_name,
                quantity_total: this.resInfo.quantity_total,
                model_location: this.resInfo.model_location,
                q_left: (this.quantityAvailable - this.state.inputValue),
                quantity_booked: this.state.inputValue
            });
        }
    };

    updateInputValue = (evt) => {
        this.setState({
            inputValue: evt.target.value
        });
    }

    render() {
        return (
            <div className="modal">
                <div className="modal_content">
                    <span className="close" onClick={this.handleClose}>
                        &times;
                    </span>
                    <form>
                        <label id="popUpLabel">
                            Number of Items:
                            <input type="text" name="count" value={this.state.inputValue} onChange={evt => this.updateInputValue(evt)} />
                        </label>
                        <br />
                        <input type="submit" onClick={this.handleSubmit} />
                    </form>
                </div>
            </div>
        );
    }
}

class Item extends React.Component {

    constructor({ props, socket, resInfo, ds_id }) {
        console.log(resInfo)
        super(props);
        this.resInfo = resInfo;
        this.state = {
            seen: false
        }
        this.socket = socket;
        this.ds_id = ds_id;
        //   Has a value  ?  yes, then keep it  :  No, then set it to quantity_total
        this.resInfo.q_left = this.resInfo.q_left != null ? this.resInfo.q_left : this.resInfo.quantity_total
    }

    togglePop = () => {
        this.setState({
            seen: !this.state.seen
        });
    };

    render() {
        return (
            <tr>
                <td>
                    <p>{this.resInfo.model_name}</p>
                </td>
                <td>
                    <p>{this.resInfo.quantity_total}</p>
                </td>
                <td>
                    <p>{this.resInfo.q_left}</p>
                </td>
                <td>
                    <p>{this.resInfo.model_location}</p>
                </td>
                <td id="popUpBookBtn">
                    {this.state.seen ? null : <button onClick={() => this.togglePop()}>Book</button>}
                    {this.state.seen ? <PopUp toggle={this.togglePop} resInfo={this.resInfo} socket={this.socket} ds_id={this.ds_id} /> : null}
                </td>
            </tr>
        );
    }
}

class Resource extends React.Component {

    constructor({ props, socket, date, ds_id }) {
        super(props);
        this.socket = socket;
        this.state = {
            data: null,
            dataLoaded: false,
        }

        this.date = date;
        this.ds_id = ds_id;
        this.socket.on('bookResource', (resInfo) => {

            let index;
            for (let i = 0; i < this.state.data.length; i++) {
                if (this.state.data[i].model_num == resInfo.model_num) {
                    index = i;
                    break;
                }
            }

            let copyData = this.state.data.slice();
            copyData[index] = resInfo;

            this.setState({
                data: _.reduce(copyData, (acc, res) => {
                    const rowData = res;
                    return [...acc, rowData];
                }, [])
            });
        })
    }

    renderItem(itemInfo) {
        return (
            <Item resInfo={itemInfo} key={itemInfo.model_num + itemInfo.q_left} socket={this.socket} ds_id={this.ds_id} />
        );
    }

    renderResouce() {
        const items = this.state.data.map((itemInfo, index) => {
            return (
                this.renderItem(itemInfo)
            );
        });
        return (
            <table>
                <caption>Available Resources</caption>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Total Quantity</th>
                        <th>Available Quantity</th>
                        <th>location</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items}
                </tbody>
            </table>
        );
    }

    //----
    parseData = (data) => {
        if (!data) {
            return null;
        }

        const parsedData = JSON.parse(data);

        this.setState({ data: parsedData.rows });
        this.setState({ dataLoaded: true });
    }

    retrieveResourcesDataFromDatabase = (date) => {
        fetch(END_POINT_ROOT + `resources?date=${date}`, {
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
        this.retrieveResourcesDataFromDatabase(this.date);
    }

    render() {
        return (
            ReactSession.get("admin") >= 0 ? (
                this.state.dataLoaded ? this.renderResouce() :
                    <span>Loading data...</span>
            ) :
                window.location.href = "/"
        );
    }
}

const Resources = (socket) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const ds_id = searchParams.get("ds_id");
    const current_date = new Date(searchParams.get("date"));
    const formattedDate = `${current_date.getFullYear()}-${current_date.getMonth() + 1}-${current_date.getDate()}`;
    console.log(formattedDate);
    console.log(ds_id);
    return (
        <Resource socket={socket.socket} ds_id={ds_id} date={formattedDate}></Resource>
    );
}

export default Resources;
