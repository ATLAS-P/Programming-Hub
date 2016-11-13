import {Future} from "../functional/Future"
import {Result, Test} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"
import {Either, Left, Right} from "../functional/Either"
import {Config} from '../server/Config'

import * as stream from "stream";
import * as process from 'child_process'

const BREAK = Config.grader.break

namespace Input {
    export function simpleIn<In>(stdin: stream.Writable, inn: In, running: () => boolean) {
        stdin.write(inn)
        stdin.end()
    }

    export function listIn<In>(stdin: stream.Writable, inn: List<In>, running: () => boolean) {
        List.forall(inn, s => stdin.write(s + BREAK))
        stdin.end()
    }

    export function withDelay<In>(stdin: stream.Writable, inn: List<Tuple<In, number>>, running: () => boolean) {
        if (inn.length() == 0) stdin.end()
        else {
            const tup = inn.head(null)
            setTimeout(() => {
                if (running() && stdin.writable && tup) {
                    stdin.write(tup._1 + BREAK)
                    withDelay(stdin, inn.tail(), running)
                }
            }, tup ? tup._2 : 0)
        }
    }
}

namespace Output {
    export function simpleOut(out: string, data: string, stdin: stream.Writable): string {
        return out + data.replace(/\r?\n|\r/g, "")
    }

    export function listOut(out: List<string>, data: string, stdin: stream.Writable): List<string> {
        return out.add(data.replace(/\r?\n|\r/g, ""))
    }

    //NOTE output might need to be reversed, so List.apply ..... append out, also create a multiIOasList    
    export function breakToList(out: List<string>, data: string, stdin: stream.Writable): List<string> {
        return out.append(List.apply(data.split(/\r?\n|\r/)))
    }
}

export namespace Runners {
    export type Spawn<In, Out> = (filename: string) => IOMap.IO<In, Either<Out, string>>

    export function pythonSpawner<In, A, Out>(z: A, onData: (out: A, data: string, stdin: stream.Writable) => A, putInput: (stdin: stream.Writable, inn: In, running: () => boolean) => void | A, finalizeOutput: (a: A) => Out = ((a: A) => a as any as Out)): Spawn<In, Out> {
        return (filename: string) => (s: In) => new Future<Either<Out, string>>((resolve, reject) => {
            let running = true
            let py = process.spawn(Config.grader.lang.python, ['uploads/' + filename])
            let output = z
            let inputError = null 

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = onData(output, buff.toString("utf8"), py.stdin)
            });

            py.stderr.on('data', function (err) {
                running = false
                if (py.stdin.writable) py.stdin.end()
                var buff = new Buffer(err as Buffer)
                resolve(new Right(buff.toString("utf8")))
            });

            py.on('close', function () {
                running = false
                if (inputError) resolve(new Right("There seems to be something wrong with your inputs and outputs, make sure there are no unnecessary print statements!"))
                else if (!output) resolve(new Right("No output received!"))
                else resolve(new Left(finalizeOutput(output)))
            });

            py.stdin.on('error', function (err) {
                inputError = err
            });

            //check if possible as inline
            function isRunning(): boolean {
                return running
            }

            const inDone = putInput(py.stdin, s, isRunning)
            if (inDone) output = inDone as A

            setTimeout(function () {
                if (running) {
                    running = false
                    py.kill()
                    resolve(new Right("Max runtime of 5s exeeded!"))
                }
            }, 5000)
        })
    }

    export namespace PythonRunners {
        export const multiIO = pythonSpawner(List.apply([]), Output.listOut, Input.listIn)
        export const simpleIO = pythonSpawner("", Output.simpleOut, Input.simpleIn)
        export const listInSimpleOut = pythonSpawner("", Output.simpleOut, Input.listIn)
        export const simpleIOasList = pythonSpawner(List.apply([]), Output.breakToList, Input.simpleIn)
        export const sleepIO = pythonSpawner(List.apply([]), Output.listOut, Input.withDelay)
    }

    //also in miniprojects, so put in some math module, or str module etc..
    function getFirstNumber(s: string, z: number): number {
        const reg = /^\D*(\d+(?:\.\d+)?)/g
        const match = reg.exec(s)
        if (!match) return z
        else return Number(match[1])
    }
}