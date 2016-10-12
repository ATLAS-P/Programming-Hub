var py = require('python-shell')

var server = require('./server')
var grader = require('./Autograder')
import * as miniprojects from './miniprojects'
import * as students from './students'

var fs = require('fs');

var app = server.app
var io = server.io

var passport = require('passport')

app.get('/result', function (req, res) {
    res.render('result', {success: true, tests: 10, pass: 10, failed: [1, 2, 3, 4]})
})

app.get('/', function (req, res) {
    res.render('grader', { user: req.user,  })
})

//cleanup below
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
                var shell = new py("uploads/" + filename, { mode: 'text', pythonPath: 'C:/Python35/python3.exe' }); //make this a variable outside of code
                shell.send(s)
                shell.on('message', function (message: string) {
                    if (message.endsWith("\r")) resolve(message.substring(0, message.length - 1))
                    else resolve(message)
                });
                shell.on('error', function (err) {
                    reject()
                });
            })

            grader.gradeIOEcho(script, function (r) {
                res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: r.getFailed? r.getFailed() : [] })
            }, (err: string) => res.json({ success: false, err: err }))
        });
    });
})

app.get('/auth/google', passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/plus.profile.emails.read']
}));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/'
    }));

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

io.on('connection', function (socket) {
    socket.on('getMiniprojects', function () {
        if (socket.request.session.passport) {
            students.getSimpleGroups(socket.request.session.passport.user.email, function (projects) {
                console.log(projects)
                app.render("miniprojects", { groups: projects }, function (err, html) {
                    if (err) socket.emit('setMiniprojects', { success: false, err: err.toString() })
                    else socket.emit('setMiniprojects', { success: true, html: html })
                }), (err) =>
                        socket.emit('setMiniprojects', { success: false, err: err })
            }, (err) => console.log(err))
        }
    })
})