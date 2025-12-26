// ---------- CONFIG ----------
const API_BASE = "/api";

// ---------- STATE ----------
let currentUser = null; // { username, role }

// ---------- DOM ELEMENTS ----------
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const userSection = document.getElementById("user-section");
const adminSection = document.getElementById("admin-section");

const roleSelect = document.getElementById("role");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMsg = document.getElementById("loginMsg");

const regUsernameInput = document.getElementById("regUsername");
const regPasswordInput = document.getElementById("regPassword");
const registerMsg = document.getElementById("registerMsg");

const patientNameInput = document.getElementById("patientName");
const doctorSelect = document.getElementById("doctor");
const dateInput = document.getElementById("date");
const slotSelect = document.getElementById("slot");
const bookingMsg = document.getElementById("bookingMsg");

const userTableBody = document.querySelector("#userTable tbody");
const adminTableBody = document.querySelector("#adminTable tbody");

const loginBtn = document.getElementById("loginBtn");
const showRegisterBtn = document.getElementById("showRegister");
const backToLoginBtn = document.getElementById("backToLogin");
const bookBtn = document.getElementById("bookBtn");
const userLogoutBtn = document.getElementById("userLogout");
const adminLogoutBtn = document.getElementById("adminLogout");

// ---------- HELPERS ----------
function showSection(section) {
    loginSection.classList.add("hidden");
    registerSection.classList.add("hidden");
    userSection.classList.add("hidden");
    adminSection.classList.add("hidden");

    section.classList.remove("hidden");
}

// ---------- REGISTER ----------
showRegisterBtn.addEventListener("click", () => {
    registerMsg.textContent = "";
    showSection(registerSection);
});

backToLoginBtn.addEventListener("click", () => {
    loginMsg.textContent = "";
    showSection(loginSection);
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value.trim();

    if (!username || !password) {
        registerMsg.textContent = "Both fields are required.";
        registerMsg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            registerMsg.textContent = data.message || "Registration failed.";
            registerMsg.style.color = "red";
            return;
        }

        registerMsg.textContent = "Registered successfully! You can now log in.";
        registerMsg.style.color = "green";
        regUsernameInput.value = "";
        regPasswordInput.value = "";
    } catch (err) {
        registerMsg.textContent = "Server error. Try again.";
        registerMsg.style.color = "red";
    }
});

// ---------- LOGIN ----------
loginBtn.addEventListener("click", async () => {
    const role = roleSelect.value;
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        loginMsg.textContent = "Please enter username and password.";
        loginMsg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();

        if (!res.ok) {
            loginMsg.textContent = data.message || "Invalid credentials.";
            loginMsg.style.color = "red";
            return;
        }

        currentUser = { username, role };
        loginMsg.textContent = "";

        usernameInput.value = "";
        passwordInput.value = "";

        if (role === "user") {
            await loadUserAppointments();
            showSection(userSection);
        } else {
            await loadAllAppointments();
            showSection(adminSection);
        }
    } catch (err) {
        loginMsg.textContent = "Server error. Try again.";
        loginMsg.style.color = "red";
    }
});

// ---------- LOGOUT ----------
function doLogout() {
    currentUser = null;
    showSection(loginSection);
}

userLogoutBtn.addEventListener("click", doLogout);
adminLogoutBtn.addEventListener("click", doLogout);

// ---------- BOOK APPOINTMENT ----------
bookBtn.addEventListener("click", async () => {
    if (!currentUser || currentUser.role !== "user") {
        bookingMsg.textContent = "Please login as user to book.";
        bookingMsg.style.color = "red";
        return;
    }

    const patientName = patientNameInput.value.trim();
    const doctor = doctorSelect.value;
    const date = dateInput.value;
    const slot = slotSelect.value;

    if (!patientName || !doctor || !date || !slot) {
        bookingMsg.textContent = "All fields are required.";
        bookingMsg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/appointments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient: patientName,
                doctor,
                date,
                slot,
                username: currentUser.username
            })
        });

        const data = await res.json();

        if (!res.ok) {
            bookingMsg.textContent = data.message || "Booking failed.";
            bookingMsg.style.color = "red";
            return;
        }

        bookingMsg.textContent = "Appointment booked successfully!";
        bookingMsg.style.color = "green";
        patientNameInput.value = "";

        await loadUserAppointments();
        await loadAllAppointments();
    } catch (err) {
        bookingMsg.textContent = "Server error. Try again.";
        bookingMsg.style.color = "red";
    }
});

// ---------- LOAD APPOINTMENTS ----------
async function loadUserAppointments() {
    if (!currentUser) return;
    try {
        const res = await fetch(
            `${API_BASE}/appointments?username=${encodeURIComponent(currentUser.username)}`
        );
        const data = await res.json();

        userTableBody.innerHTML = "";
        if (Array.isArray(data)) {
            data.forEach((a) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${a.doctor}</td><td>${a.date}</td><td>${a.slot}</td>`;
                userTableBody.appendChild(tr);
            });
        }
    } catch {
        // ignore UI error
    }
}

async function loadAllAppointments() {
    try {
        const res = await fetch(`${API_BASE}/appointments`);
        const data = await res.json();

        adminTableBody.innerHTML = "";
        if (Array.isArray(data)) {
            data.forEach((a) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${a.patient}</td><td>${a.doctor}</td><td>${a.date}</td><td>${a.slot}</td>`;
                adminTableBody.appendChild(tr);
            });
        }
    } catch {
        // ignore UI error
    }
}
