
// ========================================
// CAMPUSCONNECT - DATABASE CONFIGURATION
// ========================================

const DB_NAME = "CampusConnectDB";
const DB_VERSION = 1;
const STORE_NAME = "students";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

                store.createIndex("technical", "technical");
                store.createIndex("sports", "sports");
                store.createIndex("cultural", "cultural");
            }
        };

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

// ========================================
// DATABASE OPERATIONS
// ========================================

async function addStudent(student) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).add(student);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function getAllStudents() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
}

async function deleteStudentFromDB(id) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(id);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function updateStudentInDB(student) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(student);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function getStudentCount() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).count();

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
}

// ========================================
// INITIALIZE DATABASE
// ========================================

async function initializeDatabase() {
    const count = await getStudentCount();

    if (count === 0) {
        const sampleStudents = [
            { id: "S00001", technical: true, sports: false, cultural: true },
            { id: "S00002", technical: false, sports: true, cultural: false },
            { id: "S00003", technical: true, sports: true, cultural: false },
            { id: "S00004", technical: false, sports: false, cultural: true },
            { id: "S00005", technical: true, sports: false, cultural: false }
        ];

        for (const student of sampleStudents) {
            await addStudent(student);
        }
    }

    console.log("CampusConnect Database Ready!");
    console.log("Total Students:", await getStudentCount());
}

// ========================================
// STEP 3 - DISPLAY STUDENTS
// ========================================

