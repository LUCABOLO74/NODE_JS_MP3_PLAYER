const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '192.168.31.54';  // Indirizzo IP del computer nella rete locale
const port = 3000;
let track_list = [];

function initializeTrackList(callback) {
    const mp3FolderPath = path.join(__dirname, 'mp3');
    const defaultImage = "https://via.placeholder.com/250";

    fs.readdir(mp3FolderPath, (err, files) => {
        if (err) {
            console.error('Unable to scan directory: ' + err);
            return;
        }

        track_list = files
            .filter(file => path.extname(file).toLowerCase() === '.mp3')
            .map(file => ({
                name: path.basename(file, '.mp3'),
                artist: path.basename(file, '.mp3'),
                image: defaultImage,
                path: encodeURIComponent(path.join('/mp3', file))
            }));

        console.log("Discovered Track List:", track_list);
        if (callback) callback();
    });
}

// Inizializza la lista delle tracce e avvia il server solo dopo che la lista è pronta
initializeTrackList(() => {
    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://miosito.com');
        console.log("Server richiesto:", req.url);

        if (req.url === '/') {
            fs.readFile('./indexmp3.html', (err, data) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('500: Internal Server Error');
                    return;
                }
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            });
        } else if (req.url.startsWith('/mp3/')) {
            const filePath = path.join(__dirname, decodeURIComponent(req.url));
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('404: File Not Found');
                    return;
                }
                res.setHeader('Content-Type', 'audio/mpeg');
                res.end(data);
            });
        } else if (req.url === '/mp3-list') {
            console.log("Richiesta lista brani ricevuta");
            console.log("Track List:", track_list);  // Log della lista dei brani
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(track_list));
        } else {
            fs.readFile('.' + req.url, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('404: File Not Found');
                    return;
                }
                res.end(data);
            });
        }
    });

    server.listen(port, hostname, () => {
        console.log(`Server listening on http://${hostname}:${port}`);
    });
});
