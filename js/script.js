// declare elements

const videoElement = document.getElementById("video");
const videoContainer = document.getElementById("videoContainer");
const btnAdd = document.getElementById("btnAdd");
const txtName = document.getElementById("txtName");
const nameList = document.getElementById("nameList");
const nameContainer = document.getElementById("nameContainer");
const file = document.getElementById("file");

// declar local variables

let names = [];

btnAdd.addEventListener("click", function() {

    if (txtName.value.length === 0 || file.files.length === 0) {

        alert("Name or file is missing");
        return;
    }

    names.push(txtName.value);

    let s = '';

    names.forEach(name => { s += '<li>' + name + '</li>' });
    nameList.innerHTML = s;

    trainModel();

});

// variable to hold description i.e. training data

let trainingFaces = [];

async function trainModel() {

    let image = await faceapi.bufferToImage(file.files[0]);
    const detectedFace = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();

    trainingFaces.push(detectedFace);

}

// // create video event

videoElement.addEventListener("play", startRecognition);

// // Load face api

Promise.all([
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
]).then(startVideo);

function startVideo() {

    navigator.getUserMedia(
        // constraint
        {
            video: true,
            audio: false
        },
        // success
        function(stream) {
            videoElement.srcObject = stream;
        },

        //error
        function(error) {

            if (error) {
                alert("This app need permission to access video");
            }

        }
    )
}

function startRecognition() {

    let image;
    let canvas;

    setInterval(async function() {

        if (trainingFaces.length === 0) return;

        const faceMatcher = new faceapi.FaceMatcher(trainingFaces, 0.6);

        image = videoElement;
        canvas = faceapi.createCanvasFromMedia(image);

        videoContainer.append(image);
        videoContainer.append(canvas);

        const displaySize = { width: image.width, height: image.height };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi.detectAllFaces(videoElement).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

        let context = canvas.getContext("2d");
        context.clearRect(0, 0, image.width, image.height);

        results.forEach((result, i) => {

            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
            drawBox.draw(canvas);

        })

    }, 100);
}