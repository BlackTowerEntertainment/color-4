import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel : function(transition)
  {
    if(transition.targetName === "index")
      this.transitionTo('welcome');
  }
});
