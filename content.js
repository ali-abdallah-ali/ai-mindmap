const explainMindmapButton = document.createElement('button');
explainMindmapButton.textContent = 'Explain that!';
explainMindmapButton.id = 'mindmap-button';
explainMindmapButton.style.position = 'absolute';
explainMindmapButton.style.display = 'none';
explainMindmapButton.style.zIndex = 1000;
document.body.appendChild(explainMindmapButton);

explainMindmapButton.onclick = () => {
    explainMindmapButton.style.display = 'none';

    mindMapData = null; mindMapDataEmoji = null;
    explainClose.style.display = 'none';
    explainCanvas.style.display = 'none';
    explainReplay.style.display = 'none';

    const selectedText = window.getSelection().toString().trim();
    chrome.runtime.sendMessage({ action: 'genMindmap', msg: selectedText }, (response) => {
        console.log('received user data', response);
    });
};
//////////////////////////
const explainClose = document.createElement('button');
explainClose.textContent = 'Close';
explainClose.id = 'close-button';
explainClose.style.position = 'absolute';
explainClose.style.display = 'none';
explainClose.style.zIndex = 1002;
document.body.appendChild(explainClose);

const explainReplay = document.createElement('button');
explainReplay.textContent = 'Replay';
explainReplay.id = 'replay-button';
explainReplay.style.position = 'absolute';
explainReplay.style.display = 'none';
explainReplay.style.zIndex = 1002;
document.body.appendChild(explainReplay);

const explainCanvas = document.createElement('canvas');
explainCanvas.id = 'mindMapCanvas';
explainCanvas.style.position = 'absolute';
explainCanvas.style.display = 'none';
explainCanvas.style.zIndex = 1001;
explainCanvas.width = 1250;
explainCanvas.height = 750;
document.body.appendChild(explainCanvas);
//////////////////
const explainTooltip = document.createElement('div');
explainTooltip.id = 'mindMapTooltip';
explainTooltip.style.zIndex = 1003;
document.body.appendChild(explainTooltip);


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Response from background.js:" + request.action);

    if (request.action === "genMindmap_res") {
        console.log(request.msg);
        mindMapData = parseJson(request.msg);
        if (mindMapData) {
            explainCanvas.style.display = 'block';
            explainClose.style.display = 'block';
            explainReplay.style.display = 'block';

            startMindmapDraw();
        } else {
            explainMindmapButton.style.display = 'block';
            explainMindmapButton.textContent = 'Error occurred, Retry!';
        }
    } else if (request.action === "genMindmap_err") {
        explainMindmapButton.style.display = 'block';
        explainMindmapButton.textContent = 'Error occurred, Retry!';
    }
});

document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 2) {
        const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();

        let selCenterX = rect.left + (rect.width / 2) + window.scrollX;
        let cx = explainCanvas.width;
        let cy = explainCanvas.height;

        explainMindmapButton.style.left = `${selCenterX}px`;
        explainMindmapButton.style.top = `${rect.bottom + window.scrollY}px`;
        explainMindmapButton.style.display = 'block';
        explainMindmapButton.textContent = 'Explain that!';

        /////////////////////////////////

        explainClose.style.left = `${selCenterX - (cx / 2)}px`;
        explainClose.style.top = `${rect.bottom - (cy / 2) + window.scrollY}px`;
        explainClose.onclick = () => {
            explainClose.style.display = 'none';
            explainCanvas.style.display = 'none';
            explainReplay.style.display = 'none';
        };

        explainReplay.style.left = `${selCenterX + (cx / 2) - 60}px`;
        explainReplay.style.top = `${rect.bottom - (cy / 2) + window.scrollY}px`;

        explainReplay.onclick = () => {
            startMindmapDraw();
        };

        explainCanvas.style.left = `${selCenterX - (cx / 2)}px`;
        explainCanvas.style.top = `${rect.bottom - (cy / 2) + window.scrollY}px`;
    } else {
        explainMindmapButton.style.display = 'none';
    }
});

let mindMapData;

function fixJSONIssues(jsonText) {
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.log("Invalid JSON detected. Attempting to fix...");
        let fixedJSON = jsonText;
        fixedJSON = fixedJSON.replace(/:\s*"([^"}]*)\n/g, ': "$1"');
        try {
            return JSON.parse(fixedJSON);
        } catch (finalError) {
            console.error("Could not completely fix JSON:", finalError.message);
            return null;
        }
    }
}

function parseJson(jsonData) {
    const regex = /{.*}/s;
    const match = jsonData.match(regex);

    if (match) {
        const jsonString = match[0].trim();
        try {
            return fixJSONIssues(jsonString);
        } catch (e) {
            console.log("Invalid JSON:", e);
            return null;
        }
    } else {
        return null;
    }

    return null;
}

