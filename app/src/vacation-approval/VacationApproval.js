import React from "react";
import NotApprovedList from "./components/NotApprovedList"
import NoVacations from "./components/NoVacations"
import { ReactSession } from 'react-client-session';
import { createTheme } from "@mui/material";
import { styled } from "@mui/system";
import Header from "./components/Header";

// REPLACE WHEN HOSTING
const END_POINT_ROOT = "http://localhost:8000/"
const VACATION_RESOURCE = "vacationsNotApproved"

const screenLayout = createTheme({
    breakpoints: {
        values: {
            xxs: 0,
            xs: 460,
            lg: 800,
        }
    }
})

const ApprovalContainer = styled('div')({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
})

function isAdmin() {
    if (ReactSession.get("admin")) {
        return true;
    }
    return false;
}

export default class VacationApproval extends React.Component {
    state = {
        vacations: [],
        loaded: false,
    }

    constructor({ socket }) {
        super()
        this.socket = socket
        socket.on("vacationApproved", (vacation) => {
            this.setState({ vacations: this.state.vacations.filter((v) => v.vacation_id !== vacation.vacation_id) })
        })
        socket.on("vacationDeleted", (vacation) => {
            this.setState({ vacations: this.state.vacations.filter((v) => v.vacation_id !== vacation.vacation_id) })
        })
    }

    approveVacation = (vacation) => {
        this.setState({ vacations: this.state.vacations.filter((v) => v.vacation_id !== vacation.vacation_id) })
        this.socket.emit("vacationApproved", vacation)
    }

    rejectVacation = (vacation) => {
        this.setState({ vacations: this.state.vacations.filter((v) => v.vacation_id !== vacation.vacation_id) })
        this.socket.emit("vacationDeleted", vacation)
    }

    parseData = (data) => {
        if (!data) {
            return null;
        }
        const parsedData = JSON.parse(data)
        this.setState({ vacations: parsedData })
        this.setState({ loaded: true })
    }

    getVacations = () => {
        fetch(END_POINT_ROOT + VACATION_RESOURCE)
            .then(response => {
                return response.text();
            })
            .then(data => {
                this.parseData(data)
            });
    }

    componentDidMount() {
        this.getVacations();
    }

    renderApp() {
        return isAdmin() ? (
            <ApprovalContainer theme={screenLayout}>
                <Header />
                {this.state.vacations.length > 0 ?
                    (<NotApprovedList vacations={this.state.vacations} onApprove={this.approveVacation} onReject={this.rejectVacation} />)
                    : (<NoVacations />)}
            </ApprovalContainer>
        ) : window.location.href = "/"
    }

    render() {
        return (this.state.loaded ? this.renderApp() :
            <span>Loading data...</span>
        );
    }
}