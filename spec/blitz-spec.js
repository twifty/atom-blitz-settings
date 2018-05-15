/** @babel */
/* global atom jasmine describe it expect spyOn */

import * as AtomPackagePath from 'atom-package-path'
import blitz from '../src/index'

// The atom spec-helper also uses atom.config, so we must filter our own keys
const testKeys = {
    'winter-is-coming': true,
    'winter-is-here': true,
}

function spyOnAndReturn (obj, method, value = undefined) {
    const original = obj[method]
    return spyOn(obj, method).andCallFake((val, ...args) => {
        if (!(val in testKeys)) {
            return original.call(obj, val, ...args)
        } else {
            return value
        }
    })
}

function setupFixtures (schema, settings) {
    spyOnAndReturn(atom.config, 'getSchema', schema || {type: 'any'})
    spyOnAndReturn(atom.config, 'get', settings)
    spyOnAndReturn(atom.config, 'unset')
}

const schemaFixture = {
    type: 'object',
    properties: {
        quote: {
            type: 'string',
        },
        characters: {
            type: 'object',
            properties: {
                king: {
                    type: 'string'
                },
                best: {
                    type: 'string'
                },
                worst: {
                    type: 'string'
                }
            }
        }
    }
}

describe('atom-blitz-settings', () => {
    it('should detect package', () => {
        setupFixtures()
        spyOn(AtomPackagePath, 'guess').andReturn('winter-is-coming')

        blitz()

        expect(atom.config.get.calls.length).toEqual(1)
        expect(atom.config.get.calls[0].args[0]).toEqual('winter-is-coming')
    })

    it('should accept a package name', () => {
        setupFixtures()

        blitz('winter-is-coming')

        expect(atom.config.get.calls.length).toEqual(1)
        expect(atom.config.get.calls[0].args[0]).toEqual('winter-is-coming')
    })

    it('should accept multiple package names', () => {
        setupFixtures()

        blitz(['winter-is-coming', 'winter-is-here'])

        expect(atom.config.get.calls.length).toEqual(2)
        expect(atom.config.get.calls[0].args[0]).toEqual('winter-is-coming')
        expect(atom.config.get.calls[1].args[0]).toEqual('winter-is-here')
    })

    it('should remove erronous keys', () => {
        setupFixtures(schemaFixture,{
            quote: "Nothing burns like the cold.",
            spandex: "Arya",
            characters: {
                king: "John",
                dead: "Eddard",
                best: "All"
            },
            dragons: {
                alive: "Rhaegal"
            }
        })

        const handler = jasmine.createSpy('handler')

        blitz('winter-is-coming', handler)

        expect(handler.calls.length).toEqual(3)
        expect(handler.calls[0].args).toEqual(['winter-is-coming.spandex', 'Arya'])
        expect(handler.calls[1].args).toEqual(['winter-is-coming.characters.dead', 'Eddard'])
        expect(handler.calls[2].args).toEqual(['winter-is-coming.dragons.alive', 'Rhaegal'])

        expect(atom.config.unset.calls.length).toEqual(4)
        expect(atom.config.unset.calls[0].args).toEqual(['winter-is-coming.spandex'])
        expect(atom.config.unset.calls[1].args).toEqual(['winter-is-coming.characters.dead'])
        expect(atom.config.unset.calls[2].args).toEqual(['winter-is-coming.dragons.alive'])
        expect(atom.config.unset.calls[3].args).toEqual(['winter-is-coming.dragons'])
    })

    it('should preserve handler truthies', () => {
        setupFixtures(schemaFixture,{
            quote: "Nothing burns like the cold.",
            spandex: "Arya",
            characters: {
                king: "John",
                dead: "Eddard",
                best: "All"
            },
            dragons: {
                alive: "Rhaegal"
            }
        })

        const handler = jasmine.createSpy('handler').andCallFake((key) => {
            if ('winter-is-coming.spandex' === key) {
                return true
            }
        })

        blitz('winter-is-coming', handler)

        expect(atom.config.unset.calls.length).toEqual(3)
        expect(atom.config.unset.calls[0].args).toEqual(['winter-is-coming.characters.dead'])
        expect(atom.config.unset.calls[1].args).toEqual(['winter-is-coming.dragons.alive'])
        expect(atom.config.unset.calls[2].args).toEqual(['winter-is-coming.dragons'])
    })

    it('should preserve nested objects', () => {
        setupFixtures(schemaFixture,{
            quote: "Nothing burns like the cold.",
            spandex: "Arya",
            characters: {
                king: "John",
                dead: "Eddard",
                best: "All"
            },
            dragons: {
                alive: "Rhaegal"
            }
        })

        const handler = jasmine.createSpy('handler').andCallFake((key) => {
            if ('winter-is-coming.dragons.alive' === key) {
                return true
            }
        })

        blitz('winter-is-coming', handler)

        expect(atom.config.unset.calls.length).toEqual(2)
        expect(atom.config.unset.calls[0].args).toEqual(['winter-is-coming.spandex'])
        expect(atom.config.unset.calls[1].args).toEqual(['winter-is-coming.characters.dead'])
    })
})
