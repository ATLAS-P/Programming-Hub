import {Users} from '../database/tables/Users'
import {Config} from './Config'

import * as http from "http"
import * as express from "express"
import * as path from 'path'
import * as stylus from 'stylus'
import * as mongoose from 'mongoose'
import * as socket from 'socket.io'
import * as bodyParser from 'body-parser'
import * as session from 'express-session'
import * as passport from 'passport'
import * as redis from "redis"
import * as redisConnect from "connect-redis"
import * as azure from 'azure-storage'

const authGoogle = require('passport-google-oauth2')
const busboy = require('connect-busboy')

const useRedis = Config.session.redis
const redisStore = useRedis ? redisConnect(session):null
const redisClient = useRedis ? redis.createClient():null

export namespace Setup {
    export function startServer(server: http.Server) {
        server.listen(3000)
    }

    export function setupExpress(app: express.Express, root:string) {
        const viewsDir = path.join(root, 'views')
        const publicDir = path.join(root, 'public')

        app.set('view engine', 'jade')
        app.set('views', viewsDir)
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(bodyParser.json())
        app.use(stylus.middleware(publicDir))
        app.use(express.static(publicDir))
        app.use(busboy())
    }

    export function setupSession(app: express.Express, io: SocketIO.Server) {
        const sessionData = {
            resave: false,
            saveUninitialized: false,
            secret: Config.session.secret
        }
        if (useRedis) {
            sessionData['store'] = new redisStore({
                host: 'localhost',
                port: 6379,
                client: redisClient,
                ttl: 86400
            })
        }

        const sessionMiddle = session(sessionData)
        io.use((socket, next) => sessionMiddle(socket.request, socket.request.res, next))
        app.use(sessionMiddle)
    }
    export function setupDatabase(address:string, port:number, database:string, user:string, password:string): mongoose.Connection {
        mongoose.connect("mongodb://" + address + ":" + port + "/" + database, { user: user, pass: password })
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
            callbackURL: "http://" + Config.auth.callback + "/auth/google/callback",
            passReqToCallback: true
        }

        const handleLogin = (request: express.Request, accessToken, refreshToken, profile: Users.GoogleProfile, done) => {
            process.nextTick(() => {
                if (profile._json.domain == "student.utwente.nl" || profile.email == "ruudvandamme55@gmail.com" || profile.email == "rikmuld@gmail.com") {
                    Users.getByGProfile(profile).then(u => done(null, Users.simplify(u)), e => done(null, null))
                } else {
                    done(null, null)
                    process.nextTick(() => {
                        request.logout()  
                    })
                }
            })
        }

        passport.serializeUser((user, done) => done(null, user))
        passport.deserializeUser((user, done) => done(null, user))
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

    export function connectFileService(name:string, key:string): azure.FileService {
        return azure.createFileService(name, key)
    }
}