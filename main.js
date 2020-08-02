const DEBUG = (location.hash == "#debug");

function debugLine(str) {
    if(DEBUG) {
        debug.innerHTML += str;
    }
    debug.scrollTo(0, debug.scrollHeight);
}

async function getVideoCanvas() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");

    canvas.className = "camera";

    const devices = await navigator.mediaDevices.enumerateDevices();

    let avalableDevices = [];
    let cameraIndex = 1;
    let currentDevice = null;
    let camToggle = false;

    for(let device of devices) {
        if(device.kind == "videoinput") {
            console.log(device);
            avalableDevices.push(device);
        }
    }

    const video = document.createElement('video');

    async function setCamera(index) {
        currentDevice = avalableDevices[index];

        if(camToggle) {
            debugLine(JSON.stringify(currentDevice.getCapabilities(), null, '  '));
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
            debugLine("<b>No device found</b>");
        }
    }

    setCamera(cameraIndex);

    const draw = ms => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const ar = video.videoWidth / video.videoHeight;

        const y = (canvas.height / 2) - (video.videoHeight / 2);

        context.drawImage(video, 0, y, canvas.width, canvas.width / ar);

        requestAnimationFrame(draw);
    }

    draw();

    mainContent.appendChild(canvas);

    return {
        context,
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
    let pinX = window.innerWidth / 2;
    let pinY = window.innerHeight / 2;
    let pinColor = "rgba(255, 255, 255, 255)";

    const { canvas, context, toggleCamera } = await getVideoCanvas();
    
    const updateColor = () => {
        const pixel = getPixel(context, pinX, pinY);

        colorRed.innerText = pixel[0];
        colorGreen.innerText = pixel[1];
        colorBlue.innerText = pixel[2];

        mainContent.style.setProperty('--colorRed', (pixel[0] * pixel[0]) / 255);
        mainContent.style.setProperty('--colorGreen', (pixel[1] * pixel[1]) / 255);
        mainContent.style.setProperty('--colorBlue', (pixel[2] * pixel[2]) / 255);

        pinColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;
        mainContent.style.setProperty('--pinColor', pinColor);
    }

    setInterval(() => updateColor(), 1000 / 15);

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

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
            debugLine(`<b>ServiceWorker registration failed</b> ${err.message}`);
        });
    }
}

window.addEventListener('DOMContentLoaded', e => {
    init();
});
