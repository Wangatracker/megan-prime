// Megan-Prime Upload Handler
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs-extra');

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function getFileContentType(ext) {
    const types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.pdf': 'application/pdf',
        '.txt': 'text/plain'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}

async function uploadToCatbox(buffer, filename) {
    try {
        const form = new FormData();
        const stream = bufferToStream(buffer);
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', stream, {
            filename: filename,
            contentType: getFileContentType(path.extname(filename))
        });
        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000
        });
        return { url: data.trim(), success: true, service: 'catbox' };
    } catch (error) {
        return { url: null, success: false, service: 'catbox', error: error.message };
    }
}

async function uploadToImgBB(buffer, filename) {
    try {
        const form = new FormData();
        const stream = bufferToStream(buffer);
        form.append('image', stream, {
            filename: filename,
            contentType: getFileContentType(path.extname(filename))
        });
        const { data } = await axios.post(
            'https://api.imgbb.com/1/upload?key=bbc0c59714520ebcd0af58caf995bd08',
            form,
            { headers: form.getHeaders(), timeout: 30000 }
        );
        return { url: data.data.url, success: true, service: 'imgbb' };
    } catch (error) {
        return { url: null, success: false, service: 'imgbb', error: error.message };
    }
}

async function uploadWithRetry(uploadFn, buffer, filename, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await uploadFn(buffer, filename);
            if (result.success) return result;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        } catch (error) {
            if (attempt === maxRetries) {
                return { success: false, error: error.message };
            }
        }
    }
    return { success: false, error: 'Max retries exceeded' };
}

async function uploadAuto(buffer, filename) {
    const errors = [];
    const catboxResult = await uploadWithRetry(uploadToCatbox, buffer, filename);
    if (catboxResult.success) return catboxResult;
    errors.push(`Catbox: ${catboxResult.error}`);
    const imgbbResult = await uploadWithRetry(uploadToImgBB, buffer, filename);
    if (imgbbResult.success) return imgbbResult;
    errors.push(`ImgBB: ${imgbbResult.error}`);
    return { url: null, success: false, error: 'All upload services failed', details: errors };
}

module.exports = {
    uploadToCatbox,
    uploadToImgBB,
    uploadAuto,
    bufferToStream,
    getFileContentType
};
