async function getVideoCanvas(drawCallback = () => {}) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");

    canvas.className = "camera";

    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });

    const video = document.createElement('video');

    video.srcObject = videoStream;
    video.play();

    const draw = ms => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const x = (canvas.clientWidth / 2) - (video.videoWidth / 2);
        const y = (canvas.clientHeight / 2) - (video.videoHeight / 2);

        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, x, y, video.videoWidth, video.videoHeight);

        drawCallback(context);

        requestAnimationFrame(draw);
    }

    draw();

    mainContent.appendChild(canvas);
}

function getPixel(context, x, y) {
    return context.getImageData(x, y, 1, 1).data;
}

async function init() {
    let pinX = 0;
    let pinY = 0;
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

    await getVideoCanvas(drawCallback);

    window.addEventListener('pointerdown', e => {
        pinX = e.x;
        pinY = e.y;

        window.dispatchEvent(new Event('pinchange'));
    });

    window.addEventListener('pinchange', e => {
        mainContent.style.setProperty('--pinX', pinX);
        mainContent.style.setProperty('--pinY', pinY);
    });

    window.dispatchEvent(new Event('pinchange'));
}

window.addEventListener('DOMContentLoaded', e => {
    init();
});