async function displayStudents() {
    const studentList = document.getElementById("studentList");
    const totalStudentsElement = document.getElementById("totalStudents");

    if (!studentList || !totalStudentsElement) {
        console.error("Student display HTML elements not found.");
        return;
    }

    try {
        const students = await getAllStudents();

        totalStudentsElement.textContent = students.length;

        if (students.length === 0) {
            studentList.innerHTML = "<p>No students found.</p>";
            return;
        }

        studentList.innerHTML = students.map(student => {
            const activities = [];

            if (student.technical) activities.push("Technical");
            if (student.sports) activities.push("Sports");
            if (student.cultural) activities.push("Cultural");

            return `
                <div class="student-card">
                    <h3>${student.id}</h3>
                    <p>Activities: ${activities.length ? activities.join(", ") : "None"}</p>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Unable to display students:", error);
    }
}

 // ========================================
 // STEP 4 - ADD NEW STUDENTS
 // ========================================

async function handleAddStudent() {
    const studentId = document.getElementById("studentId").value.trim();

    const technical = document.getElementById("technical").checked;
    const sports = document.getElementById("sports").checked;
    const cultural = document.getElementById("cultural").checked;

    if (!studentId) {
        alert("Please enter Student ID!");
        return;
    }

    if (!technical && !sports && !cultural) {
        alert("Please select at least one activity!");
        return;
    }

    const student = {
        id: studentId,
        technical: technical,
        sports: sports,
        cultural: cultural
    };

    try {
        await addStudent(student);

        alert("Student added successfully!");

        document.getElementById("studentId").value = "";
        document.getElementById("technical").checked = false;
        document.getElementById("sports").checked = false;
        document.getElementById("cultural").checked = false;

        await displayStudents();

    } catch (error) {
        if (error.name === "ConstraintError") {
            alert("This Student ID already exists!");
        } else {
            console.error(error);
            alert("Unable to add student!");
        }
    }
}

 // ========================================
 // STEP 5 - SEARCH STUDENTS
 // ========================================

async function searchStudent() {

    const studentId = document.getElementById("searchId").value.trim();

    const result = document.getElementById("searchResult");

    if (!studentId) {
        alert("Please enter Student ID!");
        return;
    }

    let db;

    try {
        db = await openDatabase();

        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(studentId);

        request.onsuccess = function () {

            const student = request.result;

            if (student) {

                const activities = [];

                if (student.technical) activities.push("Technical");
                if (student.sports) activities.push("Sports");
                if (student.cultural) activities.push("Cultural");

                result.innerHTML = `
                    <div class="student-card">
                        <h3>Student Found!</h3>
                        <p>Student ID: ${student.id}</p>
                        <p>Activities: ${activities.length ? activities.join(", ") : "None"}</p>
                    </div>
                `;

            } else {
                result.textContent = "Student not found!";
            }
        };

        request.onerror = function () {
            result.textContent = "Error searching student!";
        };

        transaction.oncomplete = () => db.close();

        transaction.onerror = () => {
            db.close();
            result.textContent = "Database error!";
        };

    } catch (error) {
        if (db) db.close();
        console.error("Search Error:", error);
        result.textContent = "Unable to search student!";
    }
}

 // ========================================
 // STEP 6 - DELETE STUDENTS
 // ========================================

async function handleDeleteStudent() {

    const studentId = document.getElementById("deleteStudentId").value.trim();

    const result = document.getElementById("deleteResult");

    if (!studentId) {
        alert("Please enter Student ID!");
        return;
    }

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    let db;

    try {
        db = await openDatabase();

        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(studentId);

        let studentFound = false;

        request.onsuccess = function () {

            if (request.result) {
                studentFound = true;
                store.delete(studentId);
            }
        };

        transaction.oncomplete = async function () {

            db.close();

            if (studentFound) {
                result.textContent = "Student deleted successfully!";

                document.getElementById("deleteStudentId").value = "";

                await displayStudents();

            } else {
                result.textContent = "Student not found!";
            }
        };

        transaction.onerror = function () {
            db.close();
            result.textContent = "Unable to delete student!";
        };

    } catch (error) {
        if (db) db.close();

        console.error("Delete Error:", error);
        result.textContent = "Database error!";
    }
}

 // ========================================
 // STEP 7 - UPDATE STUDENT RECORDS
 // ========================================

async function handleUpdateStudent() {

    const studentId = document.getElementById("updateStudentId").value.trim();

    const technical = document.getElementById("updateTechnical").checked;
    const sports = document.getElementById("updateSports").checked;
    const cultural = document.getElementById("updateCultural").checked;

    const result = document.getElementById("updateResult");

    if (!studentId) {
        alert("Please enter Student ID!");
        return;
    }

    if (!technical && !sports && !cultural) {
        alert("Please select at least one activity!");
        return;
    }

    let db;

    try {
        db = await openDatabase();

        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(studentId);

        request.onsuccess = async function () {

            db.close();

            const student = request.result;

            if (!student) {
                result.textContent = "Student not found!";
                return;
            }

            student.technical = technical;
            student.sports = sports;
            student.cultural = cultural;

            try {
                await updateStudentInDB(student);

                result.textContent = "Student updated successfully!";

                await displayStudents();

                document.getElementById("updateStudentId").value = "";
                document.getElementById("updateTechnical").checked = false;
                document.getElementById("updateSports").checked = false;
                document.getElementById("updateCultural").checked = false;

            } catch (error) {
                console.error(error);
                result.textContent = "Unable to update student!";
            }
        };

        request.onerror = function () {
            db.close();
            result.textContent = "Error finding student!";
        };

    } catch (error) {
        if (db) db.close();

        console.error("Update Error:", error);
        result.textContent = "Database error!";
    }
}

// ========================================
// DISPLAY STUDENTS + UPDATE STATISTICS
// ========================================

async function displayStudents() {

    const studentList = document.getElementById("studentList");
    const totalStudentsElement = document.getElementById("totalStudents");
    const technicalCount = document.getElementById("technicalCount");
    const sportsCount = document.getElementById("sportsCount");
    const culturalCount = document.getElementById("culturalCount");

    try {

        const students = await getAllStudents();

        let technical = 0;
        let sports = 0;
        let cultural = 0;

        students.forEach(student => {

            if (student.technical) technical++;
            if (student.sports) sports++;
            if (student.cultural) cultural++;

        });

        // Update dashboard statistics

        totalStudentsElement.textContent = students.length;
        technicalCount.textContent = technical;
        sportsCount.textContent = sports;
        culturalCount.textContent = cultural;

        // Display student records

        if (students.length === 0) {
            studentList.innerHTML = "<p>No students found.</p>";
            return;
        }

        studentList.innerHTML = students.map(student => {

            const activities = [];

            if (student.technical) activities.push("Technical");
            if (student.sports) activities.push("Sports");
            if (student.cultural) activities.push("Cultural");

            return `
                <div class="student-card">
                    <h3>${student.id}</h3>
                    <p>Activities:
                    ${activities.length ? activities.join(", ") : "None"}
                    </p>
                </div>
            `;

        }).join("");

    } catch (error) {

        console.error("Unable to display students:", error);

    }
}


// ========================================
// START APPLICATION
// ========================================

async function startCampusConnect() {
    try {
        await initializeDatabase();
        await displayStudents();
    } catch (error) {
        console.error("CampusConnect Error:", error);
    }
}

startCampusConnect();
