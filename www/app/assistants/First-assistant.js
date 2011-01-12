
function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

FirstAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	//make the scene controller available to phonegap
	PhoneGap.sceneController = this.controller;
	
	// Fix the <select> tags which don't work in WebOS!!!!!!!!!!
	this.fixSelects();
	
	// Once this is run, we know that Mojo has been loaded, so we can fire the deviceready event
	var evt = document.createEvent("Events");
	evt.initEvent("deviceready", true, true);
	document.dispatchEvent(evt);
}

FirstAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


FirstAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FirstAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

FirstAssistant.prototype.fixSelects = function() {
	
	var selects = document.querySelectorAll("select");
	
	if (selects){
		for (var i=0; i<selects.length; i++)
		{
			var el = selects[i];
			el.addEventListener('click', function(evt){
				var targ = evt.target
				var items = [];
				var opts = targ.childNodes;
				for (var i=0; i < opts.length; i++)
				{
					items.push({ label: opts[i].innerHTML, command: opts[i].value})
				}

				PhoneGap.sceneController.popupSubmenu({
				      onChoose: function(command) { 
							if (command && command != targ.value)
							{
								targ.value = command;
								if (typeof targ.onchange == 'function')
								{
									targ.onchange.call();
								}
							}
						},
				      placeNear: targ,
				      items: items
				});
			});
		}
	}
}
