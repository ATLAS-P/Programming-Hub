declare var Dropzone
let zone

const noPyhon = 'Please only use python files!'

let lastExtension = ""

Dropzone.options.zonemini = {
    createImageThumbnails: false,
    parallelUploads: 1,
    maxFilesize: 1,
    accept: (file, accept) => canAcceptFile(file, accept),
    init: dropzoneInit,
    success: (file, response) => fileGraded(file, response),
    error: fileError
}

function dropzoneInit() {
    zone = this
    zone.on("addedfile", fileAdded);
    zone.on("sending", sending);
}

function canAcceptFile(file, accept) {
    if (!isPython(file) && projectType == "auto_code") {
        zone.removeFile(file)
        Group.showErrorNoPython(true, noPyhon)
    } else accept()
}

function sending(file, xhr, formData) {
    formData.append("project", project)
    formData.append("type", projectType)

    lastExtension = file.name.split(".").pop()
}

function fileAdded(file) {
    if (isPython(file) || projectType != "auto_code") Group.showErrorNoPython(false)
    else {
        zone.removeFile(file)
        Group.showErrorNoPython(true, noPyhon)
    }
}

function fileGraded(file, response: Response) {
    zone.removeFile(file)
    Group.addResult(file.name, response)
}

function fileError(file, error) {
    zone.removeFile(file)
    Group.showErrorNoPython(true, error)
}

function isPython(file): boolean {
    return file.name.split(".").pop() == "py"
}