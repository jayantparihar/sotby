import Header from "./components/Header";
import UserInfo from "./components/UserInfo";
import VacationInput from "./components/VacationInput";
import VacationList from "./components/VacationList";
import React from "react";
import { ReactSession } from 'react-client-session';
import { makeStyles } from "@material-ui/core/styles";
import { styled } from "@mui/system";
import { createTheme } from "@mui/material";

const END_POINT_ROOT = "http://localhost:8000/"
const VACATION_RESOURCE = "users"

function isUser() {
	let userStatus = ReactSession.get("admin");
	if (userStatus !== undefined) {
		return true;
	}
	return false;
}

const screenLayout = createTheme({
	breakpoints: {
		values: {
			xxs: 0,
			xs: 300,
			lg: 800,
		}
	}
});

const styles = makeStyles({
	button: {
		border: 0,
		borderRadius: 5,
		color: "white",
		padding: '0 10px',
		background: "#003E6B",
		width: "8vw",
		alignSelf: "center",
		'&:hover': {
			background: "#5082A7",
		},
		'&:focus': {
			background: "#003E6B",
			'&:hover': {
				background: "#5082A7"
			}
		},
		textAlign: "right",
		marginLeft: "30%",
	},
	image: {
		width: 80,
		height: 80,
	}
});

const Container = styled('div')({
	width: "100vw",
	height: "100vh",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "right",
	color: "darkslategray",
	backgroundColor: "white",
})

const Wrapper = styled('div')({
	width: "75%",
	height: "50%",
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	backgroundColor: "white",
	margin: "30px auto",
	minHeight: "200px",
	border: "1px solid steelblue",
	padding: "30px",
	borderRadius: "5px",
	textAlign: "left",
})

const SubmissionFormWrapper = styled('div')({
	display: "flex",
	alignItems: "left",
	justifyContent: "center",
	flexDirection: "column",
})

const VacationListWrapper = styled('div')({
	minWidth: "250px",
	height: "100%",
	alignItems: "center",
	justifyContent: "center",
	overflowY: "scroll",
})

const VacationFormWrapper = styled('div')({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-evenly",
	width: "100%",
	height: "50%",
})

export default class Vacation extends React.Component {
	state = {
		user: '',
		users: [],
		vacations: [],
		vacationID: 0,
		vacationSubmitted: false,
		loaded: false,
	}

	// version that only takes username
	changeUser = (user) => {
		if (!this.state.users.includes(user)) {
			console.log(user);
			alert("User is not in database")
		} else {
			let stateVacations = this.state.vacations
			for (let i = 0; i < this.state.vacations.length; i++) {
				stateVacations[i] = { ...stateVacations[i], user }
			}
			this.setState({ vacations: stateVacations })
			this.postSubmission(user)
		}
	}

	addVacation = (vacation) => {
		const id = this.state.vacationID
		const newVacation = { id, ...vacation }
		this.setState({ vacationID: this.state.vacationID + 1 })
		this.setState({ vacations: [...this.state.vacations, newVacation] })
	}

	deleteVacation = (id) => {
		// check if deleteVacation is invoked
		const index = this.state.vacations.findIndex(vac => vac.id === id);
		this.setState(this.state.vacations.splice(index, 1));
	}

	createDate = (month, day) => {
		const year = new Date().getFullYear()
		const date = new Date(year, month - 1, day)
		return date
	}

	postSubmission = (username) => {
		for (let index = 0; index < this.state.vacations.length; index++) {
			const id = this.state.vacations[index].id
			const start_date = this.createDate(this.state.vacations[index].startingMonth, this.state.vacations[index].startingDay).getTime()
			const end_date = this.createDate(this.state.vacations[index].endingMonth, this.state.vacations[index].endingDay).getTime()
			const duration = this.state.vacations[index].day
			const vacation = { id, username, start_date, end_date, duration }
			this.props.socket.emit('vacationAdded', vacation)
		}
		this.setState({ vacationID: 0 })
		this.setState({ vacationSubmitted: true })
		this.setState({ vacations: [] })
	}

	parseData = (data) => {
		if (!data) {
			return null
		}
		const parsedData = JSON.parse(data)
		let dataUsers = []
		for (let i = 0; i < parsedData.length; i++) {
			dataUsers.push(parsedData[i].username)
		}
		this.setState({ users: dataUsers })
		this.setState({ loaded: true })
		console.log(dataUsers);
	}

	getUsers = () => {
		fetch(END_POINT_ROOT + VACATION_RESOURCE)
			.then(response => {
				return response.text();
			})
			.then(data => {
				this.parseData(data)
			});
	}

	componentDidMount() {
		this.getUsers();
	}

	renderApp() {
		return isUser() ? (
			<Container>
				<Header />
				<Wrapper theme={screenLayout} sx={{
					height: {
						xxs: "100%",
						xs: "75%",
						lg: "50%",
					}
				}}>
					<VacationFormWrapper theme={screenLayout} sx={{
						flexDirection: {
							xxs: "column",
							xs: "column",
							lg: "row",
						},
						height: {
							xxs: "80%",
							xs: "80%",
							lg: "50%",
						}
					}}>
						<SubmissionFormWrapper>
							<VacationInput onAdd={this.addVacation} />
							<UserInfo onAdd={this.changeUser} />
							{this.state.vacationSubmitted ? (<div className="vacation-submission-true">Request submitted successfully</div>) : ('')}
						</SubmissionFormWrapper>
						<VacationListWrapper theme={screenLayout} sx={{
							alignItems: {
								xxs: "left",
							}
						}}>
							{this.state.vacations.length > 0 ? (<VacationList vacations={this.state.vacations} onDelete={this.deleteVacation} />) : (<text>No vacations added</text>)}
						</VacationListWrapper>
					</VacationFormWrapper>
				</Wrapper>
			</Container>

		) : window.location.href = "/"
	}

	render() {
		return (this.state.loaded ? this.renderApp() :
			<span>Loading data...</span>)
	}

}
