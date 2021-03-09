const schemas = require('./schemas.js')
const ifaces = require('./ifaces.js')
const { relation, relation_model, relation_models, options, types } = require('./types.js')
const fs = require('fs')
const validate = require('jsonschema').validate
const apiFiles = require('../../api/api-file.js')
const bin = './db'

const get_db = async ( name ) => {
	const path = `${bin}/${name}.json`
	if ( !( await fs.existsSync( path ) ) ) {
		const msg = `no such database file exists at: "${path}"`
		console.log(`[ezapi] 🚨⚡️  ${msg}`)
		throw { message: msg, code: 404 }
	}
	let str = await fs.readFileSync( path, 'utf8' )
	if (!str || str == '' ) str = '{}'
	return JSON.parse( str )
}
const save_db = async ( name, db ) => {
	const path = `${bin}/${name}.json`
	return await fs.writeFileSync( path, JSON.stringify(db, null, 2) )
}

const create_if_null = async (obj, arr, val) => {

	if (typeof arr == 'string')
		arr = arr.split(".");
	obj[arr[0]] = obj[arr[0]] || {};

	var tmpObj = obj[arr[0]];

	if (arr.length > 1) {
		arr.shift();
		create_if_null(tmpObj, arr, val);
	} else if (!obj[arr[0]]) {
		obj[arr[0]] = val;
	}

	return obj;
}

const throw_if_exists = async (db, type, id) => {
	if ( Object.keys(db[type]).indexOf( id ) != -1 ) throw `${type} "${id}" already exists`
}

const model_to_schema = async (model) => {
	const fields = model.fields.reduce(function(sch, field) {
		sch[field.name] = {
			...field.misc,
			required: field.required
		}
		return sch
	}, {})
	return {
		type: 'object',
		properties: { ...fields }
	}
}

