system.component
	.run(function(component) {
		function ScriptModule() {
			console.info('Created a script module.');
		};

		component.export('ScriptModule', ScriptModule);
	});
