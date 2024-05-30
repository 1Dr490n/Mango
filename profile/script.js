"use strict";
// @ts-ignore
const socket = new WebSocket(url);
const searchParams = new URLSearchParams(window.location.search);
socket.onopen = () => {
    socket.send(JSON.stringify({
        messageType: "user-details",
        groupId: searchParams.get('group'),
        string: searchParams.get('user')
    }));
};
socket.onmessage = (ev) => {
    let input = JSON.parse(ev.data);
    const image = document.getElementById("profile-picture");
    const name = document.getElementById("profile-name");
    const biography = document.getElementById("profile-biography");
    image.src = input.profilePicture;
    name.innerText = searchParams.get('user');
    biography.innerText = input.biography;
};
