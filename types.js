

const relation = {
    alias: 'relation',
    type: 'object',
    required: true,
    properties: {
        model: {
            type: 'string',
            desc: 'item\'s model type',
            required: true
        },
        item: {
            type: 'string',
            desc: 'item\'s id',
            required: true
        }
    }
}



const options = {
    type: 'array',
    required: true,
    items: {
        type: 'string'
    }
}

const relation_model = {
    type: 'string',
    required: true
}

const relation_models = {
    type: 'array',
    required: true,
    minLength: 1,
    items: relation_model
}

const types = {
    string: {
        alias: 'string',
        type: 'string',
        maxLength: 255,
        required: true
    }, 
    long: {
        alias: 'long',
        type: 'string',
        required: true
    }, 
    integer: {
        alias: 'integer',
        type: 'integer',
        required: true
    }, 
    float: {
        alias: 'float',
        type: 'number',
        required: true
    }, 
    array: {
        alias: 'array',
        type: 'array',
        required: true
    },
    boolean: {
        alias: 'boolean',
        type: 'boolean',
        required: true
    }, 
    relation: relation,
    many: {
        alias: 'many',
        type: 'array',
        required: true,
        items: relation
    }
}

module.exports = {
    relation,
    relation_model,
    relation_models,
    options,
    types
}
