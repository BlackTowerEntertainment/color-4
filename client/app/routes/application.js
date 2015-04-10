import Ember from 'ember';

export default
Ember.Route.extend({
    beforeModel: function (transition) {
        if (transition.targetName === "index")
            this.transitionTo('welcome');
    },

    activate: function () {
        this.controllerFor('welcome').subscribe();
    },
    deactivate: function () {
        this.controllerFor('welcome').unsubscribe();
    }
});
