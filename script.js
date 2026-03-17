const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

navigator.mediaDevices.getUserMedia({ video:true })
.then(stream=>{
    video.srcObject = stream;
});


// =============================
// OpenCV Marker Detection
// =============================
function detectMarker(){

    if(typeof cv === "undefined"){
        requestAnimationFrame(detectMarker);
        return;
    }

    let src = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC4);
    let gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);

    function processVideo(){

        cap.read(src);

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        let edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(edges, contours, hierarchy,
            cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

        ctx.drawImage(video,0,0,640,480);

        for(let i=0;i<contours.size();i++){

            let cnt = contours.get(i);
            let approx = new cv.Mat();

            cv.approxPolyDP(cnt, approx,
                0.02 * cv.arcLength(cnt,true), true);

            if(approx.rows === 4){

                ctx.strokeStyle="lime";
                ctx.lineWidth=3;

                for(let j=0;j<4;j++){

                    let p1 = approx.intPtr(j);
                    let p2 = approx.intPtr((j+1)%4);

                    ctx.beginPath();
                    ctx.moveTo(p1[0],p1[1]);
                    ctx.lineTo(p2[0],p2[1]);
                    ctx.stroke();
                }

                // AR Object
                ctx.fillStyle="red";
                ctx.font="30px Arial";
                ctx.fillText("AR Object",200,200);
            }

            approx.delete();
        }

        requestAnimationFrame(processVideo);
    }

    processVideo();
}

detectMarker();


// =============================
// MediaPipe Hand Tracking
// =============================
const hands = new Hands({
locateFile: file =>
`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
maxNumHands:1,
modelComplexity:1,
minDetectionConfidence:0.7,
minTrackingConfidence:0.7
});

hands.onResults(results=>{

ctx.drawImage(video,0,0,640,480);

if(results.multiHandLandmarks){

for(const landmarks of results.multiHandLandmarks){

for(let i=0;i<landmarks.length;i++){

let x = landmarks[i].x * canvas.width;
let y = landmarks[i].y * canvas.height;

ctx.beginPath();
ctx.arc(x,y,5,0,2*Math.PI);
ctx.fillStyle="yellow";
ctx.fill();
}
}
}
});


const camera = new Camera(video,{
onFrame: async ()=>{
await hands.send({image:video});
},
width:640,
height:480
});

camera.start();