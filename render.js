




function PetriNetworkCanvas(Places, Transitions, container) {
    const canvas = document.getElementById(container);
    const ctx = canvas.getContext("2d");
    
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    const radius = 33;
    const spacing = radius * 6;
    let Transitioning = null;
    let stage = null;
    const time_limit = 0.5;
    
    function getTopLeft(i, j) {
        return [3 * radius + i * spacing, 3 * radius + j * spacing];
    }
    function getCenter(i, j) {
        const [x, y] = getTopLeft(i, j);
        return [x + radius, y + radius];
    }

    function getIdx(X, Y) {
        const XinCell = (X - 3 * radius) % spacing;
        const YinCell = (Y - 3 * radius) % spacing;
        if (XinCell > 2 * radius || YinCell > 2 * radius) return [-1, -1];
        return [Math.floor((X - 3 * radius) / spacing), Math.floor((Y - 3 * radius) / spacing)];
    }

    function drawTransition(i, j, name, below) {
        const [x, y] = getTopLeft(i, j);
        ctx.beginPath();
        ctx.rect(x, y, radius * 2, radius * 2);
        ctx.stroke();
        if (below) {
            ctx.fillText(name, x + radius, y + 2.5 * radius);
        }
        else {
            ctx.fillText(name, x + radius, y - 0.2 * radius);
        }
    }

    function drawPlace(i, j, name) {
        const [x, y] = getTopLeft(i, j);
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(name, x + radius, y - 0.2 * radius);
        ctx.fillText(Places[name][2], x + radius, y + radius);
    }

    function drawLineWithArrows(srci, srcj, desi, desj) {

        let [x0, y0] = getCenter(srci, srcj);
        let [x1, y1] = getCenter(desi, desj);

        if (x0 != x1 && y0 != y1) {
            if (y1 > y0) {
                x0 += radius;
                y0 += radius;
                y1 -= radius / Math.SQRT2;
                x1 -= radius / Math.SQRT2;
            }
            if (y1 < y0) {
                x0 += radius / Math.SQRT2;
                y0 -= radius / Math.SQRT2;
                x1 -= radius;
                y1 += radius;
            }
        }
        else {
            if (x0 < x1) {
                x0 += radius;
                x1 -= radius;
            }
            if (x0 > x1) {
                x0 -= radius;
                x1 += radius;
            }
            if (y0 < y1) {
                y0 += radius;
                y1 -= radius;
            }
            if (y0 > y1) {
                y0 -= radius;
                y1 += radius;
            }
        }

        const [aWidth, aLength] = [5, 5];
        var dx=x1-x0;
        var dy=y1-y0;
        var angle=Math.atan2(dy,dx);
        var length=Math.sqrt(dx*dx+dy*dy);
        //
        ctx.translate(x0,y0);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(length,0);

        ctx.moveTo(length-aLength,-aWidth);
        ctx.lineTo(length,0);
        ctx.lineTo(length-aLength,aWidth);

        ctx.stroke();
        ctx.setTransform(1,0,0,1,0,0);
    }
    

  

    function drawPetriNet() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const [name, [i, j]] of Object.entries(Places)) {
            drawPlace(i, j, name);
        }
        for (const [name, [i, j, below_right]] of Object.entries(Transitions)) {
            drawTransition(i, j, name, below_right);
        }

        for (const [name, transition] of Object.entries(Transitions)) {
            for (const src_place of transition[3]) {
                const [srci, srcj] = Places[src_place];
                const [desi, desj] = transition;
                drawLineWithArrows(srci, srcj, desi, desj);
            }
            for (const des_place of transition[4]) {
                const [srci, srcj] = transition;
                const [desi, desj] = Places[des_place];
                drawLineWithArrows(srci, srcj, desi, desj);
            }
        }
    }

    let startTime;
    let moving_tokens = [];
    



    function searchTransition(i, j) {

        function enabledTransition(name) {
            return Transitions[name][3].every(src_place => Places[src_place][2] > 0);
        }

        for (const [name, arr] of Object.entries(Transitions)) {
            if (i === arr[0] && j === arr[1] && enabledTransition(name)) return name;
        }

        return null;
    }


    function drawLoop(timestamp) {
        if (startTime === undefined)
            startTime = timestamp;
        const dtime = (timestamp - startTime) / 1000; 
        
        drawPetriNet();
        update(dtime);
        if (dtime < time_limit) {
            window.requestAnimationFrame(drawLoop);
        }
        else endDraw();
    }


    function update(time) {
        
        for (const coor of moving_tokens) {
            const [x, y] = coor(time);
            ctx.beginPath();

            ctx.ellipse(x, y, radius / 10, radius / 10, 0, 0, 2 * Math.PI);
            ctx.ellipse(x, y, radius / 10, radius / 10, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
        }
        
    }

    function beginDraw() {
        startTime = undefined;
        window.requestAnimationFrame(drawLoop);
    }
    function endDraw() {
        moving_tokens = [];
        if (stage === 1) {
            for (const des_place of Transitions[Transitioning][4]) {
                moving_tokens.push(coorFunction(Transitioning, des_place));
            }
            ++stage;
            beginDraw();
        }
        else {
            for (const des_place of Transitions[Transitioning][4]) {
                Places[des_place][2]++;
            }
            stage = null;
            drawPetriNet();
        }
    
    }

    function coorFunction(from, to) {
        const [fromi, fromj] = Places[from] ? Places[from] : Transitions[from];
        const [toi, toj] = Places[to] ? Places[to] : Transitions[to];
        const [fromX, fromY] = getCenter(fromi, fromj);
        const [toX, toY] = getCenter(toi, toj);
        return t => [(t * toX + (time_limit - t) * fromX) / time_limit, (t * toY + (time_limit - t) * fromY) / time_limit];
        // if (fromi === toi || fromj === toj)
        // return t => [(t * toX + (time_limit - t) * fromX) / time_limit, (t * toY + (time_limit - t) * fromY) / time_limit];
        
        // else if (fromj < toj) {
        //     return t => {
        //         if (t < time_limit / 2) return [fromX, (t * toY + (time_limit / 2 - t) * fromY) / (time_limit / 2)];
        //         else return [((t - time_limit / 2) * toX + (time_limit - t) * fromX) / (time_limit / 2), toY];
        //     }
        // }
        // else if (fromj > toj) {
        //     return t => {
        //         if (t < time_limit / 2) return [(t * toX + (time_limit / 2 - t) * fromX) / (time_limit / 2), fromY];
        //         else return [toX, ((t - time_limit / 2) * toY + (time_limit - t) * fromY) / (time_limit / 2)];
        //     }
        // }
        // else {
        //     console.error('not implemented');
        //     alert('not implemented');
        // }
    }

    canvas.addEventListener('click', ev => {

        if (stage === null) {
            
            function getCursorPosition() {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                return getIdx(x, y);
            }
            const [i, j] = getCursorPosition();
            Transitioning = searchTransition(i, j);
            if (Transitioning) {
                stage = 1;
                for (const src_place of Transitions[Transitioning][3]) {
                    Places[src_place][2]--;
                    moving_tokens.push(coorFunction(src_place, Transitioning));
                }
                beginDraw();
            }
        }
    });

    drawPetriNet();
    this.setToken = function(place, amount) {
        if (stage === null) {
            Places[place][2] = amount;
            drawPetriNet();
        }
    }

    this.reset = function() {
        if (stage === null) {
            for (const place of Object.keys(Places)) {
                Places[place][2] = 0;
            }
            drawPetriNet();
        }
    }

}

