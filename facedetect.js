
// const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh);
const videoObj = document.querySelector("#videoElement");
const paramObj = document.querySelector("#params");


const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

var lastDetectedFace;

const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            document.querySelector("#videoElement").srcObject = stream;
        })
        .catch(function (err0r) {
            console.log("Something went wrong!", err0r);
        });
    videoObj.onloadeddata = async (ev) => {
        videoObj.play();
        console.log("video started")
        try {
            draw();
        } catch (err) {
            console.error("facedetection error: ", err);
        }
    }
}

const stopCamera = () => {
    document.querySelector("#videoElement").srcObject.getTracks()[0].stop()
}

window.startCamera = startCamera;
window.stopCamera = stopCamera;


if (navigator.mediaDevices.getUserMedia) {
    startCamera();
}





async function draw() {
    await faceMesh.send({ image: videoObj });
    requestAnimationFrame(draw);
}

faceMesh.onResults(onResults);

window.faceDetectEnabled = true

function onResults(results) {
    // console.log("hi",results);
    if (results.multiFaceLandmarks) {
        // console.log(results.multiFaceLandmarks[0]);
        if (window.faceDetectEnabled) {
            refreshPreviewer(results.multiFaceLandmarks[0]);
        }
    }
}

// console.log("model: ", model);

window.yScale = 0;
window.yOffset = 0;
window.eyeSmooth = 4;
let eyeBLsmooth = [];
let eyeBRsmooth = [];


function refreshPreviewer(face) {
    // console.log(face);
    if (!face) return;
    if (!lastDetectedFace) {
        window.lastDetectedFace = face;
        lastDetectedFace = face;
    }
    if (eyeBLsmooth.length >= window.eyeSmooth) eyeBLsmooth.shift();
    if (eyeBRsmooth.length >= window.eyeSmooth) eyeBRsmooth.shift();
    // window.lastDetectedFace = face;
    // var tip = face.annotations.noseTip[0];
    // var leftCorner = face.annotations.noseLeftCorner[0];
    // var rightCorner = face.annotations.noseRightCorner[0];
    var tip = face[6]
    var leftCorner = face[50];
    var rightCorner = face[280];

    // var mouseOpenVec = distanceVector(face.mesh[13],face.mesh[14]);
    var mouthOpen = distanceVector(face[13], face[14]) / 30 - 0.1;

    var vec1 = vecDiff(tip, leftCorner);
    var vec2 = vecDiff(tip, rightCorner);

    // var vect = normalize([[vec1[0] + vec2[0]], [vec1[1] + vec2[1]], [vec1[2] + vec2[2]]]);
    var vect = normalize({ x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z });
    // head tilt
    var angle = - Math.atan2((rightCorner.y - leftCorner.y), (rightCorner.x, leftCorner.x));
    var theta = angle * (180 / Math.PI) * 3;


    vect = { x: vect.x * 100, y: vect.y * 300 + 280, z: vect.z * 30 }

    // //eye position
    // var iris = face.annotations.leftEyeIris[0];
    var iris = [474, 475, 476, 477].reduce((prev, curr) => {
        let point = face[curr];
        return { x: prev.x + point.x / 4, y: prev.y + point.y / 4, z: prev.z + point.z / 4 }
    }, { x: 0, y: 0, z: 0 });

    var toCCenter = distanceVector(iris, lastDetectedFace[362]);
    var toCFar = distanceVector(iris, lastDetectedFace[263]);
    var toUpper = distanceVector(iris, lastDetectedFace[386]);
    var toLower = distanceVector(iris, lastDetectedFace[374]);

    var eyeX = (toCCenter / (toCCenter + toCFar)) * 2 - 1;
    var eyeY = (toLower / (toUpper + toLower)) * 2 - 1;

    var eyeBR = (distanceVector(lastDetectedFace[386], lastDetectedFace[374]) / distanceVector(face[129], face[356])) * 25 - 1;
    var eyeBL = (distanceVector(lastDetectedFace[159], lastDetectedFace[145]) / distanceVector(face[129], face[356])) * 25 - 1;
    eyeBRsmooth.push(eyeBR * eyeBR);
    eyeBLsmooth.push(eyeBL * eyeBL);
    // var eyeBL = eyeBL * 5 - 0.5;
    // var eyeBR = eyeBR * 5 - 0.5;
    // e.character.setMotion(vect[0] * 0.7, - vect[1] * 1.2, theta, 1, mouseOpen);
    // e.character.setEyes(eyeX, eyeY, isblinking(eyeBL), isblinking(eyeBR));

    let motion = { x: - vect.x * 0.9, y: - vect.y * 1.4, z: theta, mx: 1, my: mouthOpen * 200 + 20 }
    let eyes = { ex: eyeX, ey: eyeY, bl: arrAverage(eyeBLsmooth) * 1.1, br: arrAverage(eyeBRsmooth) }
    // let eyes = { ex: eyeX, ey: eyeY, bl: isblinking(eyeBL), br: isblinking(eyeBR) }
    // let eyes = { ex: 0, ey: 0, bl: 1, br: 1 }
    // console.log(vect[0] * 0.7, - vect[1] * 1.2, theta, 1, mouseOpen)
    // console.log(motion)
    try {
        globalThis.updateFaceData(motion, eyes)
        // window.overrideStats(eyeBL);
    } catch (err) {
        console.error(err)
    }
    lastDetectedFace = face


}

const arrAverage = arr => arr.reduce((p, c) => p + c, 0) / arr.length;

function vecDiff(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function vedAdd(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}


function isblinking(lid) {
    if (lid > 0.4) return 1;
    else return 0;
}


function distanceVector(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalize(v) {
    var magn = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (magn == 0) {
        return 0;
    }
    return { x: v.x / magn, y: v.y / magn, z: v.z / magn };
}

