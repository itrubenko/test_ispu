/* eslint-disable */
function JXON() {};

/**
 * Convert XML in object
 *
 * @param {Object} doc instance of XMLStreamReader
 * @return {Object} Object
 */
JXON.toJS = function(doc) {
    var originalString;
    var obj;
    var result;

    if (!doc) {
        return null;
    }

    if (!(doc instanceof XML)) {
        originalString = doc.toString();
        doc = new XML(doc);
    }

    obj = getJXONTree(doc);
    result = {};

    if (doc.localName()) {
        result[doc.localName()] = obj;
        return result;
    } else {
        return originalString; 
    }

    function getJXONTree(oXMLParent) {
        var vResult = {};
        var nLength = 0;
        var sCollectedTxt = '';
        
        if (oXMLParent.attributes().length()) {
            var xmlAttributes = oXMLParent.attributes();
            for (var a in xmlAttributes) {
                vResult['@' + xmlAttributes[a].localName()] = parseText(xmlAttributes[a].valueOf().trim());
                nLength++;
            }
        }

        if (oXMLParent.children().length()) {
            var children = oXMLParent.children();
            for (var node in children) {
                var nodeKind = children[node].nodeKind();
                if (nodeKind === 'text') {
                    sCollectedTxt += children[node];
                } else if (nodeKind === 'element') {
                    let sProp = children[node].localName();
                    vContent = getJXONTree(children[node]);
                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) {
                            vResult[sProp] = [vResult[sProp]];
                        }
                        vResult[sProp].push(vContent);
                    } else {
                        vResult[sProp] = vContent; 
                        nLength++;
                    }
                }
            }
        }

        if (sCollectedTxt) {
            nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt);
        }

        return vResult;
    }
}

/**
 * Convert XML in object
 *
 * @param {Object} obj object 
 * @return {String}
 */
JXON.toXMLString = function(obj) {
    var xmlString = toXML(obj).toXMLString();
    return xmlString.replace(/lang=/g,'xml:lang=');
}

function toXML(oObjTree) {
    var oNewDoc, ns;

    for (let sName in oObjTree) {
        if ( oObjTree[sName] instanceof Object ) {
            if ('@xmlns' in oObjTree[sName]) {
                ns = (oObjTree[sName])['@xmlns'];
                oNewDoc = new XML('<' + sName + (ns ? ' xmlns=\"' + ns + '\"' : '') +  '/>');
                delete (oObjTree[sName])['@xmlns'];
                loadObjTree(oNewDoc, oObjTree[sName]);
                break;
            }
            oNewDoc = new XML('<' + sName + '/>');
            loadObjTree(oNewDoc, oObjTree[sName]);
            break;
        } else {
            oNewDoc = new XML('<' + sName + '>' + oObjTree[sName] + '</' + sName + '>');
            break;
        }
    }

    return oNewDoc;

    function loadObjTree(oParentEl, oParentObj) {
        var vValue, oChild;

        if (!oParentObj) {
            return;
        }

        if (oParentObj instanceof String || oParentObj instanceof Number || oParentObj instanceof Boolean) {
            oParentEl.appendChild(oParentObj.toString());
        } else if (oParentObj.constructor === Date) {
            oParentEl.appendChild(oParentObj.toGMTString());
        } else if (!(oParentObj instanceof Object)) {
            oParentEl.appendChild(oParentObj.toString()); 
        }

        for (let sName in oParentObj) {
            if (isFinite(sName)) {
                continue;
            }

            vValue = oParentObj[sName];
            if (sName === 'keyValue') {
                if (vValue !== null) {
                    oParentEl.appendChild(vValue.constructor === Date ? vValue.toGMTString() : stripInvalidXMLCharacters(vValue.toString()));
                }
            } else if (sName.charAt(0) === '@') {
                oParentEl['@' + sName.slice(1)] = stripInvalidXMLCharacters(vValue);
            } else if (vValue.constructor === Array) {
                for (let nItem = 0; nItem < vValue.length; nItem++) {
                    oChild = new XML('<' + sName + '/>');
                    if (vValue[nItem] instanceof Object) {
                        loadObjTree(oChild, vValue[nItem]);
                    } else {
                        oChild.appendChild(stripInvalidXMLCharacters(vValue[nItem].toString()));
                    }  
                    oParentEl.appendChild(oChild);
                }
            } else {
                oChild = new XML('<' + sName + '/>');
                if (vValue instanceof Object) {
                    loadObjTree(oChild, vValue);
                } else {
                    oChild.appendChild(stripInvalidXMLCharacters(vValue.toString()));
                }
                oParentEl.appendChild(oChild);
            }
        }
    }
}

function parseText(sValue) {
    if (/^\s*$/.test(sValue)) {
        return null;
    }
    if (/^(?:true|false)$/i.test(sValue)) {
        return sValue.toLowerCase() === 'true';
    }
    if (isFinite(sValue)) {
        // We shouldn't parseFloat all that isFinite
        // For example isFinite('0000712') => true  but we shouldn't parseFloat this str
        // return parseFloat(sValue);
    }
    if (isFinite(Date.parse(sValue))) {
        return new Date(sValue);
    }
    return sValue;
}

// Strips out illegal characters per W3C spec http://www.w3.org/TR/xml/#charsets
function stripInvalidXMLCharacters(s) {
    let outString = '';

    if (!s) {
        return '';
    }

    for (let i = 0; i < s.length; i++) {
        let current = s.charCodeAt(i);

        if ( (current == 0x9) || 
             (current == 0xA) ||
             (current == 0xD) || 
             ((current >= 0x20) && (current <= 0xD7FF)) || 
             ((current >= 0xE000) && (current <= 0xFFFD)) ||
             ((current >= 0x10000) && (current <= 0x10FFFF)) ) {
            outString += String.fromCharCode(current); 
        };

    };

    return outString;
}

module.exports = JXON; 