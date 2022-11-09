import { useState, useEffect } from 'react'
import bg from '../images/1.jpeg'
import logo from '../images/BCIT_logo.png'
import React from "react";

import { ReactSession } from 'react-client-session';
import Footer from "./components/Footer";

// styles
import styles from './login.module.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const authenticate = async (e) => {
    let res_data = {};

    e.preventDefault()

    const user = { username: username, password: password };
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    await fetch('http://localhost:3000/login', requestOptions)
        .then(response => response.json())
        .then(data => res_data = data);

    console.log(res_data.status);
    if (res_data.status === 200) {
        ReactSession.set("username", res_data.username);
        ReactSession.set("first_name", res_data.first_name);
        ReactSession.set("last_name", res_data.last_name);
        ReactSession.set("admin", res_data.admin);
        window.location.href = "/";
    } else {
        document.getElementById("successMessage").innerText = "Incorrect username or password!";
        document.getElementById("successMessage").style.color = 'Yellow';
        document.getElementById("successMessage").style.fontWeight= 'Bold';
    }
}



  useEffect(() => {
    document.body.style.backgroundImage = `url('${bg}')`;
    document.body.style.backgroundSize = `cover`;

  }, [])


  return (
    <div className='backgroundPic'>    
    <form onSubmit={authenticate} className={styles['login-form']}>
    <div align="center">
        <img src={logo} alt='logo' height="150" width="170" ></img>
    </div>
    <h2>Account Login</h2>
    
    <label><br/></label>
      <label>        
        <span><b>Username:</b></span>
        <input 
          type="username" 
          placeholder='Username'
          value={username}
          onChange={(e) => setUsername(e.target.value)} 
        />
      </label>
      <label>
        <span><b>Password:</b></span>
        <input 
          type="password" 
          placeholder='Password'
          onChange={(e) => setPassword(e.target.value)} 
          value={password} 
        />
      </label>
      <button className="btn">Login</button>
      
    <div  id='successMessage'></div>
    </form>
    <center><Footer></Footer></center>
    </div>

  )
}