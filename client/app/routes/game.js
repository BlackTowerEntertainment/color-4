import Ember from 'ember';

export default Ember.Route.extend({
    websocket: Ember.inject.service(),
    checkTransition : function()
    {
        if(this.get("websocket.playerID") == undefined)
            this.transitionTo("welcome");
    }.on("activate")
});
