function logout() {
  var isAdmin = false;

  try {
    var session = localStorage.getItem("reshare_session");
    var userVal = localStorage.getItem("user");
    var adminEmails = ["admin@aec.edu.in", "23a91a6127@aec.edu.in"];

    if (session) {
      var s = JSON.parse(session);
      if (s.role === "admin" || adminEmails.includes(s.email)) isAdmin = true;
    } else if (userVal && adminEmails.includes(userVal)) {
      isAdmin = true;
    }
  } catch(e) {}

  // Save theme BEFORE clearing so it stays consistent
  var savedTheme = localStorage.getItem("theme") || "light";

  // Clear only session keys — NOT everything
  localStorage.removeItem("user");
  localStorage.removeItem("reshare_session");
  localStorage.removeItem("rh_session");
  sessionStorage.removeItem("rh_session");

  // Put theme back
  localStorage.setItem("theme", savedTheme);

  window.location.href = isAdmin ? "login.html" : "student-login.html";
}