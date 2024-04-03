/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import FileTypes from '/scripts/core/enums/FileTypes.js';
import AudioFileTypes from '/scripts/core/enums/AudioFileTypes.js';
import ImageFileTypes from '/scripts/core/enums/ImageFileTypes.js';
import ModelFileTypes from '/scripts/core/enums/ModelFileTypes.js';
import VideoFileTypes from '/scripts/core/enums/VideoFileTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { DelayedClickHandler } from '/scripts/DigitalBacon-UI.js';

class UploadHandler {
    constructor() {
        this._input = document.createElement('input');
        this._input.type = "file";
        this._locks = new Set();
        this._assetIds = [];
        this._fileListenerActive = false;
        this._addEventListeners();
    }

    _addEventListeners() {
        this._input.addEventListener("change", () => { this._upload(); });
        if(global.deviceType != "XR") {
            this._input.addEventListener("click",
                (e) => { e.stopPropagation(); });
        }
    }

    _uploadProjectFile() {
        if(this._input.files.length > 0 && this._callback) {
            this._callback(this._input.files[0]);
            this._callback = null;
        }
    }

    _uploadAssets() {
        this.uploadFiles(this._input.files, this._callback);
        this._callback = null;
    }

    uploadFiles(files, callback) {
        //Adding functionLock for potential race condition where LibraryHandler
        //callback gets called before next iteration of loop for multiple files
        let functionLock = uuidv4();
        this._locks.add(functionLock);
        for(let file of files) {
            let extension = file.name.split('.').pop().toLowerCase();
            if(extension in FileTypes) {
                let lock = uuidv4();
                if(extension == 'js') {
                    this._locks.add(lock);
                    LibraryHandler.addNewScript(file, (assetId) => {
                        this._addAcknowledgement(assetId);
                        this._libraryCallback(assetId, lock, callback);
                    }, () => {
                        console.log("TODO: Tell user an error occurred");
                    });
                } else {
                    let assetType;
                    if(extension in ImageFileTypes) {
                        assetType = AssetTypes.IMAGE;
                    } else if(extension in ModelFileTypes) {
                        assetType = AssetTypes.MODEL;
                    } else if(extension in AudioFileTypes) {
                        assetType = AssetTypes.AUDIO;
                    } else if(extension in VideoFileTypes) {
                        assetType = AssetTypes.VIDEO;
                    }
                    this._locks.add(lock);
                    LibraryHandler.addNewAsset(file, file.name, assetType,
                        (assetId) => {
                            this._libraryCallback(assetId, lock, callback);
                        });
                }
            } else {
                console.log("TODO: Tell user invalid filetype, and list valid ones");
            }
        }
        this._input.value = '';
        this._locks.delete(functionLock);
        if(this._locks.size == 0) {
            if(callback) callback(this._assetIds);
            this._assetIds = [];
        }
    }

    _addAcknowledgement(assetId) {
        let type = LibraryHandler.getType(assetId);
        let assetHandler = ProjectHandler.getAssetHandler(type);
        let c = assetHandler.getAssetClass(assetId);
        if(c.author || c.license || c.sourceUrl) {
            let acknowledgement = {};
            acknowledgement['Asset'] = c.assetName;
            acknowledgement['Asset ID'] = c.assetId;
            if(c.author) acknowledgement['Author'] = c.author;
            if(c.license) acknowledgement['License'] = c.license;
            if(c.sourceUrl) acknowledgement['Source URL'] = c.sourceUrl;
            let acknowledgements = SettingsHandler.getAcknowledgements();
            for(let a of acknowledgements) {
                if(a['Asset ID'] == assetId) {
                    a['Asset'] = acknowledgement['Asset'];
                    a['Author'] = acknowledgement['Author'];
                    a['License'] = acknowledgement['License'];
                    a['Source URL'] = acknowledgement['Source URL'];
                    return;
                }
            }
            SettingsHandler.addAcknowledgement(acknowledgement, true);
        }
    }

    _libraryCallback(assetId, lock, callback) {
        this._assetIds.push(assetId);
        this._locks.delete(lock);
        if(this._locks.size == 0) {
            if(callback) callback(this._assetIds);
            this._assetIds = [];
        }
    }

    triggerAssetsUpload(callback, supportMultipleFiles, type) {
        if(this._fileListenerActive)
            throw new Error("File listener already in use");
        this._callback = callback;
        this._fileListenerActive = true;
        this._input.multiple = supportMultipleFiles;
        this._upload = this._uploadAssets;
        if(type == AssetTypes.IMAGE) {
            this._input.accept = "image/*";
        } else if(type == AssetTypes.MODEL) {
            this._input.accept = ".glb";
        } else if(type == AssetTypes.AUDIO) {
            this._input.accept = ".mp3,.wav";
        } else {
            this._input.accept = '';
        }
        if(global.deviceType == 'XR') {
            SessionHandler.exitXRSession();
            this._input.click();
        } else {
            DelayedClickHandler.trigger(() => this._input.click());
        }
    }

    triggerProjectFileUpload(callback) {
        if(this._fileListenerActive)
            throw new Error("File listener already in use");
        this._callback = callback;
        this._fileListenerActive = true;
        this._input.multiple = false;
        this._input.accept = '.zip';
        this._upload = this._uploadProjectFile;
        if(global.deviceType == 'XR') {
            SessionHandler.exitXRSession();
            this._input.click();
        } else {
            DelayedClickHandler.trigger(() => this._input.click());
        }
    }
}

let uploadHandler = new UploadHandler();
export default uploadHandler;