module.exports = [

		/*----------------

		show db info

		-----------------*/

		{
			url: '/db_info',
			type: 'get',
			description: 'show db info',
			category: 'database',
			schema: {

			},
			data: async params => {
				return { version: 1, schemas, ifaces, types }
			}
		},
		/*----------------

		list all databases

		-----------------*/

		{
			url: '/dbs',
			type: 'get',
			description: 'list all databases',
			category: 'database',
			schema: {

			},
			data: async params => {
				const ls = apiFiles.find( a => a.url == '/ls' )
				return await ls.data( { args: `-l,${bin}` } )
			}
		},
		/*----------------

		create new database

		-----------------*/

		{
			url: '/dbs',
			type: 'post',
			description: 'create new database',
			category: 'database',
			schema: {
				name: {
					type: 'string',
					required: true
				}
			},
			data: async params => {
				const path = `${bin}/${params.name}.json`
				if ( await fs.existsSync( path ) ) {
					const msg = `db already exists "${path}"...`
					console.log(`[ezapi] 🛑  ${msg}`)
					throw msg
				} else {
					return await save_db( params.name, {} )
				}
				
			}
		},

		/*----------------

		view quick properties

		-----------------*/

		{
			url: '/:db/quick',
			type: 'get',
			description: 'view quick properties',
			category: 'database',
			schema: {

			},
			data: async params => {
				const n = params.regex.db
				const db = await get_db( n )
				await create_if_null( db, 'quick', {} )
				return db.quick
			}
		},

		/*----------------

		set quick properties

		-----------------*/

		{
			url: '/:db/quick',
			type: 'post',
			description: 'set quick properties',
			category: 'database',
			schema: {
				values: {
					type: 'object',
					required: true
				}
			},
			data: async params => {
				const n = params.regex.db
				const db = await get_db( n )
				await create_if_null( db, 'quick', {} )
				db.quick = { ...db.quick, ...params.values }
				await save_db( n, db )
				return db.quick
			}
		},

		/*----------------

		list all models

		-----------------*/

		{
			url: '/:db/models',
			type: 'get',
			description: 'list all models',
			category: 'database',
			schema: {
			},
			data: async params => {
				return (await get_db( params.regex.db )).models || {}
			}
		},

		/*----------------

		create model

		-----------------*/

		{
			url: '/:db/models',
			type: 'post',
			description: 'create model',
			category: 'database',
			schema: schemas.model.properties,
			data: async params => {

				const db = await get_db( params.regex.db )
				await create_if_null( db, 'models', {} )
				await throw_if_exists( db, 'models', params.name )


				const model = { name: params.name, fields: params.fields || [], created: (new Date()).toString(), updated: (new Date()).toString() }
				db.models[params.name] = model

				await save_db( params.regex.db, db )
				return model
			}
		},

		/*----------------

		get model

		-----------------*/

		{
			url: '/:db/models/:id',
			type: 'get',
			description: 'get model by id',
			category: 'database',
			schema: {
			},
			data: async params => {
				const db = await get_db( params.regex.db )
				return db.models[params.regex.id]
			}
		},

		/*----------------

		delete model 

		-----------------*/

		{
			url: '/:db/models/:id',
			type: 'delete',
			description: 'delete model',
			category: 'database',
			schema: {
				name: {
					type: 'string',
					required: true,
					minLength: 3
				}
			},
			data: async params => {

				const db = await get_db( params.regex.db )
				if (!db.models[params.name]) throw `no such model ${params.name}`
				delete db.models[params.name]
				await save_db( params.regex.db, db )
				return params.regex

			}
		},



		/*----------------

		create or edit model fields

		-----------------*/

		{
			url: '/:db/models/:id/fields',
			type: 'post',
			description: 'create or edit model fields',
			category: 'database',
			schema: { 
				fields: schemas.model.properties.fields, 
				overwrite:  {
					type: 'boolean',
					default: false
				}
			},
			data: async params => {
				const db = await get_db( params.regex.db )
				await create_if_null( db, 'models', {} )
				let model = db.models[ params.regex.id ]
				if (!model) throw { message: `no model named "${params.regex.id}"` }

				if ( params.overwrite ) model.fields = []


				for (let i = 0; i < params.fields.length; i++ ) {
					const field = params.fields[i]


					const lookup = ifaces.find( ifc => ifc.alias == field.iface )
					const checkup = validate( field.misc, { type: 'object', properties: lookup.misc } )
					if (!checkup.valid) throw checkup.errors.map( e => e.stack.trim() ).join(', ').replaceAll('instance.', '')

					const found = model.fields.filter( f => f.name == field.name )[0]
					if (!found) {
						model.fields.push( field )
					} else {

						const keys = Object.keys( schemas.model.properties.fields.items.properties ).filter( n => n != 'name' && n != 'type')
						keys.forEach( key => found[key] = field[key] )
					}
				}

				db.models[ params.regex.id ] = { ...model, updated: (new Date()).toString() }

				await save_db( params.regex.db, db )
				return model

			}
		},


		/*----------------

		delete model field

		-----------------*/

		{
			url: '/:db/models/:id/fields',
			type: 'delete',
			description: 'delete model fields',
			category: 'database',
			schema: {
				fields: {
					type: 'array',
					required: true,
					items: {
						type: 'string'
					}
				}
			},
			data: async params => {

				const db = await get_db( params.regex.db )
				await create_if_null( db, 'models', {} )
				const model = db.models[ params.regex.id ]
				if (!model) throw { message: `no model named "${params.regex.id}"` }

				for (let i = 0; i < params.fields.length; i++ ) {
					const field = params.fields[i]

					model.fields = model.fields.filter( f => {
						if (f.name == field && f.name != 'id' ) {
							console.log('🚨 TODO: FILTERING OUT ON DELETE', f.name, f)
							console.log('🚨 TODO: SORT OUT RELATIONS')
							return false
						} else {
							return true
						}
					})
				}
				db.models[ params.regex.id ] = { ...model, updated: (new Date()).toString() }

				await save_db( params.regex.db, db )
				return model

			}
		},













		/*----------------

		list all items

		-----------------*/

		{
			url: '/:db/items/:model',
			type: 'get',
			description: 'list all items',
			category: 'database',
			schema: {
				depth: {
					type: 'string',
					default: 0
				}
			},
			data: async params => {


				function expandItem( db, model, item, depth, counter ) {

					if (counter >= depth) return item
					counter += 1

					const manyFields = model.fields.filter( f => f.type == 'many' ).map( f => f.name )
					manyFields.forEach( manyName => {
						if (item[manyName]) {
							item[manyName] = item[manyName].map( link => {
								const childModel = db.models[ link.model ]
								const childItem = db.items[ link.model ][ link.id ]
								link.item = expandItem( db, childModel, childItem, depth, counter )
								return link
							})
						}
					})
					return JSON.parse(JSON.stringify(item))
				}

				const n = params.regex.db
				const m = params.regex.model

				const db = await get_db( n )
				const model = db.models[m]
				const depth = Math.max(parseInt(params.depth || 0), 8)
				await create_if_null( db, `items.${m}`, {} )
				const it = Object.keys(db.items[m]).map( function(k, i) {
					return expandItem( db, model, db.items[m][k], depth, 0 )
				})
				return it
			}
		},


		/*----------------

		create new item

		-----------------*/

		{
			url: '/:db/items/:model',
			type: 'post',
			description: 'create new item',
			category: 'database',
			schema: {
				item: {
					type: 'object',
					required: true
				}
			},
			data: async params => {

				const n = params.regex.db
				const m = params.regex.model

				const db = await get_db( n )
				await create_if_null( db, `items.${m}`, {} )
				await create_if_null( db, `models`, {} )

				let item = params.item

				const allIds = Object.keys( db.items[m] )
				const isNum = (!item.id || item.id == '')
				const og = item.id || ''

				let num = 1
				if ( allIds.indexOf( og ) != -1 || isNum  ) {
					item.id = og + (num++)
					while( allIds.indexOf( item.id ) != -1 ) {
						item.id = og + (num++)
					}
				}

				const model = db.models[m]
				if (!model) throw `no such model ${m}`

				const schema = await model_to_schema(model)

				const result = validate( item, schema, {required: true} )

				if (!result.valid) throw result.errors.map( e => e.stack.trim() ).join(', ').replaceAll('instance.', '')

				if ( db.items[m][item.id] ) throw `${m} item "${item.id}" already exists`

				item.created = (new Date()).toString()
				item.updated = (new Date()).toString()
				db.items[m][item.id] = item

				await save_db( n, db )
				return db.items[m][item.id]
			}
		},

		/*----------------

		view an item

		-----------------*/

		{
			url: '/:db/items/:model/:id',
			type: 'get',
			description: 'view an item',
			category: 'database',
			schema: {
			},
			data: async params => {

				const n = params.regex.db
				const m = params.regex.model
				const id = params.regex.id

				const db = await get_db( n )
				await create_if_null( db, `items.${m}`, {} )
				const item = db.items[m][id]
				if (!item) throw `${m} item "${id}" does not exist`
				return db.items[m][id]
			}
		},

		/*----------------

		update an item

		-----------------*/

		{
			url: '/:db/items/:model/:id',
			type: 'post',
			description: 'update an item',
			category: 'database',
			schema: {
				item: {
					type: 'object',
					required: true
				}
			},
			data: async params => {

				const n = params.regex.db
				const m = params.regex.model
				const id = params.regex.id

				const db = await get_db( n )
				await create_if_null( db, `items.${m}`, {} )
				const item = db.items[m][id]
				if (!item) throw `${m} item "${id}" does not exist`
				const model = db.models[m]
				if (!model) throw `no such model ${m}`
				const neu = params.item

				const schema = await model_to_schema(model)
				const result = validate( neu, schema, {required: true} )

				if (!result.valid) throw result.errors.map( e => e.stack.trim() ).join(', ')

				neu.updated = (new Date()).toString()
				db.items[m][id] = neu
				await save_db( n, db )
				return db.items[m][id]


			}
		},


		/*----------------

		delete item 

		-----------------*/

		{
			url: '/:db/items/:model/:id',
			type: 'delete',
			description: 'delete item',
			category: 'database',
			schema: {},
			data: async params => {

				const db = await get_db( params.regex.db )
				const m = params.regex.model
				const id = params.regex.id + ''
				if (!db.items[m]) throw `no such model ${m}`
				if (!db.items[m][id]) throw `no such item ${id} in ${m}`
				console.log( Object.keys( db.items[m] ))
				delete db.items[m][id]
				console.log( Object.keys( db.items[m] ))
				await save_db( params.regex.db, db )
				return params.regex

			}
		},



	]