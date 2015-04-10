import Ember from 'ember';

export default Ember.Route.extend({
  activate: function() {
    this.controllerFor('game').subscribe();
  },
  deactivate: function() {
    this.controllerFor('game').unsubscribe();
  }

});
