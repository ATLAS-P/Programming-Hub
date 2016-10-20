declare var Dropzone
let zone

const noPyhon = 'Please only use python files!'

Dropzone.options.zonemini = {
    createImageThumbnails: false,
    parallelUploads: 5,
    maxFilesize: 0.05,
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
    if (!isPython(file)) {
        zone.removeFile(file)
        showErrorNoPython(true, noPyhon)
    } else accept()
}

function sending(file, xhr, formData) {
    console.log(project, formData)
    formData.append("project", project)
}

function fileAdded(file) {
    if (isPython(file)) showErrorNoPython(false)
    else {
        zone.removeFile(file)
        showErrorNoPython(true, noPyhon)
    }
}

function fileGraded(file, response: Response) {
    zone.removeFile(file)
    addResult(file.name, response)
}

function fileError(file, error) {
    zone.removeFile(file)
    showErrorNoPython(true, error)
}

function isPython(file): boolean {
    return file.name.split(".").pop() == "py"
}