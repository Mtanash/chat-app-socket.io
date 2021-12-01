const socket = io();

// elements
const formElement = document.getElementById("form");
const formButtonElement = document.querySelector("#form button");
const formInputElement = document.querySelector("#form input");
const locationButtonElement = document.getElementById("send-location");
const messagesElement = document.getElementById("messages");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById(
  "locationMessage-template"
).innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  const newMessageElement = messagesElement.lastElementChild;

  const newMessageStyles = getComputedStyle(newMessageElement);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessageElement.offsetHeight + newMessageMargin;

  const visibleHeight = messagesElement.offsetHeight;

  const containerHeight = messagesElement.scrollHeight;

  const scrollOffset = messagesElement.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messagesElement.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    message: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messagesElement.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById("sidebar").innerHTML = html;
});

formElement.addEventListener("submit", (e) => {
  e.preventDefault();

  formButtonElement.setAttribute("disabled", "disabled");

  const msg = e.target.message.value;
  socket.emit("sendMessage", msg, (error) => {
    formButtonElement.removeAttribute("disabled");
    formInputElement.value = "";
    formInputElement.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message delivered");
  });
});

locationButtonElement.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation not supported by your browser");
  }

  locationButtonElement.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      (message) => {
        locationButtonElement.removeAttribute("disabled");
        console.log(message);
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
