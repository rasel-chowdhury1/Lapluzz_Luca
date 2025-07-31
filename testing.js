const ws = new WebSocket("wss://anygold.com.my/goldbackend/");
console.log(ws.onerror = console.error)
ws.onerror = console.error;