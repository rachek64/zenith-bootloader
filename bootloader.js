(function () {
	var loadedScripts = [];
	var root = document.currentScript.src;
	var buildingModule = null;
	root = root.substr(0, root.lastIndexOf('/') + 1);

	function InterfaceCollection(component) {
		if (!(this instanceof InterfaceCollection))
			return new InterfaceCollection(component);
		var self = this;
		var state = 'VOID';
		var interfaces = [];

		if (!(component instanceof ComponentModule))
			throw new Error('Argument invalid.');

		self.define = function (id) {

			if (interfaces.filter(function (value) {
					return value.name === id;
				}).length != 0)
				throw new Error('An interface with that name already exists in this component.');

			console.info('Starting definition of interface ' + id);
			var int = new DOMInterface(self);
			interfaces.push(int);
			int.name = id;

			state = 'INIT';


			return self;
		};

		self.allow = function (selector) {
			if (state !== 'INIT')
				throw new Error('Cannot change usage rules when no interface has been defined.');
			console.info('Allowing ' + selector + ' on interface ' + interfaces[interfaces.length - 1].name);
			return self;
		};

		self.export = function (name, value) {
			if (state !== 'INIT')
				throw new Error('Cannot export properties when no interface has been defined.');
			console.info('Exporting ' + name + ' as', typeof value, ':', value + ' on interface ' + interfaces[interfaces.length - 1].name);
			return self;
		};

		self.emit = function (event) {
			if (state !== 'INIT')
				throw new Error('Cannot emit events when no interface has been defined.');
			console.info('Emit event', event, 'on interface ' + interfaces[interfaces.length - 1].name);
			return self;
		};

		self.bind = function (func) {
			if (state !== 'INIT')
				throw new Error('Invalid state.');

			// Eventually set binding logic.
			console.info('Binding logic defined on interface ' + interfaces[interfaces.length - 1].name);
			state = 'VOID';
			return self;
		};


		Object.freeze(self);
	}

	function DOMInterface(collection) {
		if (!(this instanceof DOMInterface))
			return new DOMInterface(collection);
		var self = this;
		if (!(collection instanceof InterfaceCollection))
			throw new Error('Argument invalid.');
	}

	var definedComponents = {};

	function ComponentModule() {
		if (!(this instanceof ComponentModule))
			return new ComponentModule();
		var self = this;

		if (!document.currentScript)
			throw new Error('Invalid component definition.');

		self.id = document.currentScript.getAttribute('componentId');

		if (definedComponents[self.id])
			return definedComponents[self.id];
		definedComponents[self.id] = self;

		var dependencies = [];
		var overrides = {};
		var hooked_events = [];
		var emit_events = [];
		var logic = null;
		var phase = 'INIT';

		var interfaces = new InterfaceCollection(self);


		self.import = function (id) {
			if (phase != 'INIT')
				throw new Error('Cannot import outside of the INIT phase. Component is currently in the ' + phase + ' phase.');

			if (dependencies.indexOf(id) !== -1)
				return;
			console.info('Importing', id, 'into', self.toString());

			dependencies.push(id);

			if (arguments.length > 1) {
				var explicitOverrides = [];
				for (var i = 1; i < arguments.length; ++i)
					explicitOverrides.push(explicitOverrides);

				overrides[id] = explicitOverrides;
			}

			return self;
		};

		self.hook = function (id) {
			if (phase != 'INIT')
				throw new Error('Cannot modify events outside of the INIT phase. Component is currently in the ' + phase + ' phase.');

			if (hooked_events.indexOf(id) !== -1)
				return;
			console.info('Hooking', id, 'for', self.toString());
			hooked_events.push(id);
			return self;
		};

		self.emit = function (id) {
			if (phase != 'INIT')
				throw new Error('Cannot modify events outside of the INIT phase. Component is currently in the ' + phase + ' phase.');

			if (emit_events.indexOf(id) !== -1)
				return;
			console.info('Event emitter for event', id, 'on', self.toString());
			hooked_events.push(id);
			return self;
		};

		self.run = function (func) {
			if (phase != 'INIT')
				throw new Error('Cannot run outside of the INIT phase. Component is currently in the ' + phase + ' phase.');
			phase = 'PREPARE';
			logic = func;
			return self;
		};

		self.build = function () {
			if (buildingModule !== self.id)
				throw new Error('Manually building a component is not allowed.');
			phase = 'BUILD';
			try {
				inject(logic, dependencies, self);
			} catch (e) {
				phase = 'PREPARE';
			}
		}

		Object.defineProperty(self, 'interface', {
			value: interfaces
		});

		Object.defineProperty(self, 'phase', {
			get: function () {
				return phase;
			}
		});

		Object.defineProperty(self, 'dependencies', {
			get: function () {
				return dependencies.slice();
			}
		});

		self.resolve = function (id) {

		}

		Object.freeze(self);
	};
	ComponentModule.prototype.toString = function () {
		return 'component$' + this.id;
	};

	function inject(func, imports, overrides, component) {
		var def = func.toString();
		def = def.substr(0, def.indexOf('{'));
		def = def.substr(def.indexOf('(') + 1);
		def = def.substr(0, def.length - 2);

		def = def.replace(/\s/g, '');
		var all = def.split(',');
		var pass = [];

		for (var i = 0, j = all.length; i < j; ++i) {
			if (all[i] === 'component') {
				pass.push(component);
				continue;
			}
			var result = resolveExport(all[i], imports, overrides);
			if (!result.found)
				throw new Error('Unresolved dependency.');
			pass.push(result.value);
		}

		console.log('Definition:');
		console.dir(all);
		console.log('Injected components:');
		console.dir(pass);
	}

	function resolveExport(exportName, imports, overrides) {
		// First, check overrides for an explicit export with that name.

		// If none found, query all imports for matching exports.
		// If there are multiple matches, throw an error.


		return {
			value: '<<' + exportName + '>>',
			found: true
		};
	}

	function getOrCreateModule() {
		// Important: Verify the component is NOT being created from within a function.
		// This is because the component needs the document.currentScript to properly register,
		// which is not available if the code segment is being run asynchronously for any
		// reason. So, components can only be directly referenced from the root scope, and
		// accessed internally through dependency injection.

		if (getOrCreateModule.caller !== null)
			throw new Error('system.component can only be accessed from the root level of a script.');

		var id = document.currentScript.getAttribute('componentId');
		var retn = definedComponents[id] || new ComponentModule();
		return retn;
	}

	var scriptIdValidator = /^([a-z0-9.-]+\/)*[a-z0-9.-]+$/i;

	function importScript(id) {
		return new Promise(function (resolve, reject) {
			if (loadedScripts.indexOf(id.toLowerCase()) != -1)
				return resolve();

			if (!scriptIdValidator.test(id))
				throw new Error('Script id of incorrect format.');

			loadedScripts.push(id.toLowerCase());
			console.info('Importing component ' + id);
			// TODO: Handle remote mapping here. Defaults to local mapping.
			var uri = root + id + '.js';
			var sct = document.createElement("script");
			sct.setAttribute('componentId', id.toLowerCase());
			sct.type = 'text/javascript';
			sct.onerror = reject;
			sct.onload = function () {
				queueLoad();
				resolve();
			}

			document.head.appendChild(sct);

			sct.src = uri;
		});
	};

	var loadId = 0;;

	function queueLoad() {
		clearTimeout(loadId);
		loadId = setTimeout(loadComponents, 2);
	}

	// Attempts to resolve the dependencies of all unfinalized components, and then build those components.
	// The process will repeat until all components are built, or the system cannot build any more components.
	function loadComponents() {
		console.log('Starting component load pass.');
		var toLoad = [];
		Object.keys(definedComponents).forEach(function (comp) {
			if (definedComponents[comp].phase === 'PREPARE') {
				console.log('Need to build ' + comp);
				toLoad.push(definedComponents[comp]);
			}
		});

		if (toLoad.length == 0)
			return;

		toLoad = toLoad.map(function (value) {
			return {
				component: value,
				imports: value.dependencies.slice(),
				dependencies: value.dependencies.slice()
			};
		});


		// Remove any imports that already exist.
		toLoad.forEach(function (comp) {
			comp.imports = comp.imports.filter(function (imp) {
				return (loadedScripts.indexOf(imp) === -1);
			});
		});

		var unloadedComponents = [];

		// Check for imports that do exist, and load them.
		// If any imports haven't been loaded, return now.
		toLoad.forEach(function (comp) {
			unloadedComponents = unloadedComponents.concat(comp.imports);
		});

		// If there are any imports that haven't been loaded, queue them all to load and return.
		// The load process will automatically queue more invocations of this function.
		if (unloadedComponents.length > 0) {
			console.info('There are ' + unloadedComponents.length + ' unloaded components.');
			unloadedComponents.forEach(function (comp) {
				importScript(comp);
			});
			return;
		}

		console.info('All component dependencies imported.');

		// Now, sort the components that need to be built to optimize load order.
		toLoad.sort(function (a, b) {
			var aInd = a.dependencies.indexOf(b.id) > -1;
			var bInd = b.dependencies.indexOf(a.id) > -1;
			if (aInd && bInd)
				throw new Error('Direct circular dependency detected between components ' + a.id + ' and ' + b.id);
			if (aInd)
				return 1;
			if (bInd)
				return -1;

			// The components are not directly related.

			if (a.dependencies.length < b.dependencies.length)
				return -1;

			if (a.dependencies.length > b.dependencies.length)
				return 1;

			return 0;
		});

		// Finally, build the components. If any build successfully and some remain, queue another build pass.
		// If all build, finish.
		// If none build, and some remain, there are unresolvable dependencies.

		var buildCount = 0;

		toLoad.forEach(function (component) {
			console.log('Building: ' + component.component);
			buildingModule = component.component.id;
			component.component.build();
			buildingModule = '';

			if (component.phase == 'PREPARE')
				return;
			if (component.phase == 'BUILT')
				buildCount++;
		});

		if (buildCount === toLoad.length)
			return;

		if (buildCount > 0)
			queueLoad();

		throw new Error('Unresolved dependencies.');
	}


	window.system = {};
	Object.defineProperty(window.system, 'component', {
		get: getOrCreateModule
	});
	Object.defineProperty(window.system, 'require', {
		value: importScript
	});
	Object.freeze(window.system);

	if (document.currentScript && document.currentScript.getAttribute('bootstrap')) {
		var id = document.currentScript.getAttribute('bootstrap');
		var ids = id.split(';');
		for (var i in ids) {
			id = ids[i];
			console.info('Bootstrapping ' + id);
			system.require(id);
		}
	}

	if (document.currentScript && document.currentScript.getAttribute('config')) {
		var url = document.currentScript.getAttribute('bootstrap');
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'text/json';
	}
}());
