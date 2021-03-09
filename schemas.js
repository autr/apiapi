
const ifaces = require('./ifaces.js')
const { relation, relation_model, relation_models, options, types } = require('./types.js')

module.exports = {
    relation: {
        type: 'object',
        properties: {
            model: {
                type: 'string',
                required: true
            },
            id: {
                type: 'string',
                require: true
            }
        }
    },
    model: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                required: true,
                minLength: 3,
                maxLength: 120,
                desc: 'name of model'
            },
            iden: {
                type: 'string',
                required: true,
                enum: ['auto-int', 'custom-slug']
            },
            fields: {
                type: 'array',
                required: true,
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            required: true,
                            desc: 'field name',
                            minLength: 2
                        },
                        type: {
                            type: 'string',
                            required: true,
                            enum: Object.keys( types ),
                            desc: 'field data type'
                        },
                        iface: {
                            type: 'string',
                            required: true,
                            enum: ifaces.map( iface => iface.alias ),
                            desc: 'field gui interface type'
                        },
                        required: {
                            type: 'boolean',
                            required: true,
                            desc: 'if field is required'
                        },
                        viz: {
                            type: 'boolean',
                            required: true,
                            desc: 'if field is visualised'
                        },
                        misc: {
                            type: 'object',
                            required: false,
                            desc: 'formatting values for the field interface'
                        },
                        hide: {
                            type: 'boolean',
                            required: true,
                            desc: 'show or hide field'
                        }
                    }
                }
            }
        }
    }
}