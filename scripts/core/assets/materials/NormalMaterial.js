/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import MaterialTypes from '/scripts/core/enums/MaterialTypes.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import { NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import TextureInput from '/scripts/core/menu/input/TextureInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Display" },
    { "name": "Transparent" },
    { "name": "Opacity" },
    { "name": "Flat Shading", "parameter": "flatShading",
        "type": CheckboxInput },
    { "name": "Wireframe", "parameter": "wireframe", "type": CheckboxInput },
    { "name": "Bump Map", "parameter": "bumpMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Bump Scale", "parameter": "bumpScale",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Displacement Map", "parameter": "displacementMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Displacement Scale", "parameter": "displacementScale",
        "type": NumberInput },
    { "name": "Displacement Bias", "parameter": "displacementBias",
        "type": NumberInput },
    { "name": "Normal Map", "parameter": "normalMap",
        "filter": TextureTypes.BASIC, "type": TextureInput },
    { "name": "Normal Type", "parameter": "normalMapType",
        "options": [ "Tangent", "Object" ], "map": NORMAL_TYPE_MAP,
        "reverseMap": REVERSE_NORMAL_TYPE_MAP, "type": EnumInput },
    //{ "name": "Normal Scale", "parameter": "normalScale",
    //    "min": 0, "max": 1, "type": Vector2Input },
];

const MAPS = ["bumpMap", "displacementMap", "normalMap"];

export default class NormalMaterial extends Material {
    constructor(params = {}) {
        super(params);
        this._wireframe = params['wireframe'] || false;
        this._flatShading = params['flatShading'] || false;
        this._bumpMap = params['bumpMap'];
        this._bumpScale = numberOr(params['bumpScale'], 1);
        this._displacementMap = params['displacementMap'];
        this._displacementScale = numberOr(params['displacementScale'], 1);
        this._displacementBias = numberOr(params['displacementBias'], 0);
        this._normalMap = params['normalMap'];
        this._normalMapType = params['normalMapType']
            || THREE.TangentSpaceNormalMap;
        //this._normalScale = params['normalScale'] || [1,1];
        this._createMaterial();
    }

    _getDefaultName() {
        return "Normal Material";
    }

    _createMaterial() {
        let materialParams = {
            "transparent": this._transparent,
            "side": this._side,
            "opacity": this._opacity,
            "wireframe": this._wireframe,
            "flatShading": this._flatShading,
            "bumpScale": this._bumpScale,
            "displacementScale": this._displacementScale,
            "displacementBias": this._displacementBias,
            "normalMapType": this._normalMapType,
            //"normalScale": this._normalScale,
        };
        this._updateMaterialParamsWithMaps(materialParams, MAPS);
        this._material = new THREE.MeshNormalMaterial(materialParams);
    }

    _getMaps() {
        return MAPS;
    }

    getMaterialType() {
        return MaterialTypes.NORMAL;
    }

    getSampleTexture() {
        return this._material.map;
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    exportParams() {
        let params = super.exportParams();
        params['wireframe'] = this._wireframe;
        params['flatShading'] = this._flatShading;
        params['bumpMap'] = this._bumpMap;
        params['bumpScale'] = this._bumpScale;
        params['displacementMap'] = this._displacementMap;
        params['displacementScale'] = this._displacementScale;
        params['displacementBias'] = this._displacementBias;
        params['normalMap'] = this._normalMap;
        params['normalMapType'] = this._normalMapType;
        //params['normalScale'] = this._normalScale;
        return params;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.name in menuFieldsMap) continue;
            let menuField = this._createMenuField(field);
            if(menuField) menuFieldsMap[field.name] = menuField;
        }
        return menuFieldsMap;
    }
}
