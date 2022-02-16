// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-analytics.js";

import { getDatabase, ref, set, push, onValue, onChildAdded, update, remove } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBCyM-g4fFp4axWO4-lvoP477s7UZO3PQo",
    authDomain: "simple-classroom-c471b.firebaseapp.com",
    projectId: "simple-classroom-c471b",
    storageBucket: "simple-classroom-c471b.appspot.com",
    messagingSenderId: "89432203870",
    appId: "1:89432203870:web:62b881222ca231d5db4acf",
    measurementId: "G-DBESJHVE6Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const database = getDatabase(app);

const currentUserData = {
    name: null,
    id: null
}
const userRef = ref(database, "users");
const msgRef = ref(database, "messages");
const avatarRef = ref(database, "avatars");

async function login(name) {
    const newUserRef = push(userRef);
    const character = document.querySelector("input[name=Character]:checked").value
    let a = await set(newUserRef, {
        username: name,
        character: character
    })

    currentUserData.name = name
    currentUserData.id = newUserRef.key
    currentUserData.character = character
    init();


}


async function sendMessage(msg) {
    const msgRef = ref(database, "messages");
    const newMsgRef = push(msgRef);
    let send = await set(newMsgRef, {
        sender: currentUserData.id,
        content: msg,
        timestamp: Date.now()
    })
}

document.getElementById("submit-login").onclick = async (e) => {
    let name = document.getElementById("Username").value;
    console.log(name)
    await login(name);
    document.getElementById("login").classList.add("hide")
    document.getElementById("chat-container").classList.remove("hide")
    document.getElementById("stats").innerHTML = `Username: ${currentUserData.name} (${currentUserData.id})`
}

document.getElementById("send-msg").onclick = async () => {
    let content = document.getElementById("msg-input").value;
    if (content != "" && content) {
        await sendMessage(content)
        document.getElementById("msg-input").value = ""
    }
}
document.getElementById("msg-input").addEventListener("keydown", (e) => {
    if (e.key === 'Enter') {
        document.getElementById("send-msg").onclick()
    }
})

function returnName(id) {
    console.log(id)
    return userList[id].username || "None";
}
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}


function appendMessage(content = "no message", sender, timestamp = 0, self = false) {
    const chat = document.getElementById("chat");
    const node = document.createElement("div");
    const msg = document.createElement("span");
    const label = document.createElement("label");
    msg.innerText = content
    // console.log(msg)
    label.innerText = (`${returnName(sender)}\n${timeConverter(timestamp)}`)
    if (self) {
        node.className = "self";
        node.appendChild(label);
        node.appendChild(msg);
        chat.appendChild(node)
    } else {
        node.className = "other";
        chat.appendChild(node)
        node.appendChild(msg);
        node.appendChild(label);

    }

}

let userList = [];
let dimensions = { x: 0, y: 0 };

const characterList = {
    hiyori: "src/resource/hiyori/hiyori_pro_t10.model3.json",
    haru: "src/resource/Haru/Haru.model3.json",
    koharu: "src/resource/koharu/koharu.model3.json",
    Mark: "src/resource/Mark/Mark.model3.json",
    Natori: "src/resource/Natori/Natori.model3.json",
    Rice: "src/resource/Rice/Rice.model3.json",
    miku: "src/resource/miku/miku_sample_t04.model3.json"
}

const init = async () => {
    // onValue(userRef, (snapshot) => {
    //     console.log(snapshot.val());
    //     userList = snapshot.val();
    // })

    onChildAdded(userRef, (snapshot) => {
        userList[snapshot.key] = snapshot.val();
        console.log(snapshot.key)
        // addAvatar(snapshot.key)
    })

    onChildAdded(avatarRef, async (snapshot) => {
        console.log("avatarRef", snapshot.key, snapshot.val())
        let av = await loadModel(characterList[snapshot.val().character])
        av.character.element.innerHTML = returnName(snapshot.key);
        console.log(av);
        onValue(ref(database, "/avatars/" + snapshot.key), (m) => {
            if (!m.exists()) {
                av.character.remove()
            } else {
                // console.log(m.key, m.val())
                let value = m.val()
                let rect = av.character.element.getBoundingClientRect()
                let offset = { x: (av.character.element.offsetLeft + rect.width) / document.documentElement.clientWidth, y: (av.character.element.offsetTop + rect.height / 2) / document.documentElement.clientHeight }
                av.character.setMotion((value.x + offset.x - 0.5) * 60, (value.y + offset.y - 0.5) * -60, 0, 0, 0)
                av.character.setEyes((value.x + offset.x - 0.5) * 2, (value.y + offset.y - 0.5) * -2, 1, 1)
                // console.log((value.x + offset.x - 0.5), (value.y + offset.y - 0.5))
            }

        })
    })

    onChildAdded(msgRef, (snapshot) => {
        const value = snapshot.val();
        // console.log(value)
        let self = false;
        if (value.sender === currentUserData.id) {
            self = true;
        }
        appendMessage(value.content, value.sender, value.timestamp, self);
    })

    window.addEventListener("mousemove", (e) => {
        dimensions = { x: e.clientX / document.documentElement.clientWidth, y: e.clientY / document.documentElement.clientHeight }
        let updates = {}
        updates[`/avatars/${currentUserData.id}/x`] = Math.floor(dimensions.x * 100) / 100;
        updates[`/avatars/${currentUserData.id}/y`] = Math.floor(dimensions.y * 100) / 100;
        update(ref(database), updates);
    })

    let updates = {}
    updates[`/avatars/${currentUserData.id}/character`] = currentUserData.character;
    updates[`/avatars/${currentUserData.id}/x`] = 0;
    updates[`/avatars/${currentUserData.id}/y`] = 0;
    update(ref(database), updates);
}






window.addEventListener("beforeunload", async function (e) {
    let updates = {};
    updates[`/avatars/${currentUserData.id}`] = null;
    update(ref(database), updates)
    return true;
});

