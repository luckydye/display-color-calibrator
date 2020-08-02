const DEBUG = (location.hash == "#debug");

async function getVideoCanvas(drawCallback = () => {}) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");

    canvas.className = "camera";

    const devices = await navigator.mediaDevices.enumerateDevices();

    let avalableDevices = [];
    let cameraIndex = 1;
    let currentDevice = null;

    for(let device of devices) {
        if(device.kind == "videoinput") {
            avalableDevices.push(device);
        }
    }

    const video = document.createElement('video');

    async function setCamera(index) {
        currentDevice = avalableDevices[index];

        if(DEBUG) {
            debug.innerText = JSON.stringify(currentDevice.getCapabilities(), null, '  ');
        }

        if(currentDevice) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: {exact: currentDevice.deviceId}
                }
            }).then(stream => {
                video.srcObject = stream;
                video.play();
            }).catch(err => {
                console.log(err);
                setCamera(cameraIndex++);
            })

        } else {
            console.error('No device found');
        }
    }

    setCamera(cameraIndex);

    const draw = ms => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const ar = video.videoWidth / video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.width / ar);

        drawCallback(context);

        requestAnimationFrame(draw);
    }

    draw();

    mainContent.appendChild(canvas);

    let camToggle = false;

    return {
        canvas,
        toggleCamera() {
            camToggle = !camToggle;

            if(camToggle) {
                cameraIndex--;
            } else {
                cameraIndex++;
            }

            setCamera(cameraIndex);
        }
    }
}

function getPixel(context, x, y) {
    return context.getImageData(x, y, 1, 1).data;
}

async function init() {
    window.scrollTo(0,1);

    let pinX = window.innerWidth / 2;
    let pinY = window.innerHeight / 2;
    let pinColor = "rgba(255, 255, 255, 255)";

    const drawCallback = (context) => {
        const pixel = getPixel(context, pinX, pinY);

        colorRed.innerText = pixel[0];
        colorGreen.innerText = pixel[1];
        colorBlue.innerText = pixel[2];

        colorRed.innerText = pixel[0];
        colorGreen.innerText = pixel[1];
        colorBlue.innerText = pixel[2];

        mainContent.style.setProperty('--colorRed', (pixel[0] * pixel[0]) / 255);
        mainContent.style.setProperty('--colorGreen', (pixel[1] * pixel[1]) / 255);
        mainContent.style.setProperty('--colorBlue', (pixel[2] * pixel[2]) / 255);

        pinColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;
        mainContent.style.setProperty('--pinColor', pinColor);
    }

    const { canvas, toggleCamera } = await getVideoCanvas(drawCallback);

    canvas.addEventListener('pointerdown', e => {
        pinX = e.x;
        pinY = e.y;

        window.dispatchEvent(new Event('pinchange'));
    });

    window.addEventListener('pinchange', e => {
        mainContent.style.setProperty('--pinX', pinX);
        mainContent.style.setProperty('--pinY', pinY);
    });

    window.dispatchEvent(new Event('pinchange'));

    document.querySelector('.camera-toggle').addEventListener('click', function (e) {
        toggleCamera();
        e.preventDefault();
        e.stopPropagation();
    })
}

window.addEventListener('DOMContentLoaded', e => {
    init();
});
