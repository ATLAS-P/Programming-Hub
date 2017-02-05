$(document).ready(() => {
    $(".manipulate").click(handleData)
})

function handleData() {
    const base = $(this)
    const target = $(base.attr("target"))

    const data = base.attr("attr-data")
    const text = base.attr("text-data")

    if(data && data.length > 0) loop(JSON.parse(data), (key, value) => target.attr(key, value))
    if(text && text.length > 0) target.text(text)
}

function loop(data: {}, f:(key, value) => void) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            f(key, data[key])
        }
    }
}

function fixError(error: any): string {
    if (typeof error == 'string') return error
    else if (error.message) return error.message
    else {
        console.log(error)
        return "An error occured, but it could not be displayed properly. See the console of the browser for more information."
    }
}

class Dict<A> {
    objs: {} = {}

    put(id: string, a: A) {
        this.objs[id] = a
    }

    get(id: string): A {
        return this.objs[id]
    }

    keys(): A[] {
        return this.toArr((key, value) => key)
    }

    values(): A[] {
        return this.toArr((key, value) => value)
    }

    toArr<B>(f:(key, value) => B):B[] {
        const collection = []
        loop(this.objs, (key, value) => {
            collection.push(f(key, value))
        })
        return collection
    }
}

//this way values are calculated way to often, just lazy and reset when renew
class Field {
    name: string
    id: string
    value: () => any
    value_raw: (jq:any) => any
    jq: any

    constructor(id: string, name: string, jq: any, value: (jq: any) => any) {
        this.id = id
        this.name = name
        this.jq = jq

        this.value = () => value(jq)
        this.value_raw = value
    }
}

type Validator = {
    targets: string[],
    f: (...Field: any[]) => string
}

class ModalFormValidator {
    private sendId: string

    private validators: Validator[] = []
    private fields: Dict<Field> = new Dict<Field>()
    private openListners: ((m: ModalFormValidator) => void)[] = []

    private modal: any
    private errorMessage: any
    private errorContainer: any

    constructor(id: string, send: string, receive: string, multiUse: boolean = false) {
        this.modal = $(id)
        this.sendId = send

        this.errorMessage = this.modal.find(".errors")
        this.errorContainer = this.modal.find(".errorContainer")

        this.modal.find(".modal-run").click(() => this.run())
        this.modal.on("show.bs.modal", () => this.modalOpened(multiUse))
        socket.on(receive, (success, error) => this.response(success, error))
    }

    private response(success: boolean, error?: any) {
        if (success) location.reload()
        else {
            this.showError()
            this.clearError()
            this.addError(fixError(error))
        }
    }

    private modalOpened(multiUse: boolean) {
        console.log("openend")
        if (multiUse) {
            this.clearError()
            this.hideError()
        }

        const instance = this
        this.openListners.forEach(l => l(instance))
    }

    onOpen(f: (m: ModalFormValidator) => void) {
        this.openListners.push(f)
    }

    copyFrom(other: ModalFormValidator, id: string) {
        loop(other.fields.objs, (key, value: Field) => {
            this.registerField(key, value.name, "#" + id + value.id.substr(1), value.value_raw)
        })

        for (let val of other.validators) {
            this.addValidation(val.f, ...val.targets)
        }
    }

    run() {
        const errors = []

        loop(this.fields.objs, (key, value: Field) => {
            console.log(key, value)
            value.jq.parent().removeClass("has-error")
        })

        for (let val of this.validators) {
            const error = this.validate(val)
            if (error.length > 0) errors.push(error)
        }

        if (errors.length > 0) {
            this.clearError()
            this.showError()

            errors.forEach((e) => this.addError(e))
        } else {
            this.hideError()
            socket.emit(this.sendId, ...this.fields.values().map(f => f.value()))
        }
    }

    clearError() {
        this.errorMessage.html("")
    }

    showError() {
        this.errorContainer.removeClass("hidden")
    }

    hideError() {
        this.errorContainer.addClass("hidden")
    }

    addError(error: string) {
        const li = document.createElement("li")
        li.innerText = error
        this.errorMessage.append(li)
    }

    setTextValue(field: string, value: string) {
        this.getJq(field).text(value)
    }

    setValue(field: string, value: string) {
        this.getJq(field).val(value)
    }

    getValue(field: string): string {
        return this.actField(field, f => f.value())
    }

    getName(field: string): string {
        return this.actField(field, f => f.name)
    }

    getJq(field: string): any {
        return this.actField(field, f => f.jq)
    }

    private actField(field: string, f: (field: Field) => string): string {
        const val = this.fields.get(field)

        if (val) return f(val)
        else ""
    }

    private validate(val: Validator): string {
        const targets = val.targets.map(t => this.fields.get(t))
        const error = val.f(...targets)

        if (error.length > 0) targets.forEach(t => t.jq.parent().addClass("has-error"))
        return error
    }

    registerField(shortHand:string, name: string, id: string, value: (jq) => any) {
        this.fields.put(shortHand, new Field(id, name, this.modal.find(id), value))
    }

    addValidation(f: (...fields: Field[]) => string, ...ids: string[]) {
        this.validators.push({ targets: ids, f: f})
    }
}

namespace ModalValues {
    export function value(target): string {
        return target.val()
    }

    export function attr(atr: string): (target: any) => string {
        return (target) => target.attr(atr)
    }

    export function date(target): Date {
        return target.parent().datepicker("getDate") as Date
    }
}

namespace ModalValidators {
    export function atLeast(length: number): (...field: Field[]) => string {
        return field => {
            const value = field.value()

            if (value.length >= length) return ""
            else return "The " + field.name + " must be at least " + length.toString() + " characters long!"
        }
    }

    export function exists(): (...field: Field[]) => string {
        return field => {
            if (!field.value()) return "The " + field.name + " format is incorrect!"
            else return ""
        }
    }

    export function dateOrder(): (...field: Field[]) => string {
        return (start, end) => {
            const startDate = start.value()
            const endDate = end.value()

            if (!!startDate && !!endDate && startDate >= endDate)
                return "The " + start.name + " has to be before the " + end.name + "!"
            else return ""
        }
    }
}

$(".date").datepicker().on('show.bs.modal', (event) => event.stopPropagation())