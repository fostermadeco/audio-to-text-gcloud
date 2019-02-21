const path = require('path');
const os = require('os');
const fs = require('fs');
// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require('busboy');
const Speech = require('@google-cloud/speech');

const ENCODING = 'LINEAR16';
const SAMPLE_RATE_HERTZ = 41000;
const LANGUAGE = 'en-US';

const audioConfig = {
    encoding: ENCODING,
    sampleRateHertz: SAMPLE_RATE_HERTZ,
    languageCode: LANGUAGE,
};

const convertToText = (file, config) => {
    console.log('FILE:', JSON.stringify(file));

    const audio = {
        content: fs.readFileSync(file).toString('base64'),
    };

    const request = {
        config,
        audio,
    };

    const speech = new Speech.SpeechClient();

    return speech.recognize(request).then((response) => {
        return response;
    }).catch((error) => {
        console.log('SPEECH error:', error);
    });
};

/**
 * Audio-to-Text is a Cloud Function that is triggered by an HTTP
 * request. The function processes one audio file.
 *
 * @param {object} req Cloud Function request context.
 * @param {object} res Cloud Function response context.
 */
exports.audioToText = (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).end();
    }

    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();

    let tmpFilePath;
    let fileWritePromise;

    // Process the file
    busboy.on('file', (fieldname, file, filename) => {
        // Note: os.tmpdir() points to an in-memory file system on GCF
        // Thus, any files in it must fit in the instance's memory.
        const filepath = path.join(tmpdir, filename);
        tmpFilePath = filepath;

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        // File was processed by Busboy; wait for it to be written to disk.
        const promise = new Promise((resolve, reject) => {
            file.on('end', () => {
                writeStream.end();
            });
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        fileWritePromise = promise;
    });

    // Triggered once the file is processed by Busboy.
    // Need to wait for the disk writes to complete.
    busboy.on('finish', () => {
        fileWritePromise.then(() => {
            convertToText(tmpFilePath, audioConfig).then((response) => {
                const transcript = response[0].results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                res.send({ transcript });
            });
            fs.unlinkSync(tmpFilePath);
        });
    });

    busboy.end(req.rawBody);
};
