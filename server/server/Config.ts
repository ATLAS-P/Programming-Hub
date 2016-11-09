namespace Users {
    export const rikmuld = {
        name: "rikmuld",
        password: "atlaspass"
    }
}

export namespace Config {
    export const auth = {
        id: "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com",
        key: "F7giEmz6HL9N2ZZ-1GVewAw7",
        callback: "localhost:3000"
    }

    export const db = {
        address: "ds033986.mlab.com",
        port: 33986,
        db: "autograder",
        user: Users.rikmuld
    }

    export const grader = {
        break: "\r\n",
        lang: {
            python: "python"
        }
    }

    export const session = {
        redis: false,
        secret: "Psssst! Keep it a secret!"
    }
}