$(document).ready(() => {
    $(".manipulate").click(handleData);
});
function handleData() {
    const base = $(this);
    const target = $(base.attr("target"));
    const data = base.attr("attr-data");
    const text = base.attr("text-data");
    if (data && data.length > 0)
        loop(JSON.parse(data), (key, value) => target.attr(key, value));
    if (text && text.length > 0)
        target.text(text);
}
function loop(data, f) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            f(key, data[key]);
        }
    }
}
function fixError(error) {
    if (typeof error == 'string')
        return error;
    else if (error.message)
        return error.message;
    else {
        console.log(error);
        return "An error occured, but it could not be displayed properly. See the console of the browser for more information.";
    }
}
class Dict {
    constructor() {
        this.objs = {};
    }
    put(id, a) {
        this.objs[id] = a;
    }
    get(id) {
        return this.objs[id];
    }
    keys() {
        return this.toArr((key, value) => key);
    }
    values() {
        return this.toArr((key, value) => value);
    }
    toArr(f) {
        const collection = [];
        loop(this.objs, (key, value) => {
            collection.push(f(key, value));
        });
        return collection;
    }
}
class Field {
    constructor(id, name, jq, value) {
        this.id = id;
        this.name = name;
        this.jq = jq;
        this.value = () => value(jq);
        this.value_raw = value;
    }
}
class ModalFormValidator {
    constructor(id, send, receive, multiUse = false) {
        this.validators = [];
        this.fields = new Dict();
        this.openListners = [];
        this.modal = $(id);
        this.sendId = send;
        this.errorMessage = this.modal.find(".errors");
        this.errorContainer = this.modal.find(".errorContainer");
        this.modal.find(".modal-run").click(() => this.run());
        this.modal.on("show.bs.modal", () => this.modalOpened(multiUse));
        socket.on(receive, (success, error) => this.response(success, error));
    }
    response(success, error) {
        if (success)
            location.reload();
        else {
            this.showError();
            this.clearError();
            this.addError(fixError(error));
        }
    }
    modalOpened(multiUse) {
        console.log("openend");
        if (multiUse) {
            this.clearError();
            this.hideError();
        }
        const instance = this;
        this.openListners.forEach(l => l(instance));
    }
    onOpen(f) {
        this.openListners.push(f);
    }
    copyFrom(other, id) {
        loop(other.fields.objs, (key, value) => {
            this.registerField(key, value.name, "#" + id + value.id.substr(1), value.value_raw);
        });
        for (let val of other.validators) {
            this.addValidation(val.f, ...val.targets);
        }
    }
    run() {
        const errors = [];
        loop(this.fields.objs, (key, value) => {
            console.log(key, value);
            value.jq.parent().removeClass("has-error");
        });
        for (let val of this.validators) {
            const error = this.validate(val);
            if (error.length > 0)
                errors.push(error);
        }
        if (errors.length > 0) {
            this.clearError();
            this.showError();
            errors.forEach((e) => this.addError(e));
        }
        else {
            this.hideError();
            socket.emit(this.sendId, ...this.fields.values().map(f => f.value()));
        }
    }
    clearError() {
        this.errorMessage.html("");
    }
    showError() {
        this.errorContainer.removeClass("hidden");
    }
    hideError() {
        this.errorContainer.addClass("hidden");
    }
    addError(error) {
        const li = document.createElement("li");
        li.innerText = error;
        this.errorMessage.append(li);
    }
    setTextValue(field, value) {
        this.getJq(field).text(value);
    }
    setValue(field, value) {
        this.getJq(field).val(value);
    }
    getValue(field) {
        return this.actField(field, f => f.value());
    }
    getName(field) {
        return this.actField(field, f => f.name);
    }
    getJq(field) {
        return this.actField(field, f => f.jq);
    }
    actField(field, f) {
        const val = this.fields.get(field);
        if (val)
            return f(val);
        else
            "";
    }
    validate(val) {
        const targets = val.targets.map(t => this.fields.get(t));
        const error = val.f(...targets);
        if (error.length > 0)
            targets.forEach(t => t.jq.parent().addClass("has-error"));
        return error;
    }
    registerField(shortHand, name, id, value) {
        this.fields.put(shortHand, new Field(id, name, this.modal.find(id), value));
    }
    addValidation(f, ...ids) {
        this.validators.push({ targets: ids, f: f });
    }
}
var ModalValues;
(function (ModalValues) {
    function value(target) {
        return target.val();
    }
    ModalValues.value = value;
    function attr(atr) {
        return (target) => target.attr(atr);
    }
    ModalValues.attr = attr;
    function date(target) {
        return target.parent().datepicker("getDate");
    }
    ModalValues.date = date;
})(ModalValues || (ModalValues = {}));
var ModalValidators;
(function (ModalValidators) {
    function atLeast(length) {
        return field => {
            const value = field.value();
            if (value.length >= length)
                return "";
            else
                return "The " + field.name + " must be at least " + length.toString() + " characters long!";
        };
    }
    ModalValidators.atLeast = atLeast;
    function exists() {
        return field => {
            if (!field.value())
                return "The " + field.name + " format is incorrect!";
            else
                return "";
        };
    }
    ModalValidators.exists = exists;
    function dateOrder() {
        return (start, end) => {
            const startDate = start.value();
            const endDate = end.value();
            if (!!startDate && !!endDate && startDate >= endDate)
                return "The " + start.name + " has to be before the " + end.name + "!";
            else
                return "";
        };
    }
    ModalValidators.dateOrder = dateOrder;
})(ModalValidators || (ModalValidators = {}));
$(".date").datepicker().on('show.bs.modal', (event) => event.stopPropagation());
