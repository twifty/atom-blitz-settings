/** @babel */
/* global atom */

import * as AtomPackagePath from 'atom-package-path'

function defaultHandler () {
    // Returning a falsy will remove the setting
    return false
}

function wrapHandler (handler = defaultHandler) {
    return function (key, value) {
        const keep = handler(key, value)
        if (!keep) {
            atom.config.unset(key)
        }
        return keep
    }
}

function shouldPreserve (prefix, settings, schema, validate) {
    for (const key in settings) {
        const value = settings[key]

        if (typeof value === 'object') {
            let childSchema = key in schema ? schema[key] : {}
            if (childSchema.type === 'object') {
                childSchema = childSchema.properties
            }

            if (!shouldPreserve(prefix + key + '.', Object.assign({}, value), childSchema, validate)) {
                atom.config.unset(prefix + key)
                delete settings[key]
            }
        } else if (!(key in schema)) {
            if (!validate(prefix + key, value)) {
                delete settings[key]
            }
        }
    }

    return Object.keys(settings).length
}

export default function blitz (packageName, handler) {
    if (!Array.isArray(packageName) && typeof packageName !== 'string') {
        handler = packageName
        packageName = AtomPackagePath.guess()
    }

    for (const name of [].concat(packageName)) {
        const settings = atom.config.get(name)

        if (typeof settings !== 'object') {
            continue
        }

        // A schema for a non existent package will return type=any, but this is
        // also returned for packages which didn't configure a schema. Otherwise,
        // schema will be type=object with a properties key
        let schema = atom.config.getSchema(name)
        if ('any' === schema.type) {
            schema = {}
        } else if ('object' === schema.type) {
            schema = schema.properties
        }

        if (!shouldPreserve(name + '.', Object.assign({}, settings), schema, wrapHandler(handler))) {
            atom.config.unset(name)
        }
    }
}
