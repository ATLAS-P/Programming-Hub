var py = require('python-shell')

var server = require('./server')
var grader = require('./Autograder')
var miniprojects = require('./miniprojects')

var fs = require('fs');

var app = server.app
var io = server.io

app.get('/result', function (req, res) {
    res.render('result', {success: true, tests: 10, pass: 10, failed: [1, 2, 3, 4]})
})

app.get('/?', function (req, res) {
    res.render('grader')
})

app.post('/file-upload', function (req, res) {
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);

        let filepath = __dirname + '/uploads/' + filename
        let fstream = fs.createWriteStream(filepath);

        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Upload Finished of " + filename);
            
            let script = (s:string) => new Promise<string>((resolve, reject) => {
                var shell = new py("uploads/" + filename, { mode: 'text', pythonPath: 'C:/Python35/python3.exe' });
                shell.send(s)
                shell.on('message', function (message: string) {
                    if (message.endsWith("\r")) resolve(message.substring(0, message.length - 1))
                    else resolve(message)
                });
                shell.on('error', function (err) {
                    reject()
                });
            })

            grader.gradeInIsOut(script, function (r) {
                res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: r.getFailed? r.getFailed() : [] })
            }, (err: string) => res.json({ success: false, err: err }))
        });
    });
})

io.on('connection', function (socket) {
    socket.on('getMiniprojects', function () {
        const projects = miniprojects.getAll((projects) =>
            app.render("miniprojects", { miniprojects: projects }, function (err, html) {
                if (err) socket.emit('setMiniprojects', { success: false, err: err.toString() })
                else socket.emit('setMiniprojects', { success: true, html: html })
            }), (err) => 
                socket.emit('setMiniprojects', { success: false, err: err})
            )
    })
})