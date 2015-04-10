import Ember from 'ember';

export default
Ember.Controller.extend({
    actions: {
        "Start Game": function () {
            console.log(this.get("name"));
            this.transitionToRoute("game");
        }
    }
});
