import path from 'path'

/**
 * @typedef CommonJSStyleScriptFilepathInfo
 * @property {string} __filename
 * @property {string} __dirname
 */

/**
 * 
 * @param {string} callerUrl - The `import.meta.url` of the caller.
 * @returns {CommonJSStyleScriptFilepathInfo}
 */
export default function parseImportMetaUrl(callerUrl) {
    let u = callerUrl.replace(/^file:\/\//,'')
    if(typeof process !== 'undefined') {
        if(typeof process === "object"){
            if(process.platform === "win32"){
                u = u.substring(1)
            }
        }
    }
    return {
        __filename: u,
        __dirname: path.dirname(u)
    }
}