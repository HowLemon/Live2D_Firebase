const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
const videoObj = document.querySelector("#videoElement");
const paramObj = document.querySelector("#params");

// let e = await loadModel("resource/mark_free_Import.model3.json");


if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            videoObj.srcObject = stream;
        })
        .catch(function (err0r) {
            console.log("Something went wrong!", err0r);
        });
}

videoObj.onloadeddata = (ev) => {
    videoObj.play();
    console.log("video started")
    try {
        faceDetection(videoObj);
    } catch (err) {
        console.error("facedetection error: ", err);
    }
}
console.log("model: ", model);

async function faceDetection(video) {
    const faces = await model.estimateFaces({ input: video });
    try {
        //console.log(faces);
        refreshPreviewer(faces[0]);
    } catch (err) {
        // console.error("facedetection error: ", err);
    }

    setTimeout(() => {
        faceDetection(video);
    }, 100);
}

function refreshPreviewer(face) {
    window.lastDetectedFace = face;
    var tip = face.annotations.noseTip[0];
    var leftCorner = face.annotations.noseLeftCorner[0];
    var rightCorner = face.annotations.noseRightCorner[0];

    // var mouseOpenVec = distanceVector(face.mesh[13],face.mesh[14]);
    var mouseOpen = distanceVector(face.mesh[13], face.mesh[14]) / 30 - 0.1;

    var vec1 = [];
    var vec2 = [];

    leftCorner.forEach((el, index) => {
        vec1.push(tip[index] - el);
    });
    rightCorner.forEach((el, index) => {
        vec2.push(tip[index] - el);
    });

    var vect = normalize([[vec1[0] + vec2[0]], [vec1[1] + vec2[1]], [vec1[2] + vec2[2]]]);

    // head tilt
    var angle = - Math.atan2((rightCorner[1] - leftCorner[1]), (rightCorner[0], leftCorner[0]));
    var theta = angle * (180 / Math.PI) * 3;


    vect = vect.map(x => x * 30);

    //eye position
    var iris = face.annotations.leftEyeIris[0];
    var toCCenter = distanceVector(iris, lastDetectedFace.scaledMesh[362]);
    var toCFar = distanceVector(iris, lastDetectedFace.scaledMesh[263]);
    var toUpper = distanceVector(iris, lastDetectedFace.scaledMesh[386]);
    var toLower = distanceVector(iris, lastDetectedFace.scaledMesh[374]);

    var eyeX = (toCCenter / (toCCenter + toCFar)) * 2 - 1;
    var eyeY = (toLower / (toUpper + toLower)) * 2 - 1;

    var eyeBL = distanceVector(lastDetectedFace.scaledMesh[386], lastDetectedFace.scaledMesh[374]) / distanceVector(face.annotations.noseLeftCorner[0], face.annotations.noseRightCorner[0])
    var eyeBR = distanceVector(lastDetectedFace.scaledMesh[159], lastDetectedFace.scaledMesh[145]) / distanceVector(face.annotations.noseLeftCorner[0], face.annotations.noseRightCorner[0])
    var eyeBL = eyeBL * 5 - 0.5;
    var eyeBR = eyeBR * 5 - 0.5;
    // e.character.setMotion(vect[0] * 0.7, - vect[1] * 1.2, theta, 1, mouseOpen);
    // e.character.setEyes(eyeX, eyeY, isblinking(eyeBL), isblinking(eyeBR));

    let motion = {x:vect[0] * 0.7,y: - vect[1] * 1.2,z:theta,mx:1,my:mouseOpen}
    let eyes = {ex:eyeX,ey:eyeY, bl:isblinking(eyeBL), br:isblinking(eyeBR)}
    // console.log(vect[0] * 0.7, - vect[1] * 1.2, theta, 1, mouseOpen)
    // console.log("fuc")
    try{
        globalThis.updateFaceData(motion,eyes)
    }catch(err){
        console.error(err)
    }
    


}


function isblinking(lid) {
    if (lid > 0.4) return 1;
    else return 0;
}


function distanceVector(v1, v2) {
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalize(v) {
    var magn = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (magn == 0) {
        return 0;
    }
    return [[v[0] / magn], [v[1] / magn], [v[2] / magn]];
}

