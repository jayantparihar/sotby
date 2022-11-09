const {By,Key,Builder} = require("selenium-webdriver");
const until = require("selenium-webdriver/lib/until");
const assert = require('assert');
const addRows = require("./addRowsTests");
const addCourses = require("./addCoursesTests");
const moveCourses = require("./moveCoursesTests");
var chrome = require("selenium-webdriver/chrome");
require("chromedriver");

async function main() {
    let driver = await new Builder().forBrowser("chrome").build();
    let driver2 = await new Builder().forBrowser("chrome").build();
    await driver.get("http://localhost:3000/");
    await driver2.get("http://localhost:3001/");

    const user1 = {fname: "Patrick", lname: "Star", email: "patstar@fake.com", pass: "pass"};
    const user2 = {fname2: "Squidward", lname2: "Tentacles", email2: "squidtenta@fake.com", pass2: "pass"};

    const course1 = {number: 2039, subject: "Math", course: "MATH 2039", title: "Discrete Math", length: 8, color: "#FF11FF"};
    const course2 = {number2: 6032, subject2: "Physics", course2: "PHYS 6032", title2: "Advanced Physics", length2: 12, color2: "#FF11FF"};

    const name1 = user1.fname + " " + user1.lname;
    const name2 = user2.fname2 + " " + user2.lname2;

    // Create users and leave them until courses are created/ tested
    await addRows.testTwoAddRow(driver, driver2, user1, user2);

    // Create courses
    await addCourses.testCreateCourse(driver, driver2, course1, course2, name1, name2);

    // Move courses created
    //await moveCourses.testCourseMovement(driver, driver2, course1, course2, name1, name2);    
}

main();