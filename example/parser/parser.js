// Define a component module for this code file. Components are file scoped, so subsequent calls to system.component will always return the same instance.
// Calling system.component from within a function is disallowed and will intentionally throw an error. It must be within a script, and at the top level.
// State: INIT
system.component
	// Import the parser/module component as a dependency. Only valid during INIT state.
	.import('parser/module')
	// Notify the bootloader to create 'reset' and 'compile' event handlers on the component. Only valid during INIT state.
	.hook('reset')
	.hook('compile')
	// Prepare the logical phase of the component. Only valid during INIT state. Sets the state to LOGIC.
	.run(function(component, ScriptModule) {
		// This function executes after the bootloader has imported and resolved
		// all dependencies. The variable names for the arguments directly
		// correspond to the exported values from imported modules.
		// Now 'component' refers to the system.component for the code file.
		
		// The logic phase is for directly manipulating the component definition.
		// Now, the component.export(name:string, value:any) method is available.
		// If the component needs to expose values to other modules,
		// it can do so.
		
		// Here, set up event handlers for the reset and compile events.
		// If hooked but left unspecified during the logic phase,
		// an event will be unhooked and a warning printed to the console.
		component.event('reset', function() {
			console.info('parser/parser: Received reset event.');
		});
		component.event('compile', function(ScriptSource) {
			console.info('parser/parser: Received compile event.');
            ScriptSource.forEach(function(script) {
                console.log('Compiling script: ' + script.value);
                var newScript = new ScriptModule();
            });
		});
		
		// As soon as this function finishes, the module will move into
		// the BUILT phase. The component will become entirely read-only,
		// and will only respond to events.
})
// The component is made mostly read-only after the INIT phase ends.
// Most of the methods will throw errors at that point:
// 	.hook(...);
// 	.import('...');
// 	.run(...);

// Define a DOM interface that can be attached to DOM elements and consumed by components.
system.component.interface
    // Start an interface definition. Each call to 'define' will begin a new definition.
    .define('ScriptSource')
    // Specify a CSS selector to determine allowed elements. By default, all elements are allowed.
    // deny(...) will specify a selector to disallow usage. Both are cumulative, so for an element
    // to be acceptable it must pass all allow/deny steps.
    .allow('input[type="text"]')
    // Expose a value called 'value' that can be bound to HTML and consumed by a component.
    .export('value', '')
    // The interface will emit 'submit' events.
    .emit('compile')
    // Handle binding the interface to an HTML element. This will be called each time the interface
    // is instantiated.
    // 'target' refers to the DOM element, and 'interface' is the new instance of the interface.
    .bind(function(target, interface) {
        target.value = interface.value;
        // interface.watch(target:HTMLNode, domProperty:string, interfaceProperty:string)
        // Registers a watch on the DOM node for changes to a property. If the domProperty
        // does not match the interfaceProperty when polled, the interface property will be
        // updated to match. Conversely, changing the interface property will automatically
        // update the bound property.
        // Multiple properties can be bound.
        interface.watch(target, 'value', 'value');
        // interface.route(target:HTMLNode, domEvent:string, interfaceEvent:string)
        // Registers an event router for a DOM event. When the event is received by the element,
        // the corresponding event will be emitted by the interface.
        interface.route(target, 'submit', 'compile');
})
    .define('CompileButton')
    .emit('compile')
    .bind(function(target, interface) {
        interface.route(target, 'click', 'compile');
        interface.route(target, 'submit', 'compile');
})
