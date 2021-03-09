const { relation, relation_model, relation_models, options, types } = require('./types.js')


const minmax = {

}

module.exports = [
    {
        alias: 'textbox',
        value: types.string,
        misc: {
        }
    },
    {
        alias: 'slug',
        value: {
            ...types.string,
            pattern: '/^[\w-]+$/'
        },
        misc: {
            mirror: {
                type: 'string',
                desc: 'mirrored model name'
            }
        }
    },
    { 
        alias: 'textarea',
        value: types.long,
        misc: {
        }
    },
    { 
        alias: 'markdown',
        value: types.long,
        misc: {
        }
    },
    { 
        alias: 'wysiwyg',
        value: types.long,
        misc: {
        }
    },
    { 
        alias: 'select',
        value: types.string,
        misc: {
            options: options
        }
    },
    { 
        alias: 'radio',
        value: types.string,
        misc: {
            options: options
        }
    },
    { 
        alias: 'intbox',
        value: types.integer,
        misc: {
        }
    },
    { 
        alias: 'floatbox',
        value: types.float,
        misc: {
        }
    },
    { 
        alias: 'slider',
        value: types.float,
        misc: {
        }
    },
    { 
        alias: 'toggle',
        value: types.boolean,
        misc: {
        }
    },
    { 
        alias: 'tagbox',
        value: types.array,
        misc: {
        }
    },
    { 
        alias: 'list',
        value: types.array,
        misc: {
        }
    },
    { 
        alias: 'checkboxes',
        value: types.array,
        misc: {
        }
    },
    { 
        alias: 'many',
        value: types.many,
        misc: {
            models: relation_models
        }
    },
    { 
        alias: 'relation',
        value: types.relation,
        misc: {
            model: relation_model
        }
    },
    { 
        alias: 'files',
        value: types.many,
        misc: {
            models: relation_models
        }
    },
    { 
        alias: 'file',
        value: types.relation,
        misc: {
            model: relation_model
        }
    }
]