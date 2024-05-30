let socket;
let user_name;
const newTracks = document.getElementById("new-tracks");
const searchResults = document.getElementById("search-results");

let selectedTrack;

let users;

let reactions;

let audio;

if(localStorage.hasOwnProperty("user")) {
    document.getElementById("name").value = localStorage.getItem("user");
    document.getElementById("password").value = localStorage.getItem("password");
    document.getElementById("group-id").value = localStorage.getItem("group-id");
    login();
}

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("password");
    location.reload()
}
function login(signup) {
    socket = new WebSocket(url);
    socket.onerror = (ev) => {
        window.alert("Couldn't connect to server. Please check your internet connection. If you have internet and it still doesn't work, the server might be off right now. If this is still the case in a couple of minutes, please contact the admin.");
    }
    socket.onopen = function (ev) {
        socket.send(JSON.stringify({
            messageType: signup ? "signup" : "login",
            string: document.getElementById("name").value.trim(),
            password: document.getElementById("password").value.trim(),
            groupId: document.getElementById("group-id").value.trim()
        }));
        user_name = document.getElementById("name").value;
    };
    socket.onmessage = function (ev) {
        let input = JSON.parse(ev.data)

        let div;

        switch (input.messageType) {
            case "track":
                let item = document.createElement("li");
                item.number = input.number;
                item.className = "track-item";

                div = document.createElement("div");

                let profilePictureA = document.createElement("a");
                profilePictureA.href = "profile?group=" + document.getElementById("group-id").value.trim() + "&user=" + input.sentBy;
                let profilePicture = document.createElement("img");
                profilePicture.className = "profile-picture";
                profilePicture.src = input.profilePicture;
                profilePictureA.appendChild(profilePicture);

                let cover = document.createElement("img");
                cover.className = "cover";
                cover.src = input.track.image;

                let coverA = document.createElement("a");
                coverA.appendChild(cover)
                coverA.href = input.track.link;

                let name = document.createElement("p");
                name.className = "track";
                name.innerHTML = input.track.name;

                let artist = document.createElement("p");
                artist.className = "artist";
                artist.innerHTML = input.track.artist;

                div.appendChild(profilePictureA);
                div.appendChild(coverA);
                div.appendChild(name);
                div.appendChild(artist);

                let info = document.createElement("div");
                info.className = 'info';
                info.style.display = 'none';
                let sentBy = document.createElement("a");
                sentBy.className = "sent-by";
                //sentBy.href = "profile/index.html?user=" + encodeURIComponent(input.sentBy);
                sentBy.innerHTML = "Sent by " + input.sentBy;
                info.appendChild(sentBy);
                let dateP = document.createElement("p");
                const date = new Date(input.time * 1000);
                dateP.innerHTML = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                info.appendChild(dateP);

                if(input.message !== '') {
                    let messageP = document.createElement("p");
                    messageP.className = 'message';
                    if(input.sentBy !== 'Armin') {
                        input.message = input.message.replaceAll("&", "&amp;")
                            .replaceAll("<", "&lt;");
                    }
                    messageP.innerHTML = input.message;
                    info.appendChild(messageP);
                }
                name.innerHTML += `<span class="message-icon new-icon" style="background-color: #00ff00; display: ${input.isNew && input.sentBy !== user_name ? 'inline-block' : 'none'}"></span>`

                name.innerHTML += `<span class="message-icon reaction-icon" style="background-color: #a600ff; display: ${input.hasNewReaction ? 'inline-block' : 'none'}"></span>`

                if(input.message !== '')
                    name.innerHTML += '<span class="message-icon" style="background-color: white"></span>'

                let sentTo = document.createElement("ul");
                for(let [u, r] of Object.entries(input.usersWithReactions)) {
                    let item = document.createElement("li");
                    item.innerHTML = u;
                    if(u === user_name) {
                        let selectReaction = document.createElement("select");

                        let option = document.createElement("option");
                        option.innerHTML = "Select reaction";
                        selectReaction.appendChild(option);

                        for (let reaction of reactions) {
                            if(reaction[0] === '0') {
                                if(user_name === "Ole Bela")
                                    continue;
                                reaction = reaction.slice(1);
                            }
                            option = document.createElement("option");
                            option.innerHTML = reaction;
                            option.value = reaction;
                            selectReaction.appendChild(option);
                        }
                        if(r !== "")
                            selectReaction.value = r;
                        selectReaction.onchange = function() {
                            socket.send(JSON.stringify({
                                "messageType": "react",
                                "string": selectReaction.options[selectReaction.selectedIndex].text,
                                "number": input.number,
                            }));
                        };

                        item.appendChild(selectReaction);
                    }
                    else if(r !== '')
                        item.innerHTML += ' <span class="reaction">' + r + '</span>';
                    sentTo.appendChild(item);
                }
                info.appendChild(sentTo);

                let hide = document.createElement("input");
                hide.type = "button";
                hide.value = input.isHidden ? "Show" : "Hide";
                hide.onclick = (ev) => {
                    socket.send(JSON.stringify({
                        messageType: hide.value,
                        number: input.number
                    }));
                    hide.value = hide.value === "Show" ? "Hide" : "Show";
                    if(!document.getElementById("show-hidden").checked) item.style.display = hide.value === "Show" ? 'none' : 'inline-block';
                    info.style.display = 'none';
                };
                info.appendChild(hide);

                if(input.sentBy === user_name) {
                    let deleteTrack = document.createElement("input");
                    info.appendChild(document.createElement("br"));
                    deleteTrack.type = "button";
                    deleteTrack.value = "Delete";
                    deleteTrack.onclick = (ev) => {
                        if(window.confirm("This song will be deleted for everyone you sent it to")) {
                            socket.send(JSON.stringify({
                                messageType: "delete",
                                number: input.number
                            }));
                            newTracks.removeChild(item);
                        }
                    };
                    info.appendChild(deleteTrack);
                }

                div.onclick = (ev) => {
                    if(info.style.display === 'none') {
                        for(let li of newTracks.getElementsByClassName("info")) {
                            li.style.display = 'none';
                        }
                        info.style.display = 'block';
                        audio?.pause()
                        if(input.track.preview) {
                            audio = new Audio(input.track.preview);
                            audio.play();
                        }
                    } else {
                        audio?.pause()
                        info.style.display = 'none';
                        name.getElementsByClassName("reaction-icon")[0].style.display = 'none';
                        name.getElementsByClassName("new-icon")[0].style.display = 'none';
                    }
                }
                item.appendChild(div);

                item.appendChild(info);

                if(!((!input.isHidden || document.getElementById("show-hidden").checked) && (input.sentBy !== user_name || document.getElementById("show-yours").checked)))
                    item.style.display = 'none';

                if(input.isAppended)
                    newTracks.appendChild(item)
                else
                    newTracks.prepend(item)

                break;
            case "error":
                window.alert(input.message);
                break;
            case "login":
                document.getElementById("logged-in").style.display = 'block';
                document.getElementById("login").style.display = 'none';
                document.getElementById('profile-picture').value = input.profilePicture;
                document.getElementById('biography').value = input.biography;
                localStorage.setItem("user", document.getElementById("name").value);
                localStorage.setItem("password", document.getElementById("password").value);
                localStorage.setItem("group-id", document.getElementById("group-id").value);
                reactions = input.reactions;
                break;
            case "overtake":
                if(window.confirm("Connection to user on other device will be lost. Do you want to continue?"))
                    socket.send(JSON.stringify({
                        messageType: "login",
                        string: input.user,
                        password: input.password,
                        groupId: input.groupId,
                        boolean: true
                    }));
                break;
            case "search-result":
                searchResults.innerHTML = "";
                for (let result of input.searchResults) {
                    let item = document.createElement("li");
                    let div = document.createElement("div");
                    div.onclick = function (ev) {
                        selectedTrack = result;
                        socket.send(JSON.stringify({messageType: "get-users" }));
                    }
                    div.innerHTML = `<img class="cover" src="${result.image}"><p class="track">${result.name}</p><p class="artist">${result.artist}</p>`;
                    item.appendChild(div);
                    searchResults.appendChild(item);
                }
                break;
            case "get-users-result":
                searchResults.innerHTML = "";

                users = input.users;

                div = document.getElementById("selected-track");
                div.style.display = 'block';
                div.innerHTML = `<img class="cover" src="${selectedTrack.image}"><p class="track">${selectedTrack.name}</p><p class="artist">${selectedTrack.artist}</p>`;

                document.getElementById("selected-track").innerHTML = div.outerHTML;

                let message = document.getElementById("search");
                message.style.display = 'none';
                message.value = "";

                document.getElementById("message").style.display = 'block';

                for (let result of input.users) {
                    let item = document.createElement("li");
                    let label = document.createElement("label");
                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.id = "-user-" + result
                    label.appendChild(checkbox);
                    label.append(result);
                    item.appendChild(label);
                    searchResults.appendChild(item);
                }
                document.getElementById("send").style.display = 'block';
                document.getElementById("select-all").style.display = 'block';
                break;
            case "delete":
                for(let li of newTracks.getElementsByClassName("track-item")) {
                    if(li.number === input.number) {
                        newTracks.removeChild(li)
                        break;
                    }
                }
                break;
            case "try-register":
                let code;
                do {
                    code = window.prompt("Please enter your validation code.");
                } while(isNaN(parseInt(code)))
                socket.send(JSON.stringify({messageType: "pushover-validate", number: parseInt(code)}));
                break;
            case "reaction":
                for(let li of newTracks.getElementsByClassName("track-item")) {
                    if(li.number === input.number) {
                        let usersWithReactions = li.getElementsByTagName('li')
                        for(let n of usersWithReactions) {
                            if(n.innerHTML.startsWith(input.user)) {
                                let reaction = n.getElementsByClassName('reaction');
                                if(input.reaction === '') {
                                    reaction[0].remove();
                                    li.getElementsByClassName('message-icon reaction-icon')[0].style.display = 'none';
                                }
                                else {
                                    if (reaction.length > 0)
                                        reaction[0].innerHTML = input.reaction;
                                    else n.innerHTML += ' <span class="reaction">' + input.reaction + '</span>';
                                    li.getElementsByClassName('message-icon reaction-icon')[0].style.display = 'inline-block';
                                }
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
        }
    };
    socket.onclose = (ev) => {
        if(document.getElementById("logged-in").style.display !== 'none') {
            location.reload();
        }
    }

    window.onscroll = function(ev) {
        if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight) {
            socket.send(JSON.stringify({ messageType: "load-more" }));
        }
    };
}
function search(ele) {
    if (event.key === 'Enter' && selectedTrack == null) {
        socket.send(JSON.stringify({messageType: "search", string: ele.value.replaceAll(/[^\w ]/g, '')}));
    }
}
function selectAll() {
    for(let user of users) {
        document.getElementById("-user-" + user).checked = true;
    }
}
function reloadSetting(ele) {
    if (event.key === 'Enter') {
        socket.send(JSON.stringify({messageType: ele.id, string: ele.value.trim()}));
    }
}
function reloadVisibility() {
    for(let li of newTracks.getElementsByClassName("track-item")) {
        if((li.getElementsByTagName("input")[0].value !== "Show" || document.getElementById("show-hidden").checked)
            && (li.getElementsByClassName("info")[0].getElementsByClassName("sent-by")[0].innerHTML !== "Sent by " + user_name
                || document.getElementById("show-yours").checked))
            li.style.display = "block";
        else {
            li.getElementsByClassName("info")[0].style.display = 'none';
            li.style.display = "none";
        }
    }
}
function send() {
    let selectedUsers = users.filter(x => document.getElementById("-user-" + x).checked);
    if(selectedUsers.length === 0) {
        window.alert("No users selected");
        return;
    }
    socket.send(JSON.stringify({
        messageType: "send",
        track: selectedTrack,
        string: document.getElementById("message").value.trim(),
        users: selectedUsers
    }));

    document.getElementById("search").style.display = 'block';
    document.getElementById("message").value = '';
    document.getElementById("message").style.display = 'none';
    document.getElementById("send").style.display = 'none';
    document.getElementById("select-all").style.display = 'none';
    document.getElementById("selected-track").style.display = 'none';

    selectedTrack = null;

    searchResults.innerHTML = "";
}
function openSettings() {
    document.getElementById('logged-in').style.display = 'none';
    document.getElementById('settings').style.display = 'block';
}