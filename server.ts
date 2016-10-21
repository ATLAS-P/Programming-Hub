﻿import * as express from 'express'
import * as http from 'http'
import * as socket from 'socket.io'

import {Setup} from "./server/server/Setup"
import {Routes, Sockets} from "./server/server/Routes"
import {Config} from "./server/server/Config"

const app = express()
const server = http.createServer(app)
const io = socket(server)

const GOOGLE_CLIENT_ID = Config.auth.id
const GOOGLE_CLIENT_SECRET = Config.auth.key

const db = Setup.setupDatabase(Config.db.address, Config.db.port, Config.db.db, Config.db.user.name, Config.db.user.password)

Setup.setupAuthGoogle(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
Setup.setupExpress(app, __dirname)
Setup.setupSession(app, io)
Setup.addAuthMiddleware(app)
Setup.addAsMiddleware(app, "db", db)

Routes.addRoutes(app, __dirname)
Sockets.bindHandlers(app, io)

Setup.startServer(server)