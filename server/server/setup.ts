import {Users} from '../database/tables/Users'

import * as http from "http"
import * as express from "express"
import * as path from 'path'
import * as stylus from 'stylus'
import * as mongoose from 'mongoose'
import * as socket from 'socket.io'
import * as bodyParser from 'body-parser'
import * as session from 'express-session'
import * as passport from 'passport'

//no typings available for this one :(
const authGoogle = require('passport-google-oauth2')

export namespace Setup {
    export function startServer(server: http.Server) {
        server.listen(3000)
    }

    export function setupExpress(app: express.Express) {
        const viewsDir = path.join(__dirname, 'views')
        const publicDir = path.join(__dirname, 'public')

        app.set('view engine', 'jade')
        app.set('views', viewsDir)
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(bodyParser.json())
        app.use(stylus.middleware(publicDir))
        app.use(express.static(publicDir))
    }

    export function setupSession(app: express.Express, io: SocketIO.Server) {
        const sessionMiddle = session({
            resave: false,
            saveUninitialized: true,
            secret: 'Pssssst, keep it a secret!'
        })

        io.use((socket, next) => sessionMiddle(socket.request, socket.request.res, next))
        app.use(sessionMiddle)
    }

    export function setupDatabase(): mongoose.Connection {
        mongoose.connect("mongodb://ds033986.mlab.com:33986/autograder", { user: "rikmuld", pass: "atlaspass" })//user pass.. and secret
        var db = mongoose.connection

        db.on('error', console.error.bind(console, 'connection error:'))
        db.once('open', function (callback) {
            console.log("Connected to database")
        })

        return db
    }

    export function setupAuthGoogle(googleID: string, googleSecret: string) {
        const googleLogin = {
            clientID: googleID,
            clientSecret: googleSecret,
            callbackURL: "http://localhost:3000/auth/google/callback",
            passReqToCallback: true
        }

        const handleLogin = (request, accessToken, refreshToken, profile: Users.GoogleProfile, done) => {
            process.nextTick(() => {
                if (profile._json.domain == "student.utwente.nl") {
                    Users.getByGProfile(profile, u => done(null, u.id), e => done(null, null))
                } else done(null, null)
            })
        }

        passport.serializeUser((userID: string, done) => done(null, userID))
        passport.deserializeUser((userID, done) => done(null, userID))
        passport.use(new authGoogle.Strategy(googleLogin, handleLogin))
    }

    export function addAuthMiddleware(app: express.Express) {
        app.use(passport.initialize())
        app.use(passport.session())
    }

    export function addAsMiddleware(app: express.Express, name:string, data) {
        app.use((req: express.Request, res: express.Response, next) => {
            req[name] = data
            next()
        })
    }
}