declare var Dropzone
let zone

const noPyhon = 'Please only use python files!'

Dropzone.options.zonemini = {
    createImageThumbnails: false,
    parallelUploads: 5,
    maxFilesize: 0.05,
    accept: function (file, done) {
        if (!isPython(file)) {
            this.removeFile(file)
            showErrorNoPython(true, "")
            done()
        } else { done(); }
    },
    init: function () {
        zone = this

        this.on("addedfile", function (file) {
            if (isPython(file)) showErrorNoPython(false)
            else {
                this.removeFile(file)
                showErrorNoPython(true, noPyhon)
            }
        });
    },
    success: function (file, response) {
        zone.removeFile(file)
        addResult(file.name, response)
    },
    error : function (file, error) {
        zone.removeFile(file)
        showErrorNoPython(true, error)
    }
}

function isPython(file): boolean {
    return file.name.split(".").pop() == "py"
}