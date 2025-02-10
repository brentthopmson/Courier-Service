const APP_SCRIPT_USER_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec?sheetname=user";
const APP_SCRIPT_PACKAGE_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec?sheetname=package";
const APP_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec";

// Admin Login Verification
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector("#loginForm")) {
        document.getElementById("loginForm").addEventListener("submit", loginAdmin);
        checkAdminSession();
    } else if (document.querySelector("#packageTable")) {
        checkAdminSession();
    }
});

function loginAdmin(event) {
    event.preventDefault();
    let username = document.getElementById("adminUsername").value.trim();
    let password = document.getElementById("adminPassword").value.trim();
    
    fetch(APP_SCRIPT_USER_URL)
        .then(response => response.json())
        .then(data => {
            let user = data.find(row => row.username === username && row.password === password);
            if (user) {
                sessionStorage.setItem("loggedInAdmin", username);
                showAdminDashboard();
            } else {
                alert("Invalid credentials!");
            }
        })
        .catch(error => console.error("Error fetching user data:", error));
}

function checkAdminSession() {
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin");
    if (loggedInAdmin) {
        showAdminDashboard();
    }
}

function showAdminDashboard() {
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin");
    document.getElementById("adminUsernameDisplay").textContent = loggedInAdmin;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboardSection").style.display = "block";
    loadPackages(loggedInAdmin);
}

function showAddPackageModal() {
    document.getElementById("addPackageModal").style.display = "block";
}

function hideAddPackageModal() {
    document.getElementById("addPackageModal").style.display = "none";
}


// Logout Admin
function logoutAdmin() {
    sessionStorage.removeItem("loggedInAdmin");
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("dashboardSection").style.display = "none";
}

// Load Admin Packages
function loadPackages(adminUsername) {
    fetch(APP_SCRIPT_PACKAGE_URL)
        .then(response => response.json())
        .then(data => {
            let filteredData = data.filter(row => row.username === adminUsername);
            let tableBody = document.getElementById("packageTable");
            tableBody.innerHTML = "";
            filteredData.forEach(pkg => {
                let row = `<tr>
                              <td>${pkg.trackingNumber}</td>
                              <td>${pkg.sender}</td>
                              <td>${pkg.receiver}</td>
                              <td>${pkg.status}</td>
                              ${pkg.status !== "DELIVERED" && pkg.status !== "RETURNED" ? `<td><button onclick="addDays('${pkg.trackingNumber}')">+</button></td>` : ""}
                              <td><button onclick="deletePackage('${pkg.trackingNumber}')">🗑</button></td>
                           </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error("Error fetching package data:", error));
}

// Add Package
function addPackage(event) {
    event.preventDefault();
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin"); // Get logged-in admin username
    if (!loggedInAdmin) {
        alert("You must be logged in to add a package.");
        return;
    }

    let payload = new URLSearchParams();
    payload.append("action", "addPackage");
    payload.append("id", document.getElementById("packageId").value.trim());
    payload.append("sendDateTime", new Date().toISOString());
    payload.append("deliveryType", document.getElementById("deliveryType").value.trim());
    payload.append("itemType", document.getElementById("itemType").value.trim());
    payload.append("senderName", document.getElementById("sender").value.trim());
    payload.append("senderPhone", document.getElementById("senderPhone").value.trim());
    payload.append("senderEmail", document.getElementById("senderEmail").value.trim());
    payload.append("senderAddress", document.getElementById("senderAddress").value.trim());
    payload.append("senderNote", document.getElementById("senderNote").value.trim());
    payload.append("receiverName", document.getElementById("receiver").value.trim());
    payload.append("receiverPhone", document.getElementById("receiverPhone").value.trim());
    payload.append("receiverEmail", document.getElementById("receiverEmail").value.trim());
    payload.append("receiverAddress", document.getElementById("receiverAddress").value.trim());
    payload.append("username", loggedInAdmin);  // Include logged-in admin's username

    console.log("Sending Payload for addPackage:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(loggedInAdmin);
    })
    .catch(error => console.error("Error adding package:", error));
}

// Add Days
function addDays(trackingNumber) {
    let additionalDays = prompt("Enter additional days:");
    let delayReason = prompt("Enter delay reason:");
    if (!additionalDays || !delayReason) return;

    let payload = new URLSearchParams();
    payload.append("action", "addDays");
    payload.append("trackingNumber", trackingNumber);
    payload.append("additionalDays", additionalDays);
    payload.append("delayReason", delayReason);

    console.log("Sending Payload for addDays:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(sessionStorage.getItem("loggedInAdmin"));
    })
    .catch(error => console.error("Error adding days:", error));
}

// Delete Package
function deletePackage(trackingNumber) {
    if (!confirm("Are you sure you want to delete this package?")) return;

    let payload = new URLSearchParams();
    payload.append("action", "deletePackage");
    payload.append("trackingNumber", trackingNumber);

    console.log("Sending Payload for deletePackage:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(sessionStorage.getItem("loggedInAdmin"));
    })
    .catch(error => console.error("Error deleting package:", error));
}



// User Tracking
function trackPackage() {
    let trackingId = document.getElementById("trackingInput").value.trim();
    fetch(APP_SCRIPT_PACKAGE_URL)
        .then(response => response.json())
        .then(data => {
            let package = data.find(pkg => pkg.trackingNumber === trackingId);
            let resultDiv = document.getElementById("trackingResult");
            if (package) {
                resultDiv.innerHTML = `<p><strong>Tracking ID:</strong> ${package.trackingNumber}</p>
                                       <p><strong>Status:</strong> ${package.status}</p>`;
            } else {
                resultDiv.innerHTML = `<p style="color:red;">Package not found.</p>`;
            }
        })
        .catch(error => console.error("Error fetching tracking data:", error));
}
