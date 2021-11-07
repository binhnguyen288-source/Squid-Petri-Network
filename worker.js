

importScripts('./PetriNet.js');
onmessage = ev => {
    const [msg, args] = JSON.parse(ev.data);
    
    Module['onRuntimeInitialized'] = () => {
        if (msg === 'find') {
            const count = Module.ccall("countReachable", 'string', ['number', 'number', 'number', 'number', 'number', 'number'], args);
            if (count.length >= 4) {
                postMessage(JSON.stringify(["error", count]));
                return;
            }
            postMessage(JSON.stringify(["success", Module.ccall("findReachable", 'string', ['number', 'number', 'number', 'number', 'number', 'number'], args)]));
        }
        if (msg === 'count') {
            postMessage(Module.ccall("countReachable", 'string', ['number', 'number', 'number', 'number', 'number', 'number'], args));
        }
    };
}