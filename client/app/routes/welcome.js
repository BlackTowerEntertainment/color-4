import Ember from 'ember';

export default Ember.Route.extend({
  activate: function() {
    this.controllerFor('welcome').subscribe();
  },
  deactivate: function() {
    this.controllerFor('welcome').unsubscribe();
  }
});