function startMindmapDraw() {
    const canvas = document.getElementById('mindMapCanvas');
    const ctx = canvas.getContext('2d');
    const mindMapTooltip = document.getElementById('mindMapTooltip');
    const tooltipcircles = [];
    let globalIndex = 0;
    let aniIndex = 0;
    let aniSpeed = 15;

    function drawCircleWithText(x, y, text, desc, radius = 50, depth = 0) {
        if (globalIndex++ > (aniIndex / aniSpeed)) return;

        const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);

        switch (depth) {
            case 0:
                gradient.addColorStop(0, '#D4E157');
                gradient.addColorStop(1, '#A2C34D');
                break;
            case 1:
                gradient.addColorStop(0, '#FFCC00');
                gradient.addColorStop(1, '#FFAA00');
                break;
            case 2:
                gradient.addColorStop(0, '#FFF107');
                gradient.addColorStop(1, '#FFF800');
                break;
            case 3:
                gradient.addColorStop(0, '#FFD5FF');
                gradient.addColorStop(1, '#FFA7F6');
                break;
            default:
                gradient.addColorStop(0, '#FF9EE7');
                gradient.addColorStop(1, '#FF63D8');
                break;
        }

        ctx.shadowColor = 'rgba(128, 128, 128, 64)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        breakTxt(text).forEach((line, index) => {
            ctx.fillText(line, x, (y - 25) + (index * 12));
        });

        tooltipcircles.push({ x, y, radius, desc });
    }

    function toRad(angle) {
        return angle * (Math.PI / 180);
    }

    function breakTxt(txt) {
        let words = txt.split(' ');//.join('\n');;
        if (words.length > 4) {
            words.splice(4);
        }

        return words;
    }

    function drawMindMapNode(node, x, y, depth = 0, parentAng = -1, parentAngStep = -1) {
        let desc = node.name;
        let sub_ideas;

        if (node.sub_ideas) {
            sub_ideas = node.sub_ideas;
        } else if (node.description && Array.isArray(node.description)) {
            sub_ideas = node.description;
        }

        if (node.description && !Array.isArray(node.description)) {
            desc = node.description;
        }

        drawCircleWithText(x, y, node.name || '', desc, 50, depth);

        const baseXOffset = 150 + ((depth / 2) * 50);
        const baseYOffset = 150;

        if (typeof node === 'object' && sub_ideas) {
            const numSubIdeas = sub_ideas.length;

            let totalAngle = 360;
            let minAng = (totalAngle / numSubIdeas) / 2;
            if (parentAng != -1) {
                minAng = parentAng - (parentAngStep / 2);
                totalAngle = parentAngStep * 2;
            }

            const angleStep = totalAngle / numSubIdeas;

            sub_ideas.forEach((subNode, subIndex) => {
                let angle = (subIndex * angleStep) + minAng;

                const subX = x + (Math.cos(toRad(angle)) * baseXOffset);
                const subY = y + (Math.sin(toRad(angle)) * baseYOffset);

                if (globalIndex++ > (aniIndex / aniSpeed)) return;

                ctx.beginPath();
                ctx.moveTo(x + (Math.cos(toRad(angle)) * 50), y + (Math.sin(toRad(angle)) * 50));
                ctx.lineTo(subX, subY);
                ctx.fillStyle = 'lightblue';
                ctx.strokeStyle = 'black';
                ctx.stroke();

                drawMindMapNode(subNode, subX, subY, depth + 1, angle, angleStep);
            });
        }
    }

    const startX = canvas.width / 2; // center
    const startY = canvas.height / 2;

    function animateDrawing() {
        if (mindMapData) {
            if ((aniIndex < aniSpeed) || ((aniIndex / aniSpeed) < globalIndex)) {
                globalIndex = 0;
                aniIndex++;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'white';
                drawMindMapNode(mindMapData, startX, startY);

                requestAnimationFrame(animateDrawing);
            } else {
                console.log("animation end");
            }
        }
    }

    requestAnimationFrame(animateDrawing);

    canvas.addEventListener('mousemove', function (event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        let foundTooltip = false;

        tooltipcircles.forEach(circle => {
            const dx = mouseX - circle.x;
            const dy = mouseY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < circle.radius) {
                mindMapTooltip.style.left = event.pageX + 10 + 'px';
                mindMapTooltip.style.top = event.pageY + 10 + 'px';
                mindMapTooltip.innerHTML = circle.desc;
                mindMapTooltip.style.display = 'block';
                foundTooltip = true;
            }
        });

        if (!foundTooltip) {
            mindMapTooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseout', function () {
        mindMapTooltip.style.display = 'none';
    });
}

// window.onload = function () {
//     startDraw();
// };
