// Megan-Prime Media Processor - Using Megan APIs (No FFmpeg)
const sharp = require('sharp');
const Jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';

class MediaProcessor {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(this.tempDir);
    }

    // Upload buffer to Catbox for API processing
    async uploadBuffer(buffer, filename = 'media.jpg') {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename });
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 60000
        });
        return res.data.trim();
    }

    // Create sticker using wa-sticker-formatter (local, fast)
    async createSticker(buffer, options = {}) {
        try {
            const sticker = new Sticker(buffer, {
                pack: options.pack || 'Megan-Prime',
                author: options.author || 'TrackerWanga',
                type: StickerTypes.DEFAULT,
                quality: options.quality || 80
            });
            return await sticker.toBuffer();
        } catch (error) { throw error; }
    }

    // Sticker to Image
    async stickerToImage(buffer) {
        try {
            try { return await sharp(buffer).png().toBuffer(); }
            catch {
                const image = await Jimp.read(buffer);
                return await image.getBufferAsync(Jimp.MIME_PNG);
            }
        } catch (error) { throw error; }
    }

    // Extract audio from video using Megan API
    async extractAudio(buffer) {
        try {
            const url = await this.uploadBuffer(buffer, 'video.mp4');
            const res = await axios.get(`${API_BASE}/api/audio/extract`, {
                params: { url, apikey: API_KEY },
                responseType: 'arraybuffer',
                timeout: 120000
            });
            return Buffer.from(res.data);
        } catch(e) {
            // Fallback: try converter endpoint
            const url = await this.uploadBuffer(buffer, 'video.mp4');
            const res = await axios.get(`${API_BASE}/api/converter/video-to-audio`, {
                params: { url, apikey: API_KEY },
                responseType: 'arraybuffer',
                timeout: 120000
            });
            return Buffer.from(res.data);
        }
    }

    // Convert to MP3 (alias)
    async toAudio(buffer) {
        return await this.extractAudio(buffer);
    }

    // Convert to PTT (voice note) - use API
    async toPTT(buffer) {
        const url = await this.uploadBuffer(buffer, 'audio.mp3');
        const res = await axios.get(`${API_BASE}/api/audio/to-ptt`, {
            params: { url, apikey: API_KEY },
            responseType: 'arraybuffer',
            timeout: 60000
        });
        return Buffer.from(res.data);
    }

    // Change speed using Megan API
    async changeSpeed(buffer, speed = 1.5) {
        const url = await this.uploadBuffer(buffer, 'audio.mp3');
        const res = await axios.get(`${API_BASE}/api/audio/speed`, {
            params: { url, speed, apikey: API_KEY },
            responseType: 'arraybuffer',
            timeout: 60000
        });
        return Buffer.from(res.data);
    }

    // Change volume using Megan API
    async changeVolume(buffer, volume = 2) {
        const url = await this.uploadBuffer(buffer, 'audio.mp3');
        const res = await axios.get(`${API_BASE}/api/audio/volume`, {
            params: { url, volume, apikey: API_KEY },
            responseType: 'arraybuffer',
            timeout: 60000
        });
        return Buffer.from(res.data);
    }

    // Circle crop
    async createCircle(buffer) {
        try {
            const image = await Jimp.read(buffer);
            const size = Math.min(image.bitmap.width, image.bitmap.height);
            const x = (image.bitmap.width - size) / 2;
            const y = (image.bitmap.height - size) / 2;
            image.crop(x, y, size, size);
            image.circle();
            return await image.getBufferAsync(Jimp.MIME_PNG);
        } catch (error) {
            try {
                return await sharp(buffer).resize(512, 512, { fit: 'cover' }).png().toBuffer();
            } catch (e) { throw error; }
        }
    }

    // Image filters
    async applyFilter(buffer, filter) {
        let image = await Jimp.read(buffer);
        switch (filter) {
            case 'greyscale': case 'grayscale': image.greyscale(); break;
            case 'invert': image.invert(); break;
            case 'sepia': image.sepia(); break;
            case 'brighten': image.brightness(0.3); break;
            case 'darken': image.brightness(-0.3); break;
            case 'contrast': image.contrast(0.3); break;
            case 'blur': image.blur(5); break;
            case 'sharpen': image.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]); break;
            default: image.greyscale();
        }
        return await image.getBufferAsync(Jimp.MIME_PNG);
    }

    // Remove background
    async removeBackground(buffer) {
        try {
            const image = await Jimp.read(buffer);
            const bgColor = image.getPixelColor(0, 0);
            const { r, g, b } = Jimp.intToRGBA(bgColor);
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                const pixelR = image.bitmap.data[idx];
                const pixelG = image.bitmap.data[idx + 1];
                const pixelB = image.bitmap.data[idx + 2];
                if (Math.abs(pixelR - r) < 30 && Math.abs(pixelG - g) < 30 && Math.abs(pixelB - b) < 30) {
                    image.bitmap.data[idx + 3] = 0;
                }
            });
            return await image.getBufferAsync(Jimp.MIME_PNG);
        } catch (error) {
            throw new Error('Background removal failed');
        }
    }

    // Meme generator
    async createMeme(topText, bottomText, baseImageBuffer) {
        const image = await Jimp.read(baseImageBuffer);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        if (topText) {
            const textWidth = Jimp.measureText(font, topText);
            const x = (image.bitmap.width - textWidth) / 2;
            image.print(font, x, 10, topText);
        }
        if (bottomText) {
            const textWidth = Jimp.measureText(font, bottomText);
            const x = (image.bitmap.width - textWidth) / 2;
            image.print(font, x, image.bitmap.height - 50, bottomText);
        }
        return await image.getBufferAsync(Jimp.MIME_JPEG);
    }

    // Clean temp files
    async cleanup() {
        try {
            const files = await fs.readdir(this.tempDir);
            let deleted = 0, freed = 0;
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                freed += stats.size;
                await fs.remove(filePath);
                deleted++;
            }
            return { deleted, freed };
        } catch (error) { return { deleted: 0, freed: 0 }; }
    }
}

module.exports = MediaProcessor;
