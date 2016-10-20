import * as express from 'express'
import * as http from 'http'
import * as socket from 'socket.io'

import {Setup} from "./server/server/setup"
import {Routes} from "./server/server/routes"

const app = express()
const server = http.createServer(app)
const io = socket(server)

const GOOGLE_CLIENT_ID = "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "F7giEmz6HL9N2ZZ-1GVewAw7"

const db = Setup.setupDatabase()

Setup.setupAuthGoogle(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
Setup.setupExpress(app)
Setup.setupSession(app, io)
Setup.addAuthMiddleware(app)
Setup.addAsMiddleware(app, "db", db)

Routes.addRoutes(app, io)

Setup.startServer(server)