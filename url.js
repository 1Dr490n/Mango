const url = location.href.includes("file") ? "ws://localhost:1989" : "wss://collie-known-wildly.ngrok-free.app";

if (false) {
    window.alert("The server is offline right now. Please try again in a few minute.");
    location.reload();
}