const imposedNet = new PetriNetworkCanvas({
    "wait": [0, 1, 5],
    "free": [1, 0, 3],
    "docu": [3, 0, 0],
    "busy": [2, 1, 0],
    "inside": [2, 2, 0],
    "done": [4, 1, 0]
}, {
    "start": [
        1, 1, true, 
        ["free", "wait"], 
        ["busy", "inside"]
    ],
    "end": [
        2, 0, false, 
        ["docu"], 
        ["free"]
    ],
    "change": [
        3, 1, true, 
        ["busy", "inside"], 
        ["docu", "done"]
    ]
}, "imposed");

const patientNet = new PetriNetworkCanvas({
    "wait": [0, 0, 5],
    "inside": [2, 0, 0],
    "done": [4, 0, 0]
}, {
    "start": [
        1, 0, true, 
        ["wait"], 
        ["inside"]
    ],
    "change": [
        3, 0, true, 
        ["inside"], 
        ["done"]
    ]
}, "patient");

const specialistNet = new PetriNetworkCanvas({
    "free": [0, 0, 5],
    "docu": [2, 0, 0],
    "busy": [1, 1, 0],
}, {
    "start": [
        0, 1, true, 
        ["free"], 
        ["busy"]
    ],
    "end": [
        1, 0, false, 
        ["docu"], 
        ["free"]
    ],
    "change": [
        2, 1, true, 
        ["busy"], 
        ["docu"]
    ]
}, "specialist");


document.getElementById("setPatient").onclick = () => patientNet.setToken("wait", parseInt(document.getElementById('patient_amount').value));
document.getElementById("resetPatient").onclick = () => patientNet.reset();

document.getElementById("setSpecialist").onclick = () => specialistNet.setToken("free", parseInt(document.getElementById('specialist_amount').value));
document.getElementById("resetSpecialist").onclick = () => specialistNet.reset();

document.getElementById("setImposed").onclick = () => {
    const [patient, specialist] = document.getElementById('imposed_amount').value.split(',');
    imposedNet.setToken("free", parseInt(specialist));
    imposedNet.setToken("wait", parseInt(patient));
}

document.getElementById("resetImposed").onclick = () => imposedNet.reset();